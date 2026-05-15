"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

interface Loan {
  _id: string;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: string;
  rejectionReason?: string;
  amountPaid: number;
  outstandingBalance: number;
  createdAt: string;
}

export default function MyLoansPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && user.role !== "borrower") {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "borrower") {
      fetchLoans();
    }
  }, [user]);

  const fetchLoans = async () => {
    try {
      const res = await api.get("/borrower/my-loans");
      setLoans(res.data.loans);
    } catch (err) {
      console.error("Failed to fetch loans", err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><p>Loading...</p></div>;
  if (!user || user.role !== "borrower") return null;

  const getStatusBadge = (status: string) => {
    return <span className={`badge badge-${status}`}>{status}</span>;
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "900px", margin: "0 auto 24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600 }}>
          <span style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LMS</span>
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.push("/loan-apply")} style={{ background: "none", border: "1px solid #38bdf8", padding: "6px 16px", borderRadius: "8px", color: "#38bdf8", cursor: "pointer", fontSize: "13px" }}>
            + New Loan
          </button>
          <button onClick={logout} style={{ background: "none", border: "1px solid #334155", padding: "6px 16px", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
            Logout
          </button>
        </div>
      </div>

      <div className="glass-card animate-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>My Loan Applications</h2>

        {loans.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "16px" }}>No loan applications yet</p>
            <button onClick={() => router.push("/loan-apply")} className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
              Apply for a Loan
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Tenure</th>
                  <th>Interest</th>
                  <th>Total Repay</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan._id}>
                    <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                    <td>₹{loan.loanAmount.toLocaleString()}</td>
                    <td>{loan.tenure} days</td>
                    <td>₹{loan.simpleInterest.toFixed(2)}</td>
                    <td>₹{loan.totalRepayment.toFixed(2)}</td>
                    <td>₹{loan.amountPaid.toFixed(2)}</td>
                    <td>₹{loan.outstandingBalance.toFixed(2)}</td>
                    <td>
                      {getStatusBadge(loan.status)}
                      {loan.rejectionReason && (
                        <p style={{ fontSize: "11px", color: "#f87171", marginTop: "4px" }}>
                          Reason: {loan.rejectionReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
