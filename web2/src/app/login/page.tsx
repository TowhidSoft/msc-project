"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name || user.email}!`);
      router.push("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div className="page-enter" style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
            }}
          >
            <BookOpen size={30} color="white" />
          </div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            <span className="gradient-text">Welcome back</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Sign in to your BookStore account
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email */}
            <div>
              <label
                style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}
              >
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute", left: "14px", top: "50%",
                    transform: "translateY(-50%)", color: "var(--text-secondary)",
                  }}
                />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: "42px" }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute", left: "14px", top: "50%",
                    transform: "translateY(-50%)", color: "var(--text-secondary)",
                  }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  className="input-field"
                  style={{ paddingLeft: "42px", paddingRight: "42px" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: "14px", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", color: "var(--text-secondary)",
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? (
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "var(--accent-light)", fontWeight: 600, textDecoration: "none" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
