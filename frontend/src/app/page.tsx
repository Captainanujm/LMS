"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // redirect based on role
    if (user.role === "borrower") {
      router.push("/personal-details");
    } else {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p style={{ color: "#94a3b8" }}>Loading...</p>
    </div>
  );
}
