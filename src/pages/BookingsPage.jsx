import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";

const BookingsPage = () => {
  const { operator } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [acting, setActing] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("booking_requests")
      .select("*, tours(title, price_per_person, type)")
      .eq("operator_id", operator.id)
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => { if (operator) load(); }, [operator]);

  const updateStatus = async (id, status) => {
    setActing(id);
    const { error } = await supabase
      .from("booking_requests")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "confirmed" ? "Booking confirmed ✓" : "Booking cancelled");
      load();
    }
    setActing(null);
  };

  const counts = {
    pending:   bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  const filtered = filter === "all"
    ? bookings
    : bookings.filter(b => b.status === filter);

  const tabs = [
    { id: "pending",   label: `Pending (${counts.pending})` },
    { id: "confirmed", label: `Confirmed (${counts.confirmed})` },
    { id: "cancelled", label: `Cancelled (${counts.cancelled})` },
    { id: "all",       label: "All" },
  ];

  const statusBg = (s) => ({
    confirmed: "var(--olive-light)",
    cancelled: "var(--red-light)",
    pending:   "#fef9ec",
  }[s] || "#fef9ec");

  const statusColor = (s) => ({
    confirmed: "var(--olive-dark)",
    cancelled: "var(--red)",
    pending:   "#92610a",
  }[s] || "#92610a");

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Booking requests</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
          {bookings.length} total · {counts.pending} pending
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12,
            fontWeight: 500, cursor: "pointer", border: "0.5px solid",
            fontFamily: "inherit",
            borderColor: filter === t.id ? "var(--olive)" : "var(--border)",
            background: filter === t.id ? "var(--olive)" : "transparent",
            color: filter === t.id ? "white" : "var(--text-secondary)",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)", fontSize: 14 }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--white)", border: "0.5px solid var(--border)",
          borderRadius: 12, padding: 48, textAlign: "center",
          color: "var(--text-tertiary)", fontSize: 14,
        }}>
          {filter === "all" ? "📭" : filter === "pending" ? "✅" : "📋"}{" "}
          No {filter === "all" ? "" : filter} bookings
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(b => {
            const total = b.total_price || (b.group_size * (b.tours?.price_per_person || 0));
            return (
              <div key={b.id} style={{
                background: "var(--white)", border: "0.5px solid var(--border)",
                borderRadius: 12, padding: "18px 20px",
              }}>
                {/* Top row */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: 8,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>
                    {b.tours?.title || "Tour"}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 500, flexShrink: 0,
                    padding: "3px 10px", borderRadius: 20,
                    background: statusBg(b.status), color: statusColor(b.status),
                  }}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                </div>

                {/* Details row */}
                <div style={{
                  fontSize: 13, color: "var(--text-secondary)",
                  display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10,
                }}>
                  {b.date && <span>📅 {fmtDate(b.date)}</span>}
                  <span>👥 {b.group_size} {b.group_size === 1 ? "person" : "people"}</span>
                  {total > 0 && <span>💵 ${total}</span>}
                  <span style={{ color: "var(--text-tertiary)" }}>
                    Submitted {new Date(b.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>

                {/* Traveler info */}
                <div style={{
                  fontSize: 13, padding: "10px 12px",
                  background: "var(--bg)", borderRadius: 8, marginBottom: 12,
                  display: "flex", flexWrap: "wrap", gap: "4px 24px",
                  color: "var(--text-secondary)",
                }}>
                  {b.traveler_name  && <span>👤 {b.traveler_name}</span>}
                  {b.traveler_email && <span>✉️ {b.traveler_email}</span>}
                  {b.traveler_phone && <span>📞 {b.traveler_phone}</span>}
                  {b.message && (
                    <div style={{ width: "100%", fontStyle: "italic", marginTop: 4 }}>
                      "{b.message}"
                    </div>
                  )}
                </div>

                {/* Actions — pending only */}
                {b.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => updateStatus(b.id, "confirmed")}
                      disabled={acting === b.id}
                      style={{
                        padding: "8px 20px", borderRadius: 8, fontSize: 13,
                        fontWeight: 500, cursor: "pointer", border: "none",
                        fontFamily: "inherit",
                        background: "var(--olive)", color: "white",
                        opacity: acting === b.id ? 0.6 : 1,
                      }}
                    >
                      {acting === b.id ? "Saving…" : "✓ Confirm"}
                    </button>
                    <button
                      onClick={() => updateStatus(b.id, "cancelled")}
                      disabled={acting === b.id}
                      style={{
                        padding: "8px 20px", borderRadius: 8, fontSize: 13,
                        fontWeight: 500, cursor: "pointer", border: "none",
                        fontFamily: "inherit",
                        background: "var(--red-light)", color: "var(--red)",
                        opacity: acting === b.id ? 0.6 : 1,
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
