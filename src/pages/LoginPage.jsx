import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";

const LoginPage = () => {
  const { user, operator } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && operator?.status === "approved") navigate("/dashboard");
    else if (user && operator?.status === "pending") navigate("/pending");
    else if (user && !operator) navigate("/apply");
  }, [user, operator]);

  const handleSubmit = async () => {
    if (!email || !password) return toast.error("Enter email and password");
    setLoading(true);

    const { error } = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) return toast.error(error.message);

    if (mode === "signup") {
      toast.success("Account created! Check your email to confirm.");
    }
    // redirect handled by useEffect watching user/operator
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
  };

  const inp = {
    width: "100%", padding: "10px 14px",
    border: "0.5px solid var(--border)",
    borderRadius: 8, fontSize: 14, outline: "none",
    background: "var(--white)", color: "var(--text-primary)",
    boxSizing: "border-box",
  };

  const lbl = {
    display: "block", fontSize: 13, fontWeight: 500,
    marginBottom: 6, color: "var(--text-primary)",
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "24px",
    }}>
      <div style={{
        background: "var(--white)",
        border: "0.5px solid var(--border)",
        borderRadius: 16, padding: "40px 36px",
        width: "100%", maxWidth: 400,
      }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--olive-dark)" }}>
            Triply{" "}
            <span style={{
              fontSize: 11, fontWeight: 500, color: "var(--olive)",
              background: "var(--olive-light)", padding: "2px 8px",
              borderRadius: 20, marginLeft: 4,
            }}>
              Partners
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 16, marginBottom: 6 }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {mode === "signin"
              ? "Sign in to your operator dashboard"
              : "Sign up to apply as a Triply operator"}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "flex", background: "var(--bg)",
          borderRadius: 10, padding: 4, marginBottom: 24,
        }}>
          {["signin", "signup"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: mode === m ? "var(--white)" : "transparent",
              color: mode === m ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={inp}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={inp}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            background: loading ? "#9aad6f" : "var(--olive)",
            color: "white", border: "none", borderRadius: 10,
            fontSize: 15, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "Please wait…"
            : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
        }}>
          <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>or</span>
          <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: "100%", padding: "11px",
            background: "var(--white)",
            border: "0.5px solid var(--border)",
            borderRadius: 10, fontSize: 14, fontWeight: 500,
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle link */}
        <p style={{
          textAlign: "center", fontSize: 13,
          color: "var(--text-secondary)", marginTop: 20,
        }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{
              color: "var(--olive)", fontWeight: 500,
              background: "none", border: "none", cursor: "pointer", fontSize: 13,
            }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

        {/* Apply link */}
        <p style={{
          textAlign: "center", fontSize: 12,
          color: "var(--text-tertiary)", marginTop: 8,
        }}>
          Want to become a partner?{" "}
          <Link to="/apply" style={{ color: "var(--olive)" }}>Apply here</Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
