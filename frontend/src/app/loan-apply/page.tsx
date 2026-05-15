"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

export default function LoanApplyPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenure, setTenure] = useState(180);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const interestRate = 12; // fixed 12% p.a.

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && user.role !== "borrower") {
      router.push("/dashboard");
    }
    if (!loading && user && user.breStatus !== "passed") {
      router.push("/personal-details");
    }
    if (!loading && user && !user.salarySlipUrl) {
      router.push("/upload-salary-slip");
    }
  }, [user, loading, router]);

  // calculate simple interest
  const si = (loanAmount * interestRate * tenure) / (365 * 100);
  const totalRepayment = loanAmount + si;

  const handleApply = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await api.post("/borrower/apply-loan", {
        loanAmount,
        tenure,
      });

      setSuccess(res.data.message);
      setTimeout(() => {
        router.push("/my-loans");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><p>Loading...</p></div>;
  if (!user || user.role !== "borrower") return null;

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "700px", margin: "0 auto 24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
          <span style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LMS</span>
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.push("/my-loans")} style={{ background: "none", border: "1px solid #334155", padding: "6px 16px", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
            My Loans
          </button>
          <button onClick={logout} style={{ background: "none", border: "1px solid #334155", padding: "6px 16px", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
            Logout
          </button>
        </div>
      </div>

      {/* step indicator */}
      <div style={{ maxWidth: "700px", margin: "0 auto 24px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
          {["Personal Details", "Salary Slip", "Loan Apply"].map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "#38bdf8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 600
              }}>
                {i < 2 ? "✓" : "3"}
              </div>
              <span style={{ fontSize: "13px", color: "#f1f5f9" }}>{step}</span>
              {i < 2 && <div style={{ width: "30px", height: "2px", background: "#38bdf8" }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card animate-in" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Configure Your Loan</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "32px" }}>Adjust the sliders to see your repayment details</p>

        {error && <div className="error-box" style={{ marginBottom: "16px" }}>{error}</div>}
        {success && <div className="success-box" style={{ marginBottom: "16px" }}>✅ {success}</div>}

        {/* Loan Amount Slider */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <label style={{ fontSize: "14px", fontWeight: 500, color: "#94a3b8" }}>Loan Amount</label>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#38bdf8" }}>₹{loanAmount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={50000}
            max={500000}
            step={10000}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            <span>₹50,000</span>
            <span>₹5,00,000</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <label style={{ fontSize: "14px", fontWeight: 500, color: "#94a3b8" }}>Tenure</label>
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#38bdf8" }}>{tenure} days</span>
          </div>
          <input
            type="range"
            min={30}
            max={365}
            step={1}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            <span>30 days</span>
            <span>365 days</span>
          </div>
        </div>

        {/* Calculation Panel */}
        <div style={{
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          border: "1px solid rgba(56, 189, 248, 0.15)"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#94a3b8" }}>Loan Summary</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Principal Amount</p>
              <p style={{ fontSize: "18px", fontWeight: 600 }}>₹{loanAmount.toLocaleString()}</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Interest Rate</p>
              <p style={{ fontSize: "18px", fontWeight: 600 }}>{interestRate}% p.a.</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Simple Interest</p>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#f59e0b" }}>₹{si.toFixed(2)}</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Total Repayment</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#22c55e" }}>₹{totalRepayment.toFixed(2)}</p>
            </div>
          </div>

          <div style={{ marginTop: "12px", padding: "10px", background: "rgba(56, 189, 248, 0.05)", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#64748b" }}>
              Formula: SI = (P × R × T) / (365 × 100) = ({loanAmount} × {interestRate} × {tenure}) / (365 × 100) = ₹{si.toFixed(2)}
            </p>
          </div>
        </div>

        <button onClick={handleApply} className="btn-primary" disabled={submitting}>
          {submitting ? "Submitting Application..." : "Apply for Loan"}
        </button>

        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <button onClick={() => router.push("/upload-salary-slip")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
            ← Back to Upload Salary Slip
          </button>
        </div>
      </div>
    </div>
  );
}
