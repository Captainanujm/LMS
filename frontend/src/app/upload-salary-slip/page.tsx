"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

export default function UploadSalarySlipPage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

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
  }, [user, loading, router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    // check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // check file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are allowed");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("salarySlip", file);

      const res = await api.post("/borrower/upload-salary-slip", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Salary slip uploaded successfully!");
      await refreshUser();

      setTimeout(() => {
        router.push("/loan-apply");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><p>Loading...</p></div>;
  if (!user || user.role !== "borrower") return null;

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "600px", margin: "0 auto 24px" }}>
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
                background: i <= 1 ? "#38bdf8" : "#334155",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 600
              }}>
                {i === 0 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: "13px", color: i <= 1 ? "#f1f5f9" : "#64748b" }}>{step}</span>
              {i < 2 && <div style={{ width: "30px", height: "2px", background: i < 1 ? "#38bdf8" : "#334155" }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card animate-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Upload Salary Slip</h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>Upload your latest salary slip (PDF, JPG, or PNG, max 5MB)</p>

        {error && <div className="error-box" style={{ marginBottom: "16px" }}>{error}</div>}
        {success && <div className="success-box" style={{ marginBottom: "16px" }}>✅ {success}</div>}

        {user.salarySlipUrl && (
          <div className="success-box" style={{ marginBottom: "16px" }}>
            ✅ Salary slip already uploaded. You can upload a new one or continue.
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              border: "2px dashed #334155",
              borderRadius: "12px",
              padding: "40px 20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) setFile(e.target.files[0]);
                }}
              />
              {file ? (
                <div>
                  <p style={{ fontSize: "16px", marginBottom: "4px" }}>📄 {file.name}</p>
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "32px", marginBottom: "8px" }}>📁</p>
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>Click to select a file</p>
                  <p style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>PDF, JPG, PNG • Max 5MB</p>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={uploading || !file}>
            {uploading ? "Uploading..." : "Upload & Continue"}
          </button>
        </form>

        {user.salarySlipUrl && (
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <button onClick={() => router.push("/loan-apply")} className="btn-primary" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              Skip to Loan Application →
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <button onClick={() => router.push("/personal-details")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}>
            ← Back to Personal Details
          </button>
        </div>
      </div>
    </div>
  );
}
