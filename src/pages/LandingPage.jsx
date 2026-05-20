import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const steps = [
  {
    n: 1,
    title: "Apply",
    desc: "Fill out a short application. We review and approve qualified operators within 1–2 business days.",
  },
  {
    n: 2,
    title: "List your tours",
    desc: "Create listings for your tours, transfers, tickets and activities. Add photos, pricing, and availability.",
  },
  {
    n: 3,
    title: "Get bookings",
    desc: "Travelers discover and request to book your tours. You confirm and coordinate directly.",
  },
];

const features = [
  { icon: "🗂️", title: "Your own dashboard",  desc: "Manage all your tours and bookings from one place." },
  { icon: "📋", title: "Booking requests",    desc: "Receive and confirm booking requests from travelers." },
  { icon: "🌐", title: "Multilingual reach",  desc: "Your listings reach travelers in English, Russian and Uzbek." },
  { icon: "💰", title: "Zero upfront cost",   desc: "Free to list. We take a small commission only when you get paid." },
];

const stats = [
  { value: "0%",     label: "Commission to list" },
  { value: "10,000+", label: "Monthly travelers" },
  { value: "6",      label: "Cities covered" },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        background: "var(--olive-light)",
        padding: "80px 24px",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            fontSize: 13, color: "var(--olive)", textTransform: "uppercase",
            letterSpacing: "0.06em", marginBottom: 14, fontWeight: 500,
          }}>
            Triply for operators
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 600, color: "#2a3a0a",
            lineHeight: 1.25, margin: 0,
          }}>
            Grow your tour business with Triply
          </h1>
          <p style={{
            fontSize: 17, color: "#5a6e1f", marginTop: 12, lineHeight: 1.6,
          }}>
            List your tours, transfers, and activities on Uzbekistan's leading
            travel platform. Reach thousands of travelers for free — we only
            earn when you do.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
            <Link to="/apply" style={{
              background: "#5a6e1f", color: "white",
              padding: "13px 28px", borderRadius: 10,
              fontSize: 15, fontWeight: 500, display: "inline-block",
            }}>
              Apply to become a partner
            </Link>
            <Link to={user ? "/dashboard" : "/login"} style={{
              background: "white", border: "0.5px solid #5a6e1f",
              color: "#5a6e1f", padding: "13px 28px", borderRadius: 10,
              fontSize: 15, fontWeight: 500, display: "inline-block",
            }}>
              Sign in to dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: "var(--white)",
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
        padding: "32px 24px",
      }}>
        <div style={{
          maxWidth: 680, margin: "0 auto",
          display: "flex", justifyContent: "space-around",
          flexWrap: "wrap", gap: 24,
        }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--olive)" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "var(--white)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{
            fontSize: 22, fontWeight: 600, textAlign: "center",
            marginBottom: 40, color: "var(--text-primary)",
          }}>
            How it works
          </h2>
          <div style={{
            display: "flex", gap: 32, flexWrap: "wrap",
            justifyContent: "center",
          }}>
            {steps.map(s => (
              <div key={s.n} style={{ flex: "1 1 180px", maxWidth: 200 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--olive)", color: "white",
                  fontSize: 16, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section style={{ background: "var(--bg)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{
            fontSize: 22, fontWeight: 600, textAlign: "center",
            marginBottom: 32, color: "var(--text-primary)",
          }}>
            Everything you need
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {features.map(f => (
              <div key={f.title} style={{
                background: "var(--white)",
                border: "0.5px solid var(--border)",
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ fontSize: 24 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 500, marginTop: 8, color: "var(--text-primary)" }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.6 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section style={{
        background: "#5a6e1f", padding: "64px 24px", textAlign: "center",
      }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: "white", margin: 0 }}>
          Ready to grow your business?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
          Join operators already listing on Triply.
        </p>
        <Link to="/apply" style={{
          display: "inline-block", marginTop: 28,
          background: "white", color: "#5a6e1f",
          padding: "13px 32px", borderRadius: 10,
          fontSize: 15, fontWeight: 600,
        }}>
          Apply now — it's free
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#3a4a12", padding: 24,
        textAlign: "center", fontSize: 13,
        color: "rgba(255,255,255,0.8)",
      }}>
        © 2026 Triply ·{" "}
        For travelers:{" "}
        <a
          href="https://safaruz.pages.dev"
          style={{ color: "white", opacity: 1 }}
        >
          safaruz.pages.dev
        </a>
      </footer>
    </div>
  );
}
