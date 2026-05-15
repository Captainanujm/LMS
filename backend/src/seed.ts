import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";

const users: { email: string; password: string; role: "admin" | "sales" | "sanction" | "disbursement" | "collection" | "borrower" }[] = [
  { email: "admin@lms.com", password: "Admin@123", role: "admin" },
  { email: "sales@lms.com", password: "Sales@123", role: "sales" },
  { email: "sanction@lms.com", password: "Sanction@123", role: "sanction" },
  { email: "disbursement@lms.com", password: "Disbursement@123", role: "disbursement" },
  { email: "collection@lms.com", password: "Collection@123", role: "collection" },
  { email: "borrower@lms.com", password: "Borrower@123", role: "borrower" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to MongoDB");

    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      await User.create({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      });

      console.log(`Created user: ${userData.email} (${userData.role})`);
    }

    console.log("\nSeed completed!");
    console.log("\nLogin credentials:");
    console.log("==================");
    users.forEach((u) => {
      console.log(`${u.role.toUpperCase()}: ${u.email} / ${u.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
