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
  cancellation_policy: "Cancel up to 24 hours in advance for a full refund.",
  itinerary: [],
  additional_info: [],
  accessibility: [],
  what_to_bring: [],
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
  const [formTab, setFormTab] = useState("details"); // "details" | "photos"
  const [tourPhotos, setTourPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const photoInputRef = useRef(null);
  const [newStop, setNewStop] = useState({ title: "", description: "", duration: "" });

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

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormTab("details");
    setTourPhotos([]);
  };

  const loadTourPhotos = async (tourId) => {
    setPhotosLoading(true);
    const { data } = await supabase
      .from("tour_photos")
      .select("*")
      .eq("tour_id", tourId)
      .order("display_order", { ascending: true });
    setTourPhotos(data || []);
    setPhotosLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      setUploading(true);
      const ext = file.name.split(".").pop();
      const fname = `${operator.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("tour-covers")
        .upload(fname, file, { upsert: true });

      if (error) {
        toast.error("Upload failed: " + error.message);
        setUploading(false);
        continue;
      }

      const url = `${SUPABASE_URL}/storage/v1/object/public/tour-covers/${fname}`;
      const isFirst = tourPhotos.length === 0;

      if (editTour) {
        const { data: newPhoto } = await supabase
          .from("tour_photos")
          .insert({
            tour_id: editTour.id,
            url,
            is_cover: isFirst,
            display_order: tourPhotos.length,
          })
          .select()
          .single();

        if (newPhoto) {
          setTourPhotos(prev => [...prev, newPhoto]);
          if (isFirst) {
            setForm(f => ({ ...f, cover_url: url }));
            await supabase.from("tours").update({ cover_url: url }).eq("id", editTour.id);
          }
        }
      } else {
        setTourPhotos(prev => [
          ...prev,
          { id: Date.now(), url, is_cover: isFirst, display_order: prev.length, temp: true },
        ]);
        if (isFirst) setForm(f => ({ ...f, cover_url: url }));
      }
      setUploading(false);
    }

    toast.success("Photo uploaded ✓");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const setHeroPhoto = async (photo) => {
    await supabase.from("tour_photos")
      .update({ is_cover: false })
      .eq("tour_id", editTour?.id || photo.tour_id);
    await supabase.from("tour_photos")
      .update({ is_cover: true })
      .eq("id", photo.id);

    const tourId = editTour?.id;
    if (tourId) {
      await supabase.from("tours").update({ cover_url: photo.url }).eq("id", tourId);
      setForm(f => ({ ...f, cover_url: photo.url }));
    }
    setTourPhotos(prev => prev.map(p => ({ ...p, is_cover: p.id === photo.id })));
    toast.success("Hero photo updated ✓");
  };

  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete this photo?")) return;

    if (!photo.temp) {
      await supabase.from("tour_photos").delete().eq("id", photo.id);
      if (photo.is_cover) {
        const remaining = tourPhotos.filter(p => p.id !== photo.id);
        if (remaining.length > 0) {
          await setHeroPhoto(remaining[0]);
        } else {
          setForm(f => ({ ...f, cover_url: "" }));
          if (editTour) {
            await supabase.from("tours").update({ cover_url: null }).eq("id", editTour.id);
          }
        }
      }
    }

    setTourPhotos(prev => prev.filter(p => p.id !== photo.id));
    toast.success("Photo deleted");
  };

  const saveTour = async () => {
    if (!form.title.trim())        return toast.error("Title is required");
    if (!form.description.trim())  return toast.error("Description is required");
    if (!form.price_per_person)    return toast.error("Price is required");
    if (!form.city_id)             return toast.error("Select a city");

    setSaving(true);
    const payload = {
      operator_id:      operator.id,
      title:            form.title.trim(),
      description:      form.description.trim(),
      type:             form.type,
      price_per_person: parseFloat(form.price_per_person),
      duration_hours:   form.duration_hours ? parseFloat(form.duration_hours) : null,
      max_group_size:   parseInt(form.max_group_size),
      min_group_size:   parseInt(form.min_group_size),
      meeting_point:    form.meeting_point.trim(),
      includes:         form.includes ? form.includes.split("\n").filter(Boolean) : [],
      excludes:         form.excludes ? form.excludes.split("\n").filter(Boolean) : [],
      languages:           form.languages,
      city_id:             form.city_id,
      cover_url:           form.cover_url || null,
      cancellation_policy: form.cancellation_policy.trim(),
      itinerary:           form.itinerary,
      additional_info:     form.additional_info.filter(Boolean),
      accessibility:       form.accessibility.filter(Boolean),
      what_to_bring:       form.what_to_bring.filter(Boolean),
      status:              "pending",
    };

    const { data: savedTour, error } = editTour
      ? await supabase.from("tours").update(payload).eq("id", editTour.id).select().single()
      : await supabase.from("tours").insert(payload).select().single();

    if (error) { setSaving(false); return toast.error(error.message); }

    // For new tours, persist any temp photos to tour_photos table
    if (!editTour && savedTour && tourPhotos.length > 0) {
      const rows = tourPhotos.map((p, i) => ({
        tour_id: savedTour.id,
        url: p.url,
        is_cover: i === 0,
        display_order: i,
      }));
      await supabase.from("tour_photos").insert(rows);
    }

    setSaving(false);
    toast.success(editTour ? "Tour updated!" : "Tour submitted for review!");
    setView("list");
    setEditTour(null);
    resetForm();
    loadTours();
  };

  const startEdit = (tour) => {
    setForm({
      title:            tour.title || "",
      description:      tour.description || "",
      type:             tour.type || "tour",
      price_per_person: tour.price_per_person || "",
      duration_hours:   tour.duration_hours || "",
      max_group_size:   tour.max_group_size || 12,
      min_group_size:   tour.min_group_size || 1,
      meeting_point:    tour.meeting_point || "",
      includes:         (tour.includes || []).join("\n"),
      excludes:         (tour.excludes || []).join("\n"),
      languages:           tour.languages || ["English"],
      city_id:             tour.city_id || "",
      cover_url:           tour.cover_url || "",
      cancellation_policy: tour.cancellation_policy || "Cancel up to 24 hours in advance for a full refund.",
      itinerary:           tour.itinerary || [],
      additional_info:     tour.additional_info || [],
      accessibility:       tour.accessibility || [],
      what_to_bring:       tour.what_to_bring || [],
    });
    setEditTour(tour);
    setFormTab("details");
    setView("edit");
    loadTourPhotos(tour.id);
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
            <button onClick={() => { resetForm(); setTourPhotos([]); setView("create"); }} style={{
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
              <button onClick={() => { resetForm(); setView("create"); }} style={{
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
            <button onClick={() => { setView("list"); setEditTour(null); setFormTab("details"); }} style={{
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

            {/* Tab bar */}
            <div style={{
              display: "flex", borderBottom: "0.5px solid var(--border)",
              background: "var(--bg)",
            }}>
              {[
                { id: "details", label: "Details" },
                { id: "photos",  label: `Photos (${tourPhotos.length})` },
              ].map(tab => (
                <button key={tab.id} onClick={() => setFormTab(tab.id)} style={{
                  padding: "14px 20px", fontSize: 14, fontWeight: 500,
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: formTab === tab.id
                    ? "2px solid #5a6e1f" : "2px solid transparent",
                  color: formTab === tab.id
                    ? "var(--text-primary)" : "var(--text-secondary)",
                  marginBottom: -1, fontFamily: "inherit",
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── DETAILS TAB ── */}
            {formTab === "details" && (
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

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

                {/* Cancellation policy */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Cancellation policy
                  </label>
                  <select
                    value={form.cancellation_policy}
                    onChange={e => setForm(f => ({ ...f, cancellation_policy: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px",
                      border: "0.5px solid var(--border)", borderRadius: 8,
                      fontSize: 14, outline: "none", background: "var(--white)",
                      boxSizing: "border-box", fontFamily: "inherit" }}
                  >
                    {[
                      "Cancel up to 24 hours in advance for a full refund.",
                      "Cancel up to 48 hours in advance for a full refund.",
                      "Cancel up to 3 days in advance for a full refund.",
                      "Cancel up to 7 days in advance for a full refund.",
                      "Non-refundable — no cancellations accepted.",
                    ].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Itinerary */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                    Itinerary (optional)
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 400, marginLeft: 6 }}>
                      Add stops in order
                    </span>
                  </label>

                  {form.itinerary.map((stop, i) => (
                    <div key={i} style={{
                      background: "var(--bg)", borderRadius: 8,
                      padding: "12px 14px", marginBottom: 8,
                      border: "0.5px solid var(--border)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {i + 1}. {stop.title}
                            {stop.duration && (
                              <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 8 }}>
                                · {stop.duration}
                              </span>
                            )}
                          </div>
                          {stop.description && (
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                              {stop.description}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, itinerary: f.itinerary.filter((_, j) => j !== i) }))}
                          style={{ background: "none", border: "none", cursor: "pointer",
                            color: "var(--red)", fontSize: 16, padding: "0 0 0 12px" }}
                        >✕</button>
                      </div>
                    </div>
                  ))}

                  <div style={{ border: "0.5px dashed var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8, marginBottom: 8 }}>
                      <input
                        value={newStop.title}
                        onChange={e => setNewStop(s => ({ ...s, title: e.target.value }))}
                        placeholder="Stop name (e.g. Registan Square)"
                        style={{ padding: "8px 12px", border: "0.5px solid var(--border)",
                          borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
                          fontFamily: "inherit" }}
                      />
                      <input
                        value={newStop.duration}
                        onChange={e => setNewStop(s => ({ ...s, duration: e.target.value }))}
                        placeholder="Duration"
                        style={{ padding: "8px 12px", border: "0.5px solid var(--border)",
                          borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
                          fontFamily: "inherit" }}
                      />
                    </div>
                    <textarea
                      value={newStop.description}
                      onChange={e => setNewStop(s => ({ ...s, description: e.target.value }))}
                      placeholder="Brief description of this stop (optional)"
                      rows={2}
                      style={{ width: "100%", padding: "8px 12px", border: "0.5px solid var(--border)",
                        borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
                        resize: "none", marginBottom: 8, fontFamily: "inherit" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newStop.title.trim()) return;
                        setForm(f => ({ ...f, itinerary: [...f.itinerary, { ...newStop }] }));
                        setNewStop({ title: "", description: "", duration: "" });
                      }}
                      style={{ padding: "7px 16px", background: "var(--olive)", color: "white",
                        border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer",
                        fontFamily: "inherit" }}
                    >
                      + Add stop
                    </button>
                  </div>
                </div>

                {/* Additional info */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                    Additional information
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 400, marginLeft: 6 }}>
                      One item per line
                    </span>
                  </label>
                  <textarea
                    value={form.additional_info.join("\n")}
                    onChange={e => setForm(f => ({ ...f, additional_info: e.target.value.split("\n") }))}
                    placeholder={"Confirmation will be received at time of booking\nNot wheelchair accessible\nNear public transportation\nMost travelers can participate"}
                    rows={4}
                    style={{ width: "100%", padding: "10px 14px",
                      border: "0.5px solid var(--border)", borderRadius: 8,
                      fontSize: 13, outline: "none", boxSizing: "border-box",
                      resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
                  />
                </div>

                {/* Accessibility */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                    Accessibility
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 400, marginLeft: 6 }}>
                      One item per line
                    </span>
                  </label>
                  <textarea
                    value={form.accessibility.join("\n")}
                    onChange={e => setForm(f => ({ ...f, accessibility: e.target.value.split("\n") }))}
                    placeholder={"Wheelchair accessible\nStroller accessible\nService animals allowed"}
                    rows={3}
                    style={{ width: "100%", padding: "10px 14px",
                      border: "0.5px solid var(--border)", borderRadius: 8,
                      fontSize: 13, outline: "none", boxSizing: "border-box",
                      resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
                  />
                </div>

                {/* What to bring */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                    What to bring
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 400, marginLeft: 6 }}>
                      One item per line
                    </span>
                  </label>
                  <textarea
                    value={form.what_to_bring.join("\n")}
                    onChange={e => setForm(f => ({ ...f, what_to_bring: e.target.value.split("\n") }))}
                    placeholder={"Comfortable walking shoes\nSunscreen\nWater bottle\nPassport or ID"}
                    rows={3}
                    style={{ width: "100%", padding: "10px 14px",
                      border: "0.5px solid var(--border)", borderRadius: 8,
                      fontSize: 13, outline: "none", boxSizing: "border-box",
                      resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
                  />
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
                  <button onClick={() => { setView("list"); setEditTour(null); setFormTab("details"); }} style={{
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
            )}

            {/* ── PHOTOS TAB ── */}
            {formTab === "photos" && (
              <div style={{ padding: 24 }}>

                {/* Header */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 20,
                }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 500 }}>
                      Photos ({tourPhotos.length})
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                      First photo is used as cover. Click "Set Hero" to change.
                    </p>
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      background: "var(--olive)", color: "white",
                      border: "none", borderRadius: 8,
                      padding: "9px 18px", fontSize: 13, fontWeight: 500,
                      cursor: uploading ? "not-allowed" : "pointer",
                      opacity: uploading ? 0.7 : 1, fontFamily: "inherit",
                    }}
                  >
                    {uploading ? "Uploading…" : "+ Upload Photos"}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Photo grid */}
                {photosLoading ? (
                  <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>
                    Loading photos…
                  </div>
                ) : tourPhotos.length === 0 ? (
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    style={{
                      border: "0.5px dashed var(--border)",
                      borderRadius: 12, padding: 48,
                      textAlign: "center", cursor: "pointer",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
                    <div style={{ fontSize: 14 }}>Click to upload your first photo</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      JPG, PNG or WebP · Max 5MB each · Multiple allowed
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 12,
                  }}>
                    {tourPhotos.map(photo => (
                      <div key={photo.id} style={{
                        border: photo.is_cover
                          ? "2px solid var(--olive)"
                          : "0.5px solid var(--border)",
                        borderRadius: 10, overflow: "hidden",
                        position: "relative",
                      }}>
                        {photo.is_cover && (
                          <div style={{
                            position: "absolute", top: 8, left: 8,
                            background: "var(--olive)", color: "white",
                            fontSize: 10, fontWeight: 600,
                            padding: "2px 8px", borderRadius: 20, zIndex: 1,
                          }}>
                            Hero
                          </div>
                        )}
                        <img
                          src={photo.url}
                          alt=""
                          style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                        />
                        <div style={{ padding: "8px", display: "flex", gap: 6, background: "white" }}>
                          {!photo.is_cover && (
                            <button
                              onClick={() => setHeroPhoto(photo)}
                              style={{
                                flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 500,
                                border: "0.5px solid var(--border)", borderRadius: 6,
                                cursor: "pointer", background: "transparent",
                                color: "var(--text-primary)", fontFamily: "inherit",
                              }}
                            >
                              Set Hero
                            </button>
                          )}
                          <button
                            onClick={() => deletePhoto(photo)}
                            style={{
                              flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 500,
                              border: "0.5px solid #fca5a5", borderRadius: 6,
                              cursor: "pointer", background: "var(--red-light)",
                              color: "var(--red)", fontFamily: "inherit",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note for new tours */}
                {!editTour && tourPhotos.length > 0 && (
                  <div style={{
                    marginTop: 16, padding: "10px 14px",
                    background: "var(--olive-light)", borderRadius: 8,
                    fontSize: 12, color: "var(--olive-dark)",
                  }}>
                    ℹ Photos will be saved when you submit the tour in the Details tab.
                  </div>
                )}
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default ToursPage;
