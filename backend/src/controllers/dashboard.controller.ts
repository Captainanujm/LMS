import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";
import LoanApplication from "../models/LoanApplication";
import Payment from "../models/Payment";

// ========== SALES ==========

// GET /api/dashboard/sales/leads
// Users who registered but haven't applied for a loan yet
export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    // get all borrowers
    const borrowers = await User.find({ role: "borrower" }).select("-password").sort({ createdAt: -1 });

    // find borrowers who have at least one loan application
    const borrowerIdsWithLoans = await LoanApplication.distinct("borrower");

    // filter to only those without any loan applications
    const leads = borrowers.filter(
      (b) => !borrowerIdsWithLoans.some((id) => id.toString() === b._id.toString())
    );

    res.json({ leads });
  } catch (error: any) {
    console.error("Get leads error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========== SANCTION ==========

// GET /api/dashboard/sanction/applications
export const getApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await LoanApplication.find({ status: "applied" })
      .populate("borrower", "-password")
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (error: any) {
    console.error("Get applications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/dashboard/sanction/:loanId/approve
export const approveLoan = async (req: AuthRequest, res: Response) => {
  try {
    const loan = await LoanApplication.findById(req.params.loanId);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status !== "applied") {
      return res.status(400).json({ message: "Loan can only be approved from 'applied' status" });
    }

    loan.status = "sanctioned";
    loan.sanctionedBy = req.user._id;
    loan.sanctionedAt = new Date();
    await loan.save();

    res.json({ message: "Loan approved successfully", loan });
  } catch (error: any) {
    console.error("Approve loan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/dashboard/sanction/:loanId/reject
export const rejectLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const loan = await LoanApplication.findById(req.params.loanId);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status !== "applied") {
      return res.status(400).json({ message: "Loan can only be rejected from 'applied' status" });
    }

    loan.status = "rejected";
    loan.rejectionReason = reason;
    loan.sanctionedBy = req.user._id;
    await loan.save();

    res.json({ message: "Loan rejected", loan });
  } catch (error: any) {
    console.error("Reject loan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========== DISBURSEMENT ==========

// GET /api/dashboard/disbursement/loans
export const getSanctionedLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await LoanApplication.find({ status: "sanctioned" })
      .populate("borrower", "-password")
      .sort({ createdAt: -1 });
    res.json({ loans });
  } catch (error: any) {
    console.error("Get sanctioned loans error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/dashboard/disbursement/:loanId/disburse
export const disburseLoan = async (req: AuthRequest, res: Response) => {
  try {
    const loan = await LoanApplication.findById(req.params.loanId);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status !== "sanctioned") {
      return res.status(400).json({ message: "Loan can only be disbursed from 'sanctioned' status" });
    }

    loan.status = "disbursed";
    loan.disbursedBy = req.user._id;
    loan.disbursedAt = new Date();
    await loan.save();

    res.json({ message: "Loan disbursed successfully", loan });
  } catch (error: any) {
    console.error("Disburse loan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========== COLLECTION ==========

// GET /api/dashboard/collection/loans
export const getDisbursedLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await LoanApplication.find({ status: { $in: ["disbursed", "closed"] } })
      .populate("borrower", "-password")
      .sort({ createdAt: -1 });
    res.json({ loans });
  } catch (error: any) {
    console.error("Get disbursed loans error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/dashboard/collection/:loanId/payment
export const recordPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { utrNumber, amount, paymentDate } = req.body;

    if (!utrNumber || !amount || !paymentDate) {
      return res.status(400).json({ message: "UTR number, amount, and payment date are required" });
    }

    const loan = await LoanApplication.findById(req.params.loanId);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status !== "disbursed") {
      return res.status(400).json({ message: "Payments can only be recorded for disbursed loans" });
    }

    // check for duplicate UTR
    const existingPayment = await Payment.findOne({ utrNumber });
    if (existingPayment) {
      return res.status(409).json({ message: "This UTR number has already been used" });
    }

    const paymentAmount = Number(amount);

    // payment should not exceed outstanding balance
    if (paymentAmount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    if (paymentAmount > loan.outstandingBalance) {
      return res.status(400).json({
        message: `Payment amount cannot exceed outstanding balance of ₹${loan.outstandingBalance.toFixed(2)}`,
      });
    }

    // create payment record
    const payment = await Payment.create({
      loan: loan._id,
      borrower: loan.borrower,
      utrNumber,
      amount: paymentAmount,
      paymentDate: new Date(paymentDate),
      recordedBy: req.user._id,
    });

    // update loan amounts
    loan.amountPaid = Math.round((loan.amountPaid + paymentAmount) * 100) / 100;
    loan.outstandingBalance = Math.round((loan.totalRepayment - loan.amountPaid) * 100) / 100;

    // auto close if fully paid
    if (loan.outstandingBalance <= 0) {
      loan.status = "closed";
      loan.closedAt = new Date();
      loan.outstandingBalance = 0;
    }

    await loan.save();

    res.status(201).json({
      message: loan.status === "closed" ? "Payment recorded. Loan is now closed!" : "Payment recorded successfully",
      payment,
      loan,
    });
  } catch (error: any) {
    console.error("Record payment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/dashboard/collection/:loanId/payments
export const getLoanPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find({ loan: req.params.loanId })
      .populate("recordedBy", "email fullName")
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error: any) {
    console.error("Get payments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
