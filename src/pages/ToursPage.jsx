import { useState, useEffect, useRef } from "react";
import { supabase, SUPABASE_URL } from "../supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";

const CITIES = [
  { id: "tashkent",  name: "Tashkent" },
  { id: "samarkand", name: "Samarkand" },
  { id: "bukhara",   name: "Bukhara" },
  { id: "khiva",     name: "Khiva" },
  { id: "namangan",  name: "Namangan" },
  { id: "fergana",   name: "Fergana" },
];

const TYPES = [
  { id: "tour",     label: "Tour" },
  { id: "transfer", label: "Transfer" },
  { id: "ticket",   label: "Ticket" },
  { id: "activity", label: "Activity" },
];

const LANGUAGES = [
  "English", "Russian", "Uzbek",
  "German", "French", "Spanish", "Chinese", "Arabic",
];

const EMPTY_FORM = {
  title: "", description: "", type: "tour",
  price_per_person: "", duration_hours: "",
  max_group_size: 12, min_group_size: 1,
  meeting_point: "", includes: "", excludes: "",
  languages: ["English"], city_id: "", cover_url: "",
};

const inp = {
  width: "100%", padding: "10px 14px",
  border: "0.5px solid var(--border)",
  borderRadius: 8, fontSize: 14, outline: "none",
  boxSizing: "border-box", background: "var(--white)",
  fontFamily: "inherit",
};

const lbl = {
  display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6,
};

