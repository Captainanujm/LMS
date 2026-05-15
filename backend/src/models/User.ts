import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  role: "borrower" | "admin" | "sales" | "sanction" | "disbursement" | "collection";
  fullName?: string;
  pan?: string;
  dateOfBirth?: Date;
  monthlySalary?: number;
  employmentMode?: "salaried" | "self-employed" | "unemployed";
  breStatus: "pending" | "passed" | "failed";
  breErrors: string[];
  salarySlipUrl?: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["borrower", "admin", "sales", "sanction", "disbursement", "collection"],
      default: "borrower",
    },
    fullName: { type: String },
    pan: { type: String },
    dateOfBirth: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ["salaried", "self-employed", "unemployed"],
    },
    breStatus: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
    },
    breErrors: [{ type: String }],
    salarySlipUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
