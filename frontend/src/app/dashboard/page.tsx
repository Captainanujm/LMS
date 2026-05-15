"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

interface Lead {
  _id: string;
  email: string;
  fullName?: string;
  breStatus: string;
  createdAt: string;
}

interface LoanApp {
  _id: string;
  borrower: {
    _id: string;
    email: string;
    fullName?: string;
    pan?: string;
    monthlySalary?: number;
    employmentMode?: string;
  };
  loanAmount: number;
  tenure: number;
  simpleInterest: number;
  totalRepayment: number;
  status: string;
  amountPaid: number;
  outstandingBalance: number;
  createdAt: string;
  rejectionReason?: string;
}

interface Payment {
  _id: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: { email: string; fullName?: string };
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // figure out which tabs the user can see
  const getAvailableTabs = () => {
    if (!user) return [];
    if (user.role === "admin") return ["sales", "sanction", "disbursement", "collection"];
    if (user.role === "borrower") return [];
    return [user.role];
  };

  const tabs = getAvailableTabs();
  const [activeTab, setActiveTab] = useState(tabs[0] || "sales");

  // data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [applications, setApplications] = useState<LoanApp[]>([]);
  const [sanctionedLoans, setSanctionedLoans] = useState<LoanApp[]>([]);
  const [disbursedLoans, setDisbursedLoans] = useState<LoanApp[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // action states
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && user.role === "borrower") {
      router.push("/personal-details");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role !== "borrower") {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === "sales") {
        const res = await api.get("/dashboard/sales/leads");
        setLeads(res.data.leads);
      } else if (activeTab === "sanction") {
        const res = await api.get("/dashboard/sanction/applications");
        setApplications(res.data.applications);
      } else if (activeTab === "disbursement") {
        const res = await api.get("/dashboard/disbursement/loans");
        setSanctionedLoans(res.data.loans);
      } else if (activeTab === "collection") {
        const res = await api.get("/dashboard/collection/loans");
        setDisbursedLoans(res.data.loans);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      if (err.response?.status === 403) {
        setMessage({ type: "error", text: "Access denied to this module" });
      }
    }
  };

  const handleApprove = async (loanId: string) => {
    setActionLoading(true);
    try {
      await api.put(`/dashboard/sanction/${loanId}/approve`);
      setMessage({ type: "success", text: "Loan approved successfully!" });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to approve" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (loanId: string) => {
    if (!rejectReason.trim()) {
      setMessage({ type: "error", text: "Please provide a rejection reason" });
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/dashboard/sanction/${loanId}/reject`, { reason: rejectReason });
      setMessage({ type: "success", text: "Loan rejected" });
      setShowRejectModal(null);
      setRejectReason("");
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to reject" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburse = async (loanId: string) => {
    setActionLoading(true);
    try {
      await api.put(`/dashboard/disbursement/${loanId}/disburse`);
      setMessage({ type: "success", text: "Loan disbursed successfully!" });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to disburse" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (loanId: string) => {
    if (!utrNumber || !paymentAmount || !paymentDate) {
      setMessage({ type: "error", text: "All payment fields are required" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/dashboard/collection/${loanId}/payment`, {
        utrNumber,
        amount: Number(paymentAmount),
        paymentDate,
      });
      setMessage({ type: "success", text: res.data.message });
      setPaymentForm(null);
      setUtrNumber("");
      setPaymentAmount("");
      setPaymentDate("");
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to record payment" });
    } finally {
      setActionLoading(false);
    }
  };

  const viewPayments = async (loanId: string) => {
    try {
      const res = await api.get(`/dashboard/collection/${loanId}/payments`);
      setPayments(res.data.payments);
      setSelectedLoanId(loanId);
    } catch (err: any) {
      setMessage({ type: "error", text: "Failed to load payments" });
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><p>Loading...</p></div>;
  if (!user || user.role === "borrower") return null;

  const tabColors: Record<string, string> = {
    sales: "#3b82f6",
    sanction: "#f59e0b",
    disbursement: "#a855f7",
    collection: "#22c55e",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1100px", margin: "0 auto 24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>
            <span style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LMS</span>
            {" "}Dashboard
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "2px" }}>
            Logged in as <span style={{ color: "#94a3b8" }}>{user.email}</span> ({user.role})
          </p>
        </div>
        <button onClick={logout} style={{ background: "none", border: "1px solid #334155", padding: "8px 20px", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
          Logout
        </button>
      </div>

      {/* tabs */}
      <div style={{ maxWidth: "1100px", margin: "0 auto 24px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setMessage({ type: "", text: "" }); }}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                border: activeTab === tab ? `2px solid ${tabColors[tab]}` : "1px solid #334155",
                background: activeTab === tab ? `${tabColors[tab]}15` : "transparent",
                color: activeTab === tab ? tabColors[tab] : "#94a3b8",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* messages */}
      {message.text && (
        <div style={{ maxWidth: "1100px", margin: "0 auto 16px" }}>
          <div className={message.type === "error" ? "error-box" : "success-box"}>
            {message.type === "success" ? "✅ " : "❌ "}{message.text}
          </div>
        </div>
      )}

      {/* content */}
      <div className="glass-card animate-in" style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* SALES MODULE */}
        {activeTab === "sales" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>Sales - Lead Tracking</h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>Users who registered but haven&apos;t applied for a loan yet</p>

            {leads.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No leads found</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>BRE Status</th>
                      <th>Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead._id}>
                        <td>{lead.email}</td>
                        <td>{lead.fullName || "—"}</td>
                        <td><span className={`badge badge-${lead.breStatus === "passed" ? "closed" : lead.breStatus === "failed" ? "rejected" : "applied"}`}>{lead.breStatus}</span></td>
                        <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SANCTION MODULE */}
        {activeTab === "sanction" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>Sanction - Loan Applications</h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>Review and approve/reject loan applications</p>

            {applications.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No pending applications</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Amount</th>
                      <th>Tenure</th>
                      <th>Total Repay</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id}>
                        <td>
                          <div>{app.borrower.fullName || app.borrower.email}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{app.borrower.email}</div>
                        </td>
                        <td>₹{app.loanAmount.toLocaleString()}</td>
                        <td>{app.tenure} days</td>
                        <td>₹{app.totalRepayment.toFixed(2)}</td>
                        <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="btn-success" onClick={() => handleApprove(app._id)} disabled={actionLoading}>
                              Approve
                            </button>
                            <button className="btn-danger" onClick={() => setShowRejectModal(app._id)} disabled={actionLoading}>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
              <div style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 100
              }}>
                <div className="glass-card" style={{ maxWidth: "400px", width: "90%" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Reject Loan</h3>
                  <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>Please provide a reason for rejection</p>
                  <textarea
                    className="form-input"
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    style={{ resize: "vertical", marginBottom: "16px" }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-danger" onClick={() => handleReject(showRejectModal)} disabled={actionLoading} style={{ flex: 1 }}>
                      {actionLoading ? "Rejecting..." : "Confirm Reject"}
                    </button>
                    <button onClick={() => { setShowRejectModal(null); setRejectReason(""); }}
                      style={{ flex: 1, padding: "8px", background: "none", border: "1px solid #334155", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DISBURSEMENT MODULE */}
        {activeTab === "disbursement" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>Disbursement - Sanctioned Loans</h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>Mark sanctioned loans as disbursed (funds released)</p>

            {sanctionedLoans.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No sanctioned loans pending disbursement</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Amount</th>
                      <th>Tenure</th>
                      <th>Total Repay</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanctionedLoans.map((loan) => (
                      <tr key={loan._id}>
                        <td>
                          <div>{loan.borrower.fullName || loan.borrower.email}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{loan.borrower.email}</div>
                        </td>
                        <td>₹{loan.loanAmount.toLocaleString()}</td>
                        <td>{loan.tenure} days</td>
                        <td>₹{loan.totalRepayment.toFixed(2)}</td>
                        <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="btn-success" onClick={() => handleDisburse(loan._id)} disabled={actionLoading}>
                            Disburse
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* COLLECTION MODULE */}
        {activeTab === "collection" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>Collection - Active Loans</h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>Record payments for disbursed loans</p>

            {disbursedLoans.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No active loans</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Amount</th>
                      <th>Total Repay</th>
                      <th>Paid</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disbursedLoans.map((loan) => (
                      <tr key={loan._id}>
                        <td>
                          <div>{loan.borrower.fullName || loan.borrower.email}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{loan.borrower.email}</div>
                        </td>
                        <td>₹{loan.loanAmount.toLocaleString()}</td>
                        <td>₹{loan.totalRepayment.toFixed(2)}</td>
                        <td style={{ color: "#22c55e" }}>₹{loan.amountPaid.toFixed(2)}</td>
                        <td style={{ color: loan.outstandingBalance > 0 ? "#f59e0b" : "#22c55e" }}>
                          ₹{loan.outstandingBalance.toFixed(2)}
                        </td>
                        <td><span className={`badge badge-${loan.status}`}>{loan.status}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {loan.status === "disbursed" && (
                              <button className="btn-success" onClick={() => setPaymentForm(loan._id)}>
                                + Payment
                              </button>
                            )}
                            <button
                              onClick={() => viewPayments(loan._id)}
                              style={{ padding: "8px 16px", background: "none", border: "1px solid #334155", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}
                            >
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payment Form Modal */}
            {paymentForm && (
              <div style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 100
              }}>
                <div className="glass-card" style={{ maxWidth: "420px", width: "90%" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Record Payment</h3>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#94a3b8" }}>UTR Number</label>
                    <input className="form-input" placeholder="Enter unique UTR number" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} />
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#94a3b8" }}>Amount (₹)</label>
                    <input type="number" className="form-input" placeholder="Enter payment amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#94a3b8" }}>Payment Date</label>
                    <input type="date" className="form-input" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-success" onClick={() => handleRecordPayment(paymentForm)} disabled={actionLoading} style={{ flex: 1 }}>
                      {actionLoading ? "Recording..." : "Record Payment"}
                    </button>
                    <button onClick={() => { setPaymentForm(null); setUtrNumber(""); setPaymentAmount(""); setPaymentDate(""); }}
                      style={{ flex: 1, padding: "8px", background: "none", border: "1px solid #334155", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History Modal */}
            {selectedLoanId && (
              <div style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 100
              }}>
                <div className="glass-card" style={{ maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Payment History</h3>
                    <button onClick={() => setSelectedLoanId(null)}
                      style={{ background: "none", border: "1px solid #334155", padding: "4px 12px", borderRadius: "6px", color: "#94a3b8", cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>

                  {payments.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No payments recorded yet</p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>UTR</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p._id}>
                            <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{p.utrNumber}</td>
                            <td>₹{p.amount.toFixed(2)}</td>
                            <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td>{p.recordedBy.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