const ToursPage = () => {
  const { operator } = useAuth();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "create" | "edit"
  const [editTour, setEditTour] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const coverInputRef = useRef(null);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const loadTours = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tours")
      .select("*")
      .eq("operator_id", operator.id)
      .order("created_at", { ascending: false });
    setTours(data || []);
    setLoading(false);
  };

  useEffect(() => { if (operator) loadTours(); }, [operator]);

  const resetForm = () => setForm(EMPTY_FORM);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image must be under 5MB");

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fname = `${operator.id}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("tour-covers")
      .upload(fname, file, { upsert: true });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/tour-covers/${fname}`;
    setForm(f => ({ ...f, cover_url: url }));
    setUploading(false);
    toast.success("Photo uploaded ✓");
  };

  const saveTour = async () => {
    if (!form.title.trim())        return toast.error("Title is required");
    if (!form.description.trim())  return toast.error("Description is required");
    if (!form.price_per_person)    return toast.error("Price is required");
    if (!form.city_id)             return toast.error("Select a city");

    setSaving(true);
    const payload = {
      operator_id:     operator.id,
      title:           form.title.trim(),
      description:     form.description.trim(),
      type:            form.type,
      price_per_person: parseFloat(form.price_per_person),
      duration_hours:  form.duration_hours ? parseFloat(form.duration_hours) : null,
      max_group_size:  parseInt(form.max_group_size),
      min_group_size:  parseInt(form.min_group_size),
      meeting_point:   form.meeting_point.trim(),
      includes:        form.includes ? form.includes.split("\n").filter(Boolean) : [],
      excludes:        form.excludes ? form.excludes.split("\n").filter(Boolean) : [],
      languages:       form.languages,
      city_id:         form.city_id,
      cover_url:       form.cover_url || null,
      status:          "pending",
    };

    const { error } = editTour
      ? await supabase.from("tours").update(payload).eq("id", editTour.id)
      : await supabase.from("tours").insert(payload);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editTour ? "Tour updated!" : "Tour submitted for review!");
    setView("list");
    setEditTour(null);
    resetForm();
    loadTours();
  };

  const startEdit = (tour) => {
    setForm({
      title:           tour.title || "",
      description:     tour.description || "",
      type:            tour.type || "tour",
      price_per_person: tour.price_per_person || "",
      duration_hours:  tour.duration_hours || "",
      max_group_size:  tour.max_group_size || 12,
      min_group_size:  tour.min_group_size || 1,
      meeting_point:   tour.meeting_point || "",
      includes:        (tour.includes || []).join("\n"),
      excludes:        (tour.excludes || []).join("\n"),
      languages:       tour.languages || ["English"],
      city_id:         tour.city_id || "",
      cover_url:       tour.cover_url || "",
    });
    setEditTour(tour);
    setView("edit");
  };

  const deleteTour = async (id) => {
    if (!window.confirm("Delete this tour?")) return;
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tour deleted");
    loadTours();
  };

  const toggleStatus = async (tour) => {
    const newStatus = tour.status === "live" ? "paused" : "live";
    const { error } = await supabase
      .from("tours").update({ status: newStatus }).eq("id", tour.id);
    if (error) return toast.error(error.message);
    toast.success(newStatus === "live" ? "Tour is now live" : "Tour paused");
    loadTours();
  };

  const toggleLanguage = (lang) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const statusBg = (s) => ({
    live:     "var(--olive-light)",
    pending:  "#fef9ec",
    paused:   "#f3f4f6",
    rejected: "var(--red-light)",
    draft:    "#f3f4f6",
  }[s] || "#f3f4f6");

  const statusColor = (s) => ({
    live:     "var(--olive-dark)",
    pending:  "#92610a",
    paused:   "var(--text-secondary)",
    rejected: "var(--red)",
    draft:    "var(--text-secondary)",
  }[s] || "var(--text-secondary)");

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 24,
          }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 600 }}>My tours</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
                {tours.length} total · {tours.filter(t => t.status === "live").length} live
              </p>
            </div>
            <button onClick={() => { resetForm(); setView("create"); }} style={{
              background: "var(--olive)", color: "white", border: "none",
              borderRadius: 10, padding: "10px 20px",
              fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>
              + New tour
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)", fontSize: 14 }}>
              Loading…
            </div>
          ) : tours.length === 0 ? (
            <div style={{
              background: "var(--white)", border: "0.5px solid var(--border)",
              borderRadius: 12, padding: 48, textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
              <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No tours yet</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
                Create your first tour listing to start receiving bookings.
              </p>
              <button onClick={() => setView("create")} style={{
                background: "var(--olive)", color: "white", border: "none",
                borderRadius: 10, padding: "10px 20px",
                fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}>
                Create first tour
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {tours.map(tour => (
                <div key={tour.id} style={{
                  background: "var(--white)", border: "0.5px solid var(--border)",
                  borderRadius: 12, padding: "18px 20px",
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 16,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{tour.title}</span>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500,
                        background: statusBg(tour.status), color: statusColor(tour.status),
                      }}>
                        {tour.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                      {TYPES.find(t => t.id === tour.type)?.label || tour.type} ·{" "}
                      ${tour.price_per_person}/person
                      {tour.duration_hours ? ` · ${tour.duration_hours}h` : ""}
                      {tour.city_id
                        ? ` · ${CITIES.find(c => c.id === tour.city_id)?.name || tour.city_id}`
                        : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {(tour.status === "live" || tour.status === "paused") && (
                      <button onClick={() => toggleStatus(tour)} style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 12,
                        fontWeight: 500, cursor: "pointer", border: "none",
                        fontFamily: "inherit",
                        background: tour.status === "live" ? "#f3f4f6" : "var(--olive-light)",
                        color: tour.status === "live" ? "var(--text-secondary)" : "var(--olive-dark)",
                      }}>
                        {tour.status === "live" ? "Pause" : "Resume"}
                      </button>
                    )}
                    <button onClick={() => startEdit(tour)} style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12,
                      fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                      border: "0.5px solid var(--border)",
                      background: "transparent", color: "var(--text-primary)",
                    }}>
                      Edit
                    </button>
                    {(tour.status === "draft" || tour.status === "rejected") && (
                      <button onClick={() => deleteTour(tour.id)} style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 12,
                        cursor: "pointer", border: "none", fontFamily: "inherit",
                        background: "var(--red-light)", color: "var(--red)",
                      }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CREATE / EDIT FORM ── */}
      {(view === "create" || view === "edit") && (
        <>
          <div style={{ marginBottom: 24 }}>
            <button onClick={() => { setView("list"); setEditTour(null); }} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--text-secondary)",
              marginBottom: 12, padding: 0, fontFamily: "inherit",
            }}>
              ← Back to tours
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>
              {view === "edit" ? "Edit tour" : "Create new tour"}
            </h1>
          </div>

          <div style={{
            background: "var(--white)", border: "0.5px solid var(--border)",
            borderRadius: 16, overflow: "hidden",
          }}>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Cover photo */}
              <div>
                <label style={lbl}>Cover photo</label>
                <div
                  onClick={() => coverInputRef.current?.click()}
                  style={{
                    width: "100%", height: 200,
                    borderRadius: 10, overflow: "hidden",
                    border: "0.5px dashed var(--border)",
                    background: form.cover_url ? "transparent" : "var(--bg)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer",
                    position: "relative", marginBottom: 8,
                  }}
                >
                  {form.cover_url ? (
                    <>
                      <img
                        src={form.cover_url}
                        alt="Cover"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div
                        style={{
                          position: "absolute", inset: 0,
                          background: "rgba(0,0,0,0.4)",
                          display: "flex", alignItems: "center",
                          justifyContent: "center", opacity: 0,
                          transition: "opacity 0.2s",
                          color: "white", fontSize: 13, fontWeight: 500,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}
                      >
                        Change photo
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--text-tertiary)" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                      <div style={{ fontSize: 13 }}>
                        {uploading ? "Uploading…" : "Click to upload cover photo"}
                      </div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>
                        JPG, PNG or WebP · Max 5MB
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  style={{ display: "none" }}
                />
                {form.cover_url && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, cover_url: "" }))}
                    style={{
                      fontSize: 12, color: "var(--red)",
                      background: "none", border: "none",
                      cursor: "pointer", padding: 0, fontFamily: "inherit",
                    }}
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={lbl}>Tour title *</label>
                <input value={form.title} onChange={set("title")}
                  placeholder="e.g. Samarkand Full Day Tour" style={inp} />
              </div>

              {/* Type + City */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={lbl}>Type *</label>
                  <select value={form.type} onChange={set("type")}
                    style={{ ...inp, background: "var(--white)" }}>
                    {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>City *</label>
                  <select value={form.city_id} onChange={set("city_id")}
                    style={{ ...inp, background: "var(--white)" }}>
                    <option value="">Select city</option>
                    {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Price + Duration + Max group */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={lbl}>Price per person (USD) *</label>
                  <input type="number" min="0" value={form.price_per_person}
                    onChange={set("price_per_person")} placeholder="45" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Duration (hours)</label>
                  <input type="number" min="0.5" step="0.5" value={form.duration_hours}
                    onChange={set("duration_hours")} placeholder="8" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Max group size</label>
                  <input type="number" min="1" value={form.max_group_size}
                    onChange={set("max_group_size")} style={inp} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>Description *</label>
                <textarea value={form.description} onChange={set("description")}
                  placeholder="Describe the tour in detail — what travelers will see and do, highlights, what to bring..."
                  rows={5}
                  style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
              </div>

              {/* Meeting point */}
              <div>
                <label style={lbl}>Meeting point</label>
                <input value={form.meeting_point} onChange={set("meeting_point")}
                  placeholder="e.g. Registan Square main entrance" style={inp} />
              </div>

              {/* Includes / Excludes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={lbl}>What's included (one per line)</label>
                  <textarea value={form.includes} onChange={set("includes")}
                    placeholder={"Hotel pickup\nGuide\nLunch\nEntrance fees"}
                    rows={4}
                    style={{ ...inp, fontSize: 13, resize: "vertical" }} />
                </div>
                <div>
                  <label style={lbl}>What's excluded (one per line)</label>
                  <textarea value={form.excludes} onChange={set("excludes")}
                    placeholder={"Flights\nPersonal expenses\nTips"}
                    rows={4}
                    style={{ ...inp, fontSize: 13, resize: "vertical" }} />
                </div>
              </div>

              {/* Languages */}
              <div>
                <label style={lbl}>Languages available</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {LANGUAGES.map(lang => (
                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                      style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 13,
                        cursor: "pointer", border: "0.5px solid", fontFamily: "inherit",
                        borderColor: form.languages.includes(lang) ? "var(--olive)" : "var(--border)",
                        background: form.languages.includes(lang) ? "var(--olive)" : "transparent",
                        color: form.languages.includes(lang) ? "white" : "var(--text-secondary)",
                      }}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
                <button onClick={saveTour} disabled={saving} style={{
                  flex: 1, padding: "13px",
                  background: saving ? "#9aad6f" : "var(--olive)",
                  color: "white", border: "none", borderRadius: 10,
                  fontSize: 15, fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}>
                  {saving ? "Saving…" : view === "edit" ? "Save changes" : "Submit for review"}
                </button>
                <button onClick={() => { setView("list"); setEditTour(null); }} style={{
                  padding: "13px 20px", background: "transparent",
                  border: "0.5px solid var(--border)", borderRadius: 10,
                  fontSize: 14, cursor: "pointer",
                  color: "var(--text-secondary)", fontFamily: "inherit",
                }}>
                  Cancel
                </button>
              </div>

              <p style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>
                New tours are reviewed by Triply before going live.
                This usually takes 1 business day.
              </p>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ToursPage;
