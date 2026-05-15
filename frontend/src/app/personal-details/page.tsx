"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

export default function PersonalDetailsPage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [pan, setPan] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [employmentMode, setEmploymentMode] = useState("");
  const [error, setError] = useState("");
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && user.role !== "borrower") {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // if BRE already passed, redirect to next step
  useEffect(() => {
    if (user && user.breStatus === "passed") {
      // pre-fill the form if they come back
      if (user.fullName) setFullName(user.fullName);
      if (user.pan) setPan(user.pan);
      if (user.dateOfBirth) setDateOfBirth(user.dateOfBirth.split("T")[0]);
      if (user.monthlySalary) setMonthlySalary(user.monthlySalary.toString());
      if (user.employmentMode) setEmploymentMode(user.employmentMode);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBreErrors([]);
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await api.post("/borrower/personal-details", {
        fullName,
        pan: pan.toUpperCase(),
        dateOfBirth,
        monthlySalary: Number(monthlySalary),
        employmentMode,
      });

      setSuccess(res.data.message);
      await refreshUser();

      // go to next step after a short delay
      setTimeout(() => {
        router.push("/upload-salary-slip");
      }, 1500);
    } catch (err: any) {
      if (err.response?.data?.breResult) {
        setBreErrors(err.response.data.breResult.errors);
      } else {
        setError(err.response?.data?.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><p>Loading...</p></div>;
  if (!user || user.role !== "borrower") return null;

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "600px", margin: "0 auto 24px", padding: "0 4px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
          <span style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LMS</span>
        </h1>
        <button onClick={logout} style={{ background: "none", border: "1px solid #334155", padding: "6px 16px", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
          Logout
        </button>
      </div>

      {/* step indicator */}
      <div style={{ maxWidth: "600px", margin: "0 auto 24px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
          {["Personal Details", "Salary Slip", "Loan Apply"].map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: i === 0 ? "#38bdf8" : "#334155",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 600
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: "13px", color: i === 0 ? "#f1f5f9" : "#64748b" }}>{step}</span>
              {i < 2 && <div style={{ width: "30px", height: "2px", background: "#334155" }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card animate-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Personal Details</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>Fill in your details for eligibility check</p>

        {error && <div className="error-box" style={{ marginBottom: "16px" }}>{error}</div>}

        {breErrors.length > 0 && (
          <div className="error-box" style={{ marginBottom: "16px" }}>
            <p style={{ fontWeight: 600, marginBottom: "8px" }}>❌ Eligibility Check Failed:</p>
            <ul style={{ paddingLeft: "18px", margin: 0 }}>
              {breErrors.map((err, i) => (
                <li key={i} style={{ marginBottom: "4px" }}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {success && <div className="success-box" style={{ marginBottom: "16px" }}>✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#94a3b8" }}>Full Name</label>
            <input className="form-input" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#94a3b8" }}>PAN Number</label>
            <input className="form-input" placeholder="e.g. ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} required />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#94a3b8" }}>Date of Birth</label>
            <input type="date" className="form-input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#94a3b8" }}>Monthly Salary (₹)</label>
            <input type="number" className="form-input" placeholder="e.g. 50000" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} required />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#94a3b8" }}>Employment Mode</label>
            <select className="form-input" value={employmentMode} onChange={(e) => setEmploymentMode(e.target.value)} required>
              <option value="">Select employment type</option>
              <option value="salaried">Salaried</option>
              <option value="self-employed">Self-Employed</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Checking eligibility..." : "Submit & Check Eligibility"}
          </button>
        </form>

        {user.breStatus === "passed" && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button onClick={() => router.push("/upload-salary-slip")} className="btn-primary" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              Continue to Next Step →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
