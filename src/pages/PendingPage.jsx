import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

export default function PendingPage() {
  const { operator } = useAuth();

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{
        background: "var(--white)",
        border: "0.5px solid var(--border)",
        borderRadius: 16, padding: "40px 32px", textAlign: "center",
      }}>

        {/* Status icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#fef9ec", border: "2px solid #f5c97a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "0 auto 24px",
        }}>⏳</div>

        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
          Application under review
        </h1>

        <p style={{
          fontSize: 15, color: "var(--text-secondary)",
          lineHeight: 1.6, maxWidth: 360, margin: "0 auto 24px",
        }}>
          Thanks for applying, {operator?.contact_name?.split(" ")[0] || "there"}!
          We're reviewing your application for{" "}
          <strong>{operator?.company_name}</strong> and will get back
          to you within 1–2 business days.
        </p>

        {/* Applied at */}
        <div style={{
          background: "var(--bg)", borderRadius: 10,
          padding: "12px 20px", marginBottom: 28,
          fontSize: 13, color: "var(--text-secondary)",
        }}>
          Applied on{" "}
          {operator?.created_at
            ? new Date(operator.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })
            : "—"}
        </div>

        {/* What happens next */}
        <div style={{
          textAlign: "left", marginBottom: 28,
          border: "0.5px solid var(--border)",
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{
            fontSize: 12, fontWeight: 500,
            color: "var(--text-tertiary)",
            textTransform: "uppercase", letterSpacing: "0.05em",
            marginBottom: 12,
          }}>
            What happens next
          </div>
          {[
            "We review your application details",
            "We may contact you for more information",
            "You receive an approval email",
            "You can start listing your tours",
          ].map((step, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              marginBottom: i < 3 ? 10 : 0,
              fontSize: 13, color: "var(--text-secondary)",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "var(--olive-light)", color: "var(--olive-dark)",
                fontSize: 11, fontWeight: 600, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i + 1}</div>
              {step}
            </div>
          ))}
        </div>

        <Link to="https://safaruz.pages.dev" style={{
          fontSize: 13, color: "var(--text-secondary)",
        }}>
          ← Back to Triply
        </Link>

      </div>
    </div>
  );
}
