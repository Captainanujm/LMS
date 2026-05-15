import mongoose, { Schema, Document } from "mongoose";

export interface ILoanApplication extends Document {
  borrower: mongoose.Types.ObjectId;
  loanAmount: number;
  tenure: number; // in days
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: "applied" | "sanctioned" | "rejected" | "disbursed" | "closed";
  rejectionReason?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  disbursedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedAt?: Date;
  closedAt?: Date;
  amountPaid: number;
  outstandingBalance: number;
}

const loanApplicationSchema = new Schema<ILoanApplication>(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 50000,
      max: 500000,
    },
    tenure: {
      type: Number,
      required: true,
      min: 30,
      max: 365,
    },
    interestRate: {
      type: Number,
      default: 12,
    },
    simpleInterest: {
      type: Number,
      required: true,
    },
    totalRepayment: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "sanctioned", "rejected", "disbursed", "closed"],
      default: "applied",
    },
    rejectionReason: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: "User" },
    disbursedBy: { type: Schema.Types.ObjectId, ref: "User" },
    sanctionedAt: { type: Date },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
    amountPaid: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ILoanApplication>("LoanApplication", loanApplicationSchema);
