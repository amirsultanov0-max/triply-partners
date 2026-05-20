import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";

const LANGUAGES = [
  "English", "Russian", "Uzbek",
  "German", "French", "Spanish", "Chinese", "Arabic",
];

const ApplyPage = () => {
  const { user, operator, reloadOperator } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wasRejected = searchParams.get("rejected") === "true";

  const [step, setStep] = useState("form"); // "form" | "success"
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    email: user?.email || "",
    bio: "",
    website: "",
    languages: [],
  });

  useEffect(() => {
    if (operator?.status === "approved") navigate("/dashboard");
    if (operator?.status === "pending") navigate("/pending");
  }, [operator]);

  useEffect(() => {
    if (user?.email) setForm(f => ({ ...f, email: user.email }));
  }, [user]);

  const toggleLanguage = (lang) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handleSubmit = async () => {
    if (!form.company_name.trim()) return toast.error("Company name is required");
    if (!form.contact_name.trim()) return toast.error("Your name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.bio.trim()) return toast.error("Tell us about your business");
    if (form.languages.length === 0) return toast.error("Select at least one language");
    if (!user) return toast.error("Please sign in first");

    setSubmitting(true);
    const { error } = await supabase
      .from("operators")
      .upsert({
        user_id: user.id,
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        bio: form.bio.trim(),
        website: form.website.trim(),
        languages: form.languages,
        status: "pending",
        rejection_note: null,
      }, { onConflict: "user_id" });

    setSubmitting(false);
    if (error) return toast.error(error.message);
    await reloadOperator();
    setStep("success");
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    border: "0.5px solid var(--border)", borderRadius: 8,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    background: "var(--white)", color: "var(--text-primary)",
  };

  const Field = ({ label, required, children }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: "block", fontSize: 13, fontWeight: 500,
        color: "var(--text-primary)", marginBottom: 6,
      }}>
        {label}{required &&
          <span style={{ color: "var(--olive)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>

      {/* Page title */}
      <div style={{ marginBottom: 32 }}>
        <Link to="/" style={{
          fontSize: 13, color: "var(--text-secondary)",
          display: "inline-flex", alignItems: "center", gap: 4,
          marginBottom: 16,
        }}>
          ← Back to home
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: "var(--text-primary)" }}>
          {wasRejected ? "Reapply as a partner" : "Apply to become a partner"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
          {wasRejected
            ? "Your previous application was not approved. Update your details and reapply."
            : "Tell us about your business and we'll review your application within 1–2 days."}
        </p>
      </div>

      {/* Rejected notice */}
      {wasRejected && operator?.rejection_note && (
        <div style={{
          background: "var(--red-light)", border: "0.5px solid #f5c4c4",
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
          fontSize: 13, color: "var(--red)",
        }}>
          <strong>Previous rejection reason:</strong> {operator.rejection_note}
        </div>
      )}

      {/* Not signed in notice */}
      {!user && (
        <div style={{
          background: "var(--olive-light)", border: "0.5px solid #d6e0a0",
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
          fontSize: 13, color: "var(--olive-dark)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        }}>
          <span>You need an account to apply.</span>
          <Link to="/login" style={{
            background: "var(--olive)", color: "white",
            padding: "6px 14px", borderRadius: 8,
            fontSize: 13, fontWeight: 500,
          }}>
            Sign in or sign up
          </Link>
        </div>
      )}

      {/* SUCCESS STATE */}
      {step === "success" && (
        <div style={{
          background: "var(--white)", border: "0.5px solid var(--border)",
          borderRadius: 16, padding: "48px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Application submitted!
          </h2>
          <p style={{
            fontSize: 15, color: "var(--text-secondary)",
            maxWidth: 360, margin: "0 auto 8px",
          }}>
            We'll review your application and get back to you
            within 1–2 business days at {form.email}.
          </p>
          <Link to="/pending" style={{
            display: "inline-block", marginTop: 24,
            background: "var(--olive)", color: "white",
            padding: "11px 24px", borderRadius: 10,
            fontSize: 14, fontWeight: 500,
          }}>
            View application status
          </Link>
        </div>
      )}

      {/* FORM STATE */}
      {step === "form" && (
        <div style={{
          background: "var(--white)",
          border: "0.5px solid var(--border)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {/* Form header */}
          <div style={{
            padding: "18px 24px",
            borderBottom: "0.5px solid var(--border)",
            background: "var(--bg)",
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
              Business information
            </h2>
          </div>

          <div style={{ padding: "24px" }}>

            <Field label="Company or business name" required>
              <input type="text" value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="e.g. Silk Road Adventures"
                style={inputStyle} />
            </Field>

            <Field label="Your full name" required>
              <input type="text" value={form.contact_name}
                onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                placeholder="First and last name"
                style={inputStyle} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Contact email" required>
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@company.com"
                  style={inputStyle} />
              </Field>
              <Field label="Phone number">
                <input type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+998 90 123 4567"
                  style={inputStyle} />
              </Field>
            </div>

            <Field label="About your business" required>
              <textarea value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Describe your tours, experience, and what makes you unique. What cities do you operate in?"
                rows={4}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
            </Field>

            <Field label="Website">
              <input type="url" value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://yourcompany.com"
                style={inputStyle} />
            </Field>

            <Field label="Languages you guide in" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {LANGUAGES.map(lang => (
                  <button key={lang} type="button"
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 13,
                      cursor: "pointer", border: "0.5px solid",
                      fontWeight: form.languages.includes(lang) ? 500 : 400,
                      borderColor: form.languages.includes(lang)
                        ? "var(--olive)" : "var(--border)",
                      background: form.languages.includes(lang)
                        ? "var(--olive)" : "transparent",
                      color: form.languages.includes(lang)
                        ? "white" : "var(--text-secondary)",
                      fontFamily: "inherit",
                    }}>
                    {lang}
                  </button>
                ))}
              </div>
            </Field>

            <button
              onClick={handleSubmit}
              disabled={submitting || !user}
              style={{
                width: "100%", padding: "13px",
                background: submitting || !user ? "#9aad6f" : "var(--olive)",
                color: "white", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 500,
                cursor: submitting || !user ? "not-allowed" : "pointer",
                marginTop: 8, fontFamily: "inherit",
              }}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>

            <p style={{
              fontSize: 12, color: "var(--text-tertiary)",
              textAlign: "center", marginTop: 12, marginBottom: 0,
            }}>
              By applying you agree to Triply's operator terms.
              We review and respond within 1–2 business days.
            </p>

          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyPage;
