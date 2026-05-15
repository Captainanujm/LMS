import { Router } from "express";
import { auth, authorize } from "../middleware/auth";
import {
  getLeads,
  getApplications,
  approveLoan,
  rejectLoan,
  getSanctionedLoans,
  disburseLoan,
  getDisbursedLoans,
  recordPayment,
  getLoanPayments,
} from "../controllers/dashboard.controller";

const router = Router();

// all dashboard routes need auth
router.use(auth);

// Sales module - only sales & admin
router.get("/sales/leads", authorize("sales", "admin"), getLeads);

// Sanction module - only sanction & admin
router.get("/sanction/applications", authorize("sanction", "admin"), getApplications);
router.put("/sanction/:loanId/approve", authorize("sanction", "admin"), approveLoan);
router.put("/sanction/:loanId/reject", authorize("sanction", "admin"), rejectLoan);

// Disbursement module - only disbursement & admin
router.get("/disbursement/loans", authorize("disbursement", "admin"), getSanctionedLoans);
router.put("/disbursement/:loanId/disburse", authorize("disbursement", "admin"), disburseLoan);

// Collection module - only collection & admin
router.get("/collection/loans", authorize("collection", "admin"), getDisbursedLoans);
router.post("/collection/:loanId/payment", authorize("collection", "admin"), recordPayment);
router.get("/collection/:loanId/payments", authorize("collection", "admin"), getLoanPayments);

export default router;
