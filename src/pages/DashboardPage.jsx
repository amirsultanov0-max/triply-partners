import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase.js";
import { useAuth } from "../context/AuthContext.jsx";

const DashboardPage = () => {
  const { operator } = useAuth();
  const [stats, setStats] = useState({
    tours: 0, liveTours: 0,
    totalRequests: 0, pendingRequests: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!operator) return;
    loadStats();
  }, [operator]);

  const loadStats = async () => {
    setLoading(true);

    const { data: tours } = await supabase
      .from("tours")
      .select("id, status")
      .eq("operator_id", operator.id);

    const { data: bookings } = await supabase
      .from("booking_requests")
      .select("id, status, created_at, group_size, total_price, tours(title)")
      .eq("operator_id", operator.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setStats({
      tours: tours?.length || 0,
      liveTours: tours?.filter(t => t.status === "live").length || 0,
      totalRequests: bookings?.length || 0,
      pendingRequests: bookings?.filter(b => b.status === "pending").length || 0,
    });
    setRecentBookings(bookings || []);
    setLoading(false);
  };

  const statCards = [
    { label: "Total tours",       value: stats.tours,          sub: `${stats.liveTours} live` },
    { label: "Live tours",        value: stats.liveTours,      sub: "visible to travelers" },
    { label: "Booking requests",  value: stats.totalRequests,  sub: "all time" },
    { label: "Pending requests",  value: stats.pendingRequests, sub: "need response" },
  ];

  const quickActions = [
    { label: "Create new tour", icon: "➕", to: "/tours" },
    { label: "View bookings",   icon: "📋", to: "/bookings" },
    { label: "Manage tours",    icon: "🗂️", to: "/tours" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

      {/* Welcome header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>
          Welcome back, {operator?.contact_name?.split(" ")[0]}!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
          {operator?.company_name} ·{" "}
          <span style={{
            marginLeft: 8, fontSize: 12, fontWeight: 500,
            background: "var(--olive-light)", color: "var(--olive-dark)",
            padding: "2px 8px", borderRadius: 20,
          }}>
            Active partner
          </span>
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16, marginBottom: 32,
      }}>
        {statCards.map(({ label, value, sub }) => (
          <div key={label} style={{
            background: "var(--white)",
            border: "0.5px solid var(--border)",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "var(--olive)" }}>
              {loading ? "—" : value}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12, marginBottom: 32,
      }}>
        {quickActions.map(({ label, icon, to }) => (
          <Link key={label} to={to} style={{
            background: "var(--white)",
            border: "0.5px solid var(--border)",
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 12,
            fontSize: 14, fontWeight: 500,
            color: "var(--text-primary)",
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            {label}
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div style={{
        background: "var(--white)",
        border: "0.5px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "0.5px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>
            Recent booking requests
          </h2>
          <Link to="/bookings" style={{ fontSize: 13, color: "var(--olive)" }}>
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{
            padding: 40, textAlign: "center",
            color: "var(--text-tertiary)", fontSize: 14,
          }}>
            Loading…
          </div>
        ) : recentBookings.length === 0 ? (
          <div style={{
            padding: 48, textAlign: "center",
            color: "var(--text-tertiary)", fontSize: 14,
          }}>
            No booking requests yet.
            <br />
            <Link to="/tours" style={{
              color: "var(--olive)", marginTop: 8, display: "inline-block",
            }}>
              Create your first tour →
            </Link>
          </div>
        ) : (
          recentBookings.map((b, i) => (
            <div key={b.id} style={{
              padding: "14px 20px",
              borderBottom: i < recentBookings.length - 1
                ? "0.5px solid var(--border)" : "none",
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {b.tours?.title || "Tour"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                  {new Date(b.created_at).toLocaleDateString("en-GB")} ·{" "}
                  {b.group_size} {b.group_size === 1 ? "person" : "people"}
                  {b.total_price ? ` · $${b.total_price}` : ""}
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 500,
                padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                background:
                  b.status === "confirmed" ? "var(--olive-light)" :
                  b.status === "cancelled" ? "var(--red-light)" : "#fef9ec",
                color:
                  b.status === "confirmed" ? "var(--olive-dark)" :
                  b.status === "cancelled" ? "var(--red)" : "#92610a",
              }}>
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
