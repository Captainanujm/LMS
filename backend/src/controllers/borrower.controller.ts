import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";
import LoanApplication from "../models/LoanApplication";
import { runBRE } from "../services/bre";

// POST /api/borrower/personal-details
export const submitPersonalDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // run BRE checks
    const breResult = runBRE({
      fullName,
      pan: pan.toUpperCase(),
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary: Number(monthlySalary),
      employmentMode,
    });

    // update user with personal details + bre result
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        fullName,
        pan: pan.toUpperCase(),
        dateOfBirth: new Date(dateOfBirth),
        monthlySalary: Number(monthlySalary),
        employmentMode,
        breStatus: breResult.passed ? "passed" : "failed",
        breErrors: breResult.errors,
      },
      { new: true }
    );

    if (!breResult.passed) {
      return res.status(400).json({
        message: "Eligibility check failed",
        breResult,
      });
    }

    res.json({
      message: "Personal details saved. Eligibility check passed!",
      breResult,
    });
  } catch (error: any) {
    console.error("Personal details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/borrower/upload-salary-slip
export const uploadSalarySlip = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    // save file path to user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { salarySlipUrl: req.file.filename },
      { new: true }
    );

    res.json({
      message: "Salary slip uploaded successfully",
      fileUrl: req.file.filename,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/borrower/apply-loan
export const applyLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { loanAmount, tenure } = req.body;

    // check if BRE passed
    const user = await User.findById(req.user._id);
    if (!user || user.breStatus !== "passed") {
      return res.status(400).json({ message: "Please complete eligibility check first" });
    }

    // check if salary slip uploaded
    if (!user.salarySlipUrl) {
      return res.status(400).json({ message: "Please upload salary slip first" });
    }

    // validate loan amount and tenure
    const amount = Number(loanAmount);
    const days = Number(tenure);

    if (amount < 50000 || amount > 500000) {
      return res.status(400).json({ message: "Loan amount must be between ₹50,000 and ₹5,00,000" });
    }

    if (days < 30 || days > 365) {
      return res.status(400).json({ message: "Tenure must be between 30 and 365 days" });
    }

    // calculate simple interest
    const interestRate = 12;
    const si = (amount * interestRate * days) / (365 * 100);
    const totalRepayment = Math.round((amount + si) * 100) / 100;
    const simpleInterest = Math.round(si * 100) / 100;

    // create loan application
    const loan = await LoanApplication.create({
      borrower: req.user._id,
      loanAmount: amount,
      tenure: days,
      interestRate,
      simpleInterest,
      totalRepayment,
      status: "applied",
      outstandingBalance: totalRepayment,
    });

    res.status(201).json({
      message: "Loan application submitted successfully!",
      loan,
    });
  } catch (error: any) {
    console.error("Apply loan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/borrower/my-loans
export const getMyLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await LoanApplication.find({ borrower: req.user._id }).sort({ createdAt: -1 });
    res.json({ loans });
  } catch (error: any) {
    console.error("Get loans error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/borrower/profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ user });
  } catch (error: any) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
