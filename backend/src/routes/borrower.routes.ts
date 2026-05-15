import { Router } from "express";
import { auth, authorize } from "../middleware/auth";
import upload from "../middleware/upload";
import {
  submitPersonalDetails,
  uploadSalarySlip,
  applyLoan,
  getMyLoans,
  getProfile,
} from "../controllers/borrower.controller";

const router = Router();

// all borrower routes need auth + borrower role
router.use(auth);
router.use(authorize("borrower"));

router.post("/personal-details", submitPersonalDetails);
router.post("/upload-salary-slip", upload.single("salarySlip"), uploadSalarySlip);
router.post("/apply-loan", applyLoan);
router.get("/my-loans", getMyLoans);
router.get("/profile", getProfile);

export default router;
