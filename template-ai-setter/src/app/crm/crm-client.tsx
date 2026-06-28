"use client";

/**
 * Rekvo CRM — daglig aktivitetstracker + lead-hantering.
 *
 * Två flikar: TELEFON (cold calls) och DM (Instagram).
 * Toppen: klick-räknare för dagens aktivitet.
 * Mitten: sökbar leadlista med status-chips.
 * Lead-modal: logga samtal, sätt status, nästa steg, anteckningar.
 *
 * URL: /crm?k=<access-key>
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

const KEY = () =>
  typeof window === "undefined"
    ? ""
    : new URLSearchParams(window.location.search).get("k") || "";

type Channel = "call" | "dm";

type Activity = {
  dials: number;
  conversations: number;
  pickups: number;
  outreaches: number;
  followups_outreach: number;
  followups_dials: number;
  demos_pitched: number;
  demos_booked: number;
  demos_done: number;
  deals_closed: number;
  cash_collected: number;
  contract_value: number;
};

type Stats = {
  dials: number;
  conversations: number;
  pickups: number;
  outreaches: number;
  followups_outreach: number;
  demos_pitched: number;
  demos_booked: number;
  demos_done: number;
  deals_closed: number;
  cash_collected: number;
  contract_value: number;
  abr: string;
  show_rate: string;
  close_rate: string;
  booking_rate: string;
};

type WeekDay = {
  activity_date: string;
  dials: number;
  conversations: number;
  demos_booked: number;
  deals_closed: number;
  cash_collected: number;
};

const DIAL_GOAL = 100;

type LeadStatus = "new" | "engaged" | "booked" | "done" | "lost";

type Lead = {
  id: string;
  company_name: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  ig_username: string | null;
  status: LeadStatus;
  crm_channel: Channel | null;
  next_step: string | null;
  needs_followup: boolean;
  crm_notes: string | null;
  demo_date: string | null;
  created_at: string;
  updated_at: string;
};

const EMPTY_ACTIVITY: Activity = {
  dials: 0, conversations: 0, pickups: 0, outreaches: 0,
  followups_outreach: 0, followups_dials: 0,
  demos_pitched: 0, demos_booked: 0, demos_done: 0, deals_closed: 0,
  cash_collected: 0, contract_value: 0,
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Ny", engaged: "Kontakt", booked: "Bokad", done: "Klar", lost: "Tappad",
};
const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "#4a90b8", engaged: "#c9a84c", booked: "#5ab87a", done: "#7d869c", lost: "#c0392b",
};

// ── helpers ──────────────────────────────────────────────────────────────────

function todayIso() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

function displayDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

// ── main component ───────────────────────────────────────────────────────────

export default function CrmClient() {
  const [view, setView] = useState<"tracker" | "log">("tracker");
  const [channel, setChannel] = useState<Channel>("call");
  const [activity, setActivity] = useState<Activity>(EMPTY_ACTIVITY);
  const [stats, setStats] = useState<Stats | null>(null);
  const [week, setWeek] = useState<WeekDay[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [showWeek, setShowWeek] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Lead | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);

  // ── log view state ────────────────────────────────────────────────────────
  const [logDate, setLogDate] = useState(todayIso);
  const [logActivity, setLogActivity] = useState<Activity | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  const actSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── API helpers ──────────────────────────────────────────────────────────

  const api = useCallback(
    (path: string, opts?: RequestInit) =>
      fetch(`${path}${path.includes("?") ? "&" : "?"}k=${KEY()}`, opts),
    []
  );

  // ── load activity + leads ────────────────────────────────────────────────

  const loadActivity = useCallback(async () => {
    const r = await api(`/api/crm/activity?date=${todayIso()}`);
    if (!r.ok) return;
    const { activity: a } = await r.json();
    if (a) setActivity({ ...EMPTY_ACTIVITY, ...a });
  }, [api]);

  const loadStats = useCallback(async () => {
    const r = await api("/api/crm/stats");
    if (!r.ok) return;
    const { stats: s } = await r.json();
    if (s) setStats(s);
  }, [api]);

  const loadWeek = useCallback(async () => {
    const r = await api("/api/crm/week");
    if (!r.ok) return;
    const { week: w } = await r.json();
    if (w) setWeek(w);
  }, [api]);

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams({ channel });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("q", search);
    const r = await api(`/api/crm/leads?${params}`);
    if (!r.ok) return;
    const { leads: l } = await r.json();
    setLeads(l ?? []);
  }, [api, channel, statusFilter, search]);

  const loadLog = useCallback(async (date: string) => {
    setLogLoading(true);
    setLogActivity(null);
    const r = await api(`/api/crm/activity?date=${date}`);
    if (r.ok) {
      const { activity: a } = await r.json();
      setLogActivity(a ? { ...EMPTY_ACTIVITY, ...a } : EMPTY_ACTIVITY);
    }
    setLogLoading(false);
  }, [api]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadActivity(), loadLeads(), loadStats(), loadWeek()]).finally(() => setLoading(false));
  }, [loadActivity, loadLeads, loadStats, loadWeek]);

  useEffect(() => {
    if (view === "log") loadLog(logDate);
  }, [view, logDate, loadLog]);

  // ── activity counter: debounced save ─────────────────────────────────────

  const bumpActivity = useCallback(
    (key: keyof Activity, delta: number) => {
      setActivity((prev) => {
        const next = { ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) };
        // debounce save 800ms after last tap
        if (actSaveTimer.current) clearTimeout(actSaveTimer.current);
        actSaveTimer.current = setTimeout(async () => {
          setSavingActivity(true);
          await api("/api/crm/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...next, date: todayIso() }),
          });
          setSavingActivity(false);
        }, 800);
        return next;
      });
    },
    [api]
  );

  // ── update a lead ─────────────────────────────────────────────────────────

  const updateLead = useCallback(
    async (id: string, patch: Partial<Lead>) => {
      setSaving(true);
      const r = await api(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaving(false);
      if (!r.ok) return;
      const { lead } = await r.json();
      setLeads((prev) => prev.map((l) => (l.id === id ? lead : l)));
      if (modal?.id === id) setModal(lead);
    },
    [api, modal]
  );

  // ── create a lead ─────────────────────────────────────────────────────────

  const createLead = useCallback(
    async (form: Omit<Lead, "id" | "created_at" | "updated_at">) => {
      setSaving(true);
      const r = await api("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaving(false);
      if (!r.ok) return;
      await loadLeads();
      setAddOpen(false);
    },
    [api, loadLeads]
  );

  // ── delete a lead ─────────────────────────────────────────────────────────

  const deleteLead = useCallback(
    async (id: string) => {
      if (!confirm("Ta bort lead?")) return;
      await api(`/api/crm/leads/${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setModal(null);
    },
    [api]
  );

  // ── filter leads locally for snappiness ──────────────────────────────────

  const visibleLeads = leads.filter((l) => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.company_name?.toLowerCase().includes(q) ||
        l.full_name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.ig_username?.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  // ── tracker definition ────────────────────────────────────────────────────

  const callCounters: { key: keyof Activity; label: string }[] = [
    { key: "dials", label: "Samtal Ringda" },
    { key: "pickups", label: "Svar" },
    { key: "conversations", label: "Samtal Startade" },
    { key: "demos_pitched", label: "Demo Pitchade" },
    { key: "demos_booked", label: "Demo Bokade" },
    { key: "demos_done", label: "Demo Genomförda" },
    { key: "deals_closed", label: "Avslutade Affärer" },
    { key: "followups_dials", label: "Uppföljningar" },
  ];

  const todayStr = todayIso();

  const dmCounters: { key: keyof Activity; label: string }[] = [
    { key: "outreaches", label: "DM Skickade" },
    { key: "pickups", label: "Svar Mottagna" },
    { key: "conversations", label: "Konversation Startade" },
    { key: "demos_pitched", label: "Demo Pitchade" },
    { key: "demos_booked", label: "Demo Bokade" },
    { key: "demos_done", label: "Demo Genomförda" },
    { key: "deals_closed", label: "Avslutade Affärer" },
    { key: "followups_outreach", label: "Uppföljningar" },
  ];

  const counters = channel === "call" ? callCounters : dmCounters;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.root}>
      {/* header */}
      <div style={S.header}>
        <span style={S.brand}>REKVO CRM</span>
        <span style={S.dateLabel}>{new Date().toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}</span>
        {savingActivity && <span style={S.savingDot} title="sparar..." />}
      </div>

      {/* top-level tabs */}
      <div style={S.tabs}>
        <button style={{ ...S.tab, ...(view === "tracker" && channel === "call" ? S.tabActive : {}) }} onClick={() => { setView("tracker"); setChannel("call"); }}>TELEFON</button>
        <button style={{ ...S.tab, ...(view === "tracker" && channel === "dm" ? S.tabActive : {}) }} onClick={() => { setView("tracker"); setChannel("dm"); }}>INSTAGRAM DM</button>
        <button style={{ ...S.tab, ...(view === "log" ? S.tabActive : {}) }} onClick={() => setView("log")}>HISTORIK</button>
      </div>

      {view === "log" && (
        <LogView date={logDate} onDateChange={setLogDate} activity={logActivity} loading={logLoading} />
      )}

      {view === "tracker" && <>

      {/* daily tracker */}
      <div style={S.section}>
        <div style={S.sectionTitle}>IDAG</div>

        {/* goal progress bar (only on TELEFON tab) */}
        {channel === "call" && (
          <div style={S.goalBox}>
            <div style={S.goalRow}>
              <span style={S.goalLabel}>Mål: Samtal Ringda</span>
              <span style={S.goalCount}>
                <span style={{ color: activity.dials >= DIAL_GOAL ? "#5ab87a" : G }}>{activity.dials}</span>
                <span style={{ color: MUTED }}> / {DIAL_GOAL}</span>
              </span>
            </div>
            <div style={S.progressTrack}>
              <div style={{
                ...S.progressFill,
                width: `${Math.min(100, (activity.dials / DIAL_GOAL) * 100)}%`,
                background: activity.dials >= DIAL_GOAL
                  ? "linear-gradient(90deg, #5ab87a, #3d9e5e)"
                  : `linear-gradient(90deg, ${G}, #a8892e)`,
              }} />
            </div>
          </div>
        )}

        <div style={S.counterGrid}>
          {counters.map(({ key, label }) => (
            <Counter
              key={key}
              label={label}
              value={activity[key]}
              onPlus={() => bumpActivity(key, 1)}
              onMinus={() => bumpActivity(key, -1)}
            />
          ))}
        </div>

        {channel === "dm" && (
          <div style={S.financeRow}>
            <div style={S.financeField}>
              <div style={S.financeLabel}>Inkasserat Belopp (SEK)</div>
              <input
                type="number"
                min={0}
                style={S.financeInput}
                value={activity.cash_collected || ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setActivity((prev) => ({ ...prev, cash_collected: v }));
                }}
                onBlur={() => {
                  if (actSaveTimer.current) clearTimeout(actSaveTimer.current);
                  setSavingActivity(true);
                  api("/api/crm/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...activity, date: todayIso() }),
                  }).finally(() => setSavingActivity(false));
                }}
                placeholder="0"
              />
            </div>
            <div style={S.financeField}>
              <div style={S.financeLabel}>Kontraktsvärde (SEK)</div>
              <input
                type="number"
                min={0}
                style={S.financeInput}
                value={activity.contract_value || ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setActivity((prev) => ({ ...prev, contract_value: v }));
                }}
                onBlur={() => {
                  if (actSaveTimer.current) clearTimeout(actSaveTimer.current);
                  setSavingActivity(true);
                  api("/api/crm/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...activity, date: todayIso() }),
                  }).finally(() => setSavingActivity(false));
                }}
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* weekly view */}
      <div style={S.section}>
        <div style={{ ...S.sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>DENNA VECKA</span>
          <button style={S.toggleBtn} onClick={() => setShowWeek((v) => !v)}>
            {showWeek ? "Dölj" : "Visa"}
          </button>
        </div>
        {showWeek && (
          <div style={S.weekGrid}>
            {["Mån","Tis","Ons","Tor","Fre","Lör","Sön"].map((dayName, i) => {
              const date = new Date();
              const diff = date.getUTCDay() === 0 ? -6 : 1 - date.getUTCDay();
              const d = new Date(date);
              d.setUTCDate(date.getUTCDate() + diff + i);
              const iso = d.toISOString().slice(0, 10);
              const row = week.find((w) => w.activity_date === iso);
              const isToday = iso === todayStr;
              return (
                <div key={iso} style={{ ...S.weekDay, ...(isToday ? S.weekDayToday : {}) }}>
                  <div style={S.weekDayName}>{dayName}</div>
                  <div style={{ ...S.weekDials, color: (row?.dials ?? 0) >= DIAL_GOAL ? "#5ab87a" : row?.dials ? G : MUTED }}>
                    {row?.dials ?? 0}
                  </div>
                  {(row?.demos_booked ?? 0) > 0 && (
                    <div style={S.weekDemo}>+{row!.demos_booked} demo</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* demo pipeline */}
      {leads.filter((l) => l.status === "booked").length > 0 && (
        <div style={S.section}>
          <div style={S.sectionTitle}>BOKADE DEMOS</div>
          <div style={S.demoList}>
            {leads
              .filter((l) => l.status === "booked")
              .sort((a, b) => (a.demo_date ?? "9999") < (b.demo_date ?? "9999") ? -1 : 1)
              .map((lead) => (
                <div key={lead.id} style={S.demoCard} onClick={() => setModal(lead)}>
                  <div style={S.demoName}>{lead.company_name || lead.full_name || "Okänd"}</div>
                  <div style={S.demoRight}>
                    {lead.demo_date && (
                      <span style={S.demoDate}>{new Date(lead.demo_date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}</span>
                    )}
                    {lead.next_step && <span style={S.demoNext}>{lead.next_step}</span>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* total stats section */}
      <div style={S.section}>
        <div style={{ ...S.sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>TOTAL STATISTIK</span>
          <button style={S.toggleBtn} onClick={() => setShowStats((v) => !v)}>
            {showStats ? "Dölj" : "Visa"}
          </button>
        </div>
        {showStats && stats && (
          <div>
            {channel === "call" ? (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: MUTED, marginBottom: 8, marginTop: 4 }}>TELEFON</div>
                <div style={S.statsGrid}>
                  <StatBox label="Samtal Ringda" value={stats.dials.toLocaleString("sv-SE")} />
                  <StatBox label="Svar" value={stats.pickups} />
                  <StatBox label="Samtal Startade" value={stats.conversations} />
                  <StatBox label="Demo Pitchade" value={stats.demos_pitched} />
                  <StatBox label="Demo Bokade" value={stats.demos_booked} />
                  <StatBox label="Demo Genomförda" value={stats.demos_done} />
                  <StatBox label="Avslutade Affärer" value={stats.deals_closed} />
                  <StatBox label="Svarsfrekvens" value={`${stats.abr}%`} accent />
                  <StatBox label="Bokningsfrekvens" value={`${stats.booking_rate}%`} accent />
                  <StatBox label="Show Rate" value={`${stats.show_rate}%`} accent />
                  <StatBox label="Close Rate" value={`${stats.close_rate}%`} accent />
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: MUTED, marginBottom: 8, marginTop: 4 }}>INSTAGRAM DM</div>
                <div style={S.statsGrid}>
                  <StatBox label="DMs Skickade" value={stats.outreaches} />
                  <StatBox label="Uppföljningar" value={stats.followups_outreach} />
                </div>
              </>
            )}
            {/* INTÄKT — visas på båda flikar */}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: MUTED, marginBottom: 8, marginTop: 16 }}>INTÄKT</div>
            <div style={S.statsGrid}>
              <StatBox label="Inkasserat" value={`${stats.cash_collected.toLocaleString("sv-SE")} kr`} accent />
              <StatBox label="Kontraktsvärde" value={`${stats.contract_value.toLocaleString("sv-SE")} kr`} accent />
            </div>
          </div>
        )}
      </div>

      {/* leads section */}
      <div style={S.section}>
        <div style={{ ...S.sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>LEADS</span>
          <button style={S.addBtn} onClick={() => setAddOpen(true)}>+ Lägg till</button>
        </div>

        {/* search + filter */}
        <div style={S.filterRow}>
          <input
            style={S.search}
            placeholder="Sök företag, namn, telefon…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={S.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
          >
            <option value="">Alla</option>
            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* needs followup banner */}
        {visibleLeads.filter((l) => l.needs_followup).length > 0 && (
          <div style={S.followupBanner}>
            {visibleLeads.filter((l) => l.needs_followup).length} lead(s) behöver uppföljning
          </div>
        )}

        {/* lead list */}
        {loading ? (
          <div style={S.empty}>Laddar…</div>
        ) : visibleLeads.length === 0 ? (
          <div style={S.empty}>Inga leads ännu. Tryck "Lägg till" för att börja.</div>
        ) : (
          <div style={S.leadList}>
            {visibleLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onClick={() => setModal(lead)} />
            ))}
          </div>
        )}
      </div>

      {/* back to HQ link */}
      <div style={{ textAlign: "center", paddingBottom: 32 }}>
        <a href={`/hq?k=${KEY()}`} style={S.hqLink}>← Tillbaka till HQ</a>
      </div>

      </>}

      {/* lead detail modal */}
      {modal && (
        <LeadModal
          lead={modal}
          saving={saving}
          onUpdate={(patch) => updateLead(modal.id, patch)}
          onDelete={() => deleteLead(modal.id)}
          onClose={() => setModal(null)}
        />
      )}

      {/* add lead modal */}
      {addOpen && (
        <AddLeadModal
          channel={channel}
          saving={saving}
          onCreate={createLead}
          onClose={() => setAddOpen(false)}
        />
      )}

      <CrmStyles />
    </div>
  );
}

// ── LogView component ─────────────────────────────────────────────────────────

const LOG_ROWS: { key: keyof Activity; label: string; isMoney?: boolean }[] = [
  { key: "dials", label: "Samtal Ringda" },
  { key: "pickups", label: "Svar" },
  { key: "conversations", label: "Samtal Startade" },
  { key: "outreaches", label: "DM Skickade" },
  { key: "followups_outreach", label: "Uppföljningar DM" },
  { key: "followups_dials", label: "Uppföljningar Telefon" },
  { key: "demos_pitched", label: "Demo Pitchade" },
  { key: "demos_booked", label: "Demo Bokade" },
  { key: "demos_done", label: "Demo Genomförda" },
  { key: "deals_closed", label: "Avslutade Affärer" },
  { key: "cash_collected", label: "Inkasserat Belopp", isMoney: true },
  { key: "contract_value", label: "Kontraktsvärde", isMoney: true },
];

function LogView({
  date, onDateChange, activity, loading,
}: {
  date: string;
  onDateChange: (d: string) => void;
  activity: Activity | null;
  loading: boolean;
}) {
  const MUTED = "rgba(232,224,204,0.35)";
  const CARD = "rgba(255,255,255,0.04)";
  const BORDER = "rgba(126,184,212,0.12)";
  const G = "#c9a84c";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            color: "#e8e0cc",
            fontSize: 14,
            padding: "8px 12px",
            outline: "none",
            colorScheme: "dark",
          }}
        />
        <span style={{ fontSize: 11, color: MUTED }}>
          {new Date(date + "T12:00:00").toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      {loading ? (
        <div style={{ color: MUTED, fontSize: 13, padding: "20px 0" }}>Laddar…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LOG_ROWS.map(({ key, label, isMoney }) => {
            const val = activity?.[key] ?? 0;
            const hasVal = val > 0;
            return (
              <div
                key={key}
                style={{
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  opacity: hasVal ? 1 : 0.45,
                }}
              >
                <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: hasVal ? G : "#e8e0cc" }}>
                  {isMoney && hasVal ? val.toLocaleString("sv-SE") + " kr" : val}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── StatBox component ─────────────────────────────────────────────────────────

function StatBox({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div style={S.statBox}>
      <div style={S.statLabel}>{label}</div>
      <div style={{ ...S.statVal, color: accent ? G : TEXT }}>{value}</div>
    </div>
  );
}

// ── Counter component ─────────────────────────────────────────────────────────

function Counter({
  label, value, onPlus, onMinus,
}: {
  label: string; value: number; onPlus: () => void; onMinus: () => void;
}) {
  return (
    <div style={S.counter}>
      <div style={S.counterLabel}>{label}</div>
      <div style={S.counterRow}>
        <button style={S.minusBtn} onClick={onMinus}>−</button>
        <span style={S.counterVal}>{value}</span>
        <button style={S.plusBtn} onClick={onPlus}>+</button>
      </div>
    </div>
  );
}

// ── LeadCard component ────────────────────────────────────────────────────────

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const name = lead.company_name || lead.full_name || lead.ig_username || "Okänd";
  const sub = lead.company_name ? (lead.full_name || lead.phone || lead.ig_username) : (lead.phone || lead.ig_username);

  return (
    <div style={{ ...S.card, ...(lead.needs_followup ? S.cardFollowup : {}) }} onClick={onClick}>
      <div style={S.cardLeft}>
        <div style={S.cardName}>{name}</div>
        {sub && <div style={S.cardSub}>{sub}</div>}
        {lead.next_step && <div style={S.cardNextStep}>→ {lead.next_step}</div>}
      </div>
      <div style={S.cardRight}>
        <span style={{ ...S.statusChip, background: STATUS_COLORS[lead.status] || "#4a90b8" }}>
          {STATUS_LABELS[lead.status as LeadStatus] || lead.status}
        </span>
        {lead.needs_followup && <span style={S.followupDot} title="Behöver uppföljning" />}
      </div>
    </div>
  );
}

// ── LeadModal component ───────────────────────────────────────────────────────

function LeadModal({
  lead, saving, onUpdate, onDelete, onClose,
}: {
  lead: Lead;
  saving: boolean;
  onUpdate: (patch: Partial<Lead>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    company_name: lead.company_name || "",
    full_name: lead.full_name || "",
    phone: lead.phone || "",
    ig_username: lead.ig_username || "",
    status: lead.status,
    next_step: lead.next_step || "",
    crm_notes: lead.crm_notes || "",
    needs_followup: lead.needs_followup,
    demo_date: lead.demo_date || "",
  });
  const [dirty, setDirty] = useState(false);

  const set = (k: string, v: unknown) => {
    setForm((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  const save = () => {
    onUpdate({
      company_name: form.company_name || null,
      full_name: form.full_name || null,
      phone: form.phone || null,
      ig_username: form.ig_username || null,
      status: form.status,
      next_step: form.next_step || null,
      crm_notes: form.crm_notes || null,
      needs_followup: form.needs_followup,
      demo_date: form.demo_date || null,
    } as Partial<Lead>);
    setDirty(false);
  };

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modalBox}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>{lead.company_name || lead.full_name || "Lead"}</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.modalBody}>
          <Label>Företag</Label>
          <Input value={form.company_name} onChange={(v) => set("company_name", v)} placeholder="Företagsnamn" />

          <Label>Kontaktperson</Label>
          <Input value={form.full_name} onChange={(v) => set("full_name", v)} placeholder="Namn" />

          <Label>Telefon</Label>
          <Input value={form.phone} onChange={(v) => set("phone", v)} placeholder="+46 70 000 00 00" type="tel" />

          <Label>Instagram</Label>
          <Input value={form.ig_username} onChange={(v) => set("ig_username", v)} placeholder="@username" />

          <Label>Status</Label>
          <select
            style={S.modalSelect}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <Label>Demo-datum</Label>
          <input
            style={S.modalInput}
            type="date"
            value={form.demo_date}
            onChange={(e) => { set("demo_date", e.target.value); }}
          />

          <Label>Nästa steg</Label>
          <Input value={form.next_step} onChange={(v) => set("next_step", v)} placeholder="T.ex. Ring igen fredag" />

          <Label>Anteckningar</Label>
          <textarea
            style={S.textarea}
            value={form.crm_notes}
            onChange={(e) => { set("crm_notes", e.target.value); }}
            placeholder="Vad sa de? Vad är deras problem?"
            rows={4}
          />

          <label style={S.checkRow}>
            <input
              type="checkbox"
              checked={form.needs_followup}
              onChange={(e) => set("needs_followup", e.target.checked)}
            />
            <span style={{ marginLeft: 8 }}>Behöver uppföljning</span>
          </label>

          <div style={S.modalActions}>
            <button
              style={{ ...S.saveBtn, opacity: dirty ? 1 : 0.5 }}
              disabled={!dirty || saving}
              onClick={save}
            >
              {saving ? "Sparar…" : "Spara"}
            </button>
            <button style={S.deleteBtn} onClick={onDelete}>Ta bort</button>
          </div>

          <div style={S.modalMeta}>
            Skapad {displayDate(lead.created_at)} · Uppdaterad {displayDate(lead.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AddLeadModal component ────────────────────────────────────────────────────

function AddLeadModal({
  channel, saving, onCreate, onClose,
}: {
  channel: Channel;
  saving: boolean;
  onCreate: (form: Omit<Lead, "id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    company_name: "", full_name: "", phone: "", ig_username: "",
    status: "new" as LeadStatus, next_step: "", crm_notes: "",
    needs_followup: false, email: null as null | string,
    crm_channel: channel,
  });

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.company_name && !form.full_name && !form.phone && !form.ig_username) return;
    onCreate({
      company_name: form.company_name || null,
      full_name: form.full_name || null,
      phone: form.phone || null,
      email: form.email || null,
      ig_username: form.ig_username || null,
      status: form.status,
      crm_channel: form.crm_channel,
      next_step: form.next_step || null,
      crm_notes: form.crm_notes || null,
      needs_followup: form.needs_followup,
      demo_date: null,
    });
  };

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modalBox}>
        <div style={S.modalHeader}>
          <span style={S.modalTitle}>Nytt Lead</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          <Label>Företag</Label>
          <Input value={form.company_name} onChange={(v) => set("company_name", v)} placeholder="Företagsnamn" autoFocus />

          <Label>Kontaktperson</Label>
          <Input value={form.full_name} onChange={(v) => set("full_name", v)} placeholder="Namn" />

          {channel === "call" ? (
            <>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(v) => set("phone", v)} placeholder="+46 70 000 00 00" type="tel" />
            </>
          ) : (
            <>
              <Label>Instagram</Label>
              <Input value={form.ig_username} onChange={(v) => set("ig_username", v)} placeholder="@username" />
            </>
          )}

          <Label>Nästa steg</Label>
          <Input value={form.next_step} onChange={(v) => set("next_step", v)} placeholder="T.ex. Skicka DM idag" />

          <Label>Anteckningar</Label>
          <textarea
            style={S.textarea}
            value={form.crm_notes}
            onChange={(e) => set("crm_notes", e.target.value)}
            placeholder="Bransch, problem, noteringar…"
            rows={3}
          />

          <div style={S.modalActions}>
            <button style={S.saveBtn} disabled={saving} onClick={submit}>
              {saving ? "Sparar…" : "Lägg till"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── tiny shared inputs ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div style={S.label}>{children}</div>;
}

function Input({
  value, onChange, placeholder, type = "text", autoFocus,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  return (
    <input
      style={S.modalInput}
      value={value}
      type={type}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const G = "#c9a84c"; // gold
const BG = "#0d0d0f";
const CARD = "#13151c";
const BORDER = "rgba(201,168,76,0.18)";
const TEXT = "#dde2ee";
const MUTED = "#7d869c";

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: BG,
    color: TEXT,
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    maxWidth: 600,
    margin: "0 auto",
    padding: "0 16px 40px",
    fontSize: 13,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "18px 0 10px",
    borderBottom: `1px solid ${BORDER}`,
    marginBottom: 4,
  },
  brand: {
    color: G,
    fontWeight: 700,
    letterSpacing: "0.12em",
    fontSize: 14,
    flexGrow: 1,
  },
  dateLabel: { color: MUTED, fontSize: 12 },
  savingDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: G, opacity: 0.8,
    boxShadow: `0 0 8px ${G}`,
    animation: "pulse 1s infinite",
  },
  tabs: { display: "flex", gap: 8, padding: "12px 0 4px" },
  tab: {
    flex: 1,
    padding: "9px 0",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: "rgba(255,255,255,0.03)",
    color: MUTED,
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    cursor: "pointer",
  },
  tabActive: {
    background: `linear-gradient(90deg, ${G}, #a8892e)`,
    color: "#0d0d0f",
    border: `1px solid ${G}`,
  },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.18em",
    color: MUTED,
    marginBottom: 12,
  },
  counterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
  },
  financeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 8,
  },
  financeField: {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: "10px 12px",
  },
  financeLabel: { fontSize: 10, color: MUTED, letterSpacing: "0.06em", marginBottom: 6 },
  financeInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${BORDER}`,
    color: "#e8e0cc",
    fontSize: 20,
    fontWeight: 700,
    outline: "none",
    padding: "2px 0",
    boxSizing: "border-box" as const,
  },
  counter: {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: "12px 14px",
  },
  counterLabel: { fontSize: 10, color: MUTED, marginBottom: 8, letterSpacing: "0.06em" },
  counterRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counterVal: { fontSize: 28, fontWeight: 700, color: G, letterSpacing: "-0.02em" },
  plusBtn: {
    width: 34, height: 34,
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: "rgba(201,168,76,0.1)",
    color: G,
    fontSize: 20,
    cursor: "pointer",
    lineHeight: 1,
    fontFamily: "inherit",
  },
  minusBtn: {
    width: 34, height: 34,
    border: `1px solid rgba(125,134,156,0.3)`,
    borderRadius: 6,
    background: "rgba(255,255,255,0.03)",
    color: MUTED,
    fontSize: 20,
    cursor: "pointer",
    lineHeight: 1,
    fontFamily: "inherit",
  },
  addBtn: {
    padding: "5px 12px",
    border: `1px solid ${G}`,
    borderRadius: 6,
    background: "rgba(201,168,76,0.1)",
    color: G,
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.06em",
  },
  filterRow: { display: "flex", gap: 8, marginBottom: 10 },
  search: {
    flex: 1,
    padding: "9px 12px",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: CARD,
    color: TEXT,
    fontFamily: "inherit",
    fontSize: 13,
    outline: "none",
  },
  select: {
    padding: "9px 10px",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: CARD,
    color: TEXT,
    fontFamily: "inherit",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    minWidth: 90,
  },
  followupBanner: {
    background: "rgba(201,168,76,0.12)",
    border: `1px solid rgba(201,168,76,0.4)`,
    borderRadius: 6,
    padding: "8px 12px",
    color: G,
    fontSize: 12,
    marginBottom: 10,
  },
  leadList: { display: "flex", flexDirection: "column", gap: 6 },
  card: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  cardFollowup: { borderColor: "rgba(201,168,76,0.45)" },
  cardLeft: { flex: 1, minWidth: 0 },
  cardName: { fontWeight: 600, fontSize: 13, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardSub: { fontSize: 11, color: MUTED, marginTop: 2 },
  cardNextStep: { fontSize: 11, color: G, marginTop: 3, opacity: 0.85 },
  cardRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: 12, flexShrink: 0 },
  statusChip: {
    fontSize: 10, fontWeight: 700, padding: "3px 8px",
    borderRadius: 10, color: "#fff", letterSpacing: "0.06em",
  },
  followupDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: G, boxShadow: `0 0 6px ${G}`,
  },
  empty: { color: MUTED, fontSize: 13, padding: "24px 0", textAlign: "center" },

  // overlay / modal
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  },
  modalBox: {
    background: "#1a1c23",
    border: `1px solid ${BORDER}`,
    borderRadius: "16px 16px 0 0",
    width: "100%",
    maxWidth: 600,
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 12px",
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
  },
  modalTitle: { fontWeight: 700, fontSize: 14, color: TEXT, letterSpacing: "0.04em" },
  closeBtn: {
    background: "none", border: "none", color: MUTED,
    fontSize: 18, cursor: "pointer", fontFamily: "inherit", lineHeight: 1,
  },
  modalBody: {
    padding: "16px 20px 32px",
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: { fontSize: 10, color: MUTED, letterSpacing: "0.1em", marginTop: 10, marginBottom: 4 },
  modalInput: {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: CARD,
    color: TEXT,
    fontFamily: "inherit",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  modalSelect: {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: CARD,
    color: TEXT,
    fontFamily: "inherit",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    background: CARD,
    color: TEXT,
    fontFamily: "inherit",
    fontSize: 13,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    color: TEXT,
    cursor: "pointer",
    fontSize: 13,
    marginTop: 10,
  },
  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 20,
  },
  saveBtn: {
    flex: 1,
    padding: "12px",
    background: `linear-gradient(90deg, ${G}, #a8892e)`,
    color: "#0d0d0f",
    border: "none",
    borderRadius: 8,
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: "0.06em",
  },
  deleteBtn: {
    padding: "12px 16px",
    background: "rgba(192,57,43,0.15)",
    color: "#e74c3c",
    border: "1px solid rgba(192,57,43,0.4)",
    borderRadius: 8,
    fontFamily: "inherit",
    fontSize: 13,
    cursor: "pointer",
  },
  modalMeta: {
    fontSize: 10,
    color: MUTED,
    textAlign: "center",
    marginTop: 16,
  },
  hqLink: {
    color: MUTED,
    fontSize: 12,
    textDecoration: "none",
    letterSpacing: "0.06em",
  },

  // goal progress
  goalBox: {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: "12px 14px",
    marginBottom: 10,
  },
  goalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalLabel: { fontSize: 10, color: MUTED, letterSpacing: "0.1em", fontWeight: 700 },
  goalCount: { fontSize: 13, fontWeight: 700 },
  progressTrack: {
    width: "100%",
    height: 6,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },

  // weekly view
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  },
  weekDay: {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: "8px 4px",
    textAlign: "center" as const,
  },
  weekDayToday: {
    border: `1px solid ${G}`,
    background: "rgba(201,168,76,0.07)",
  },
  weekDayName: { fontSize: 9, color: MUTED, letterSpacing: "0.06em", marginBottom: 4 },
  weekDials: { fontSize: 16, fontWeight: 700 },
  weekDemo: { fontSize: 9, color: "#5ab87a", marginTop: 2 },

  // demo pipeline
  demoList: { display: "flex", flexDirection: "column" as const, gap: 6 },
  demoCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "rgba(90,184,122,0.07)",
    border: "1px solid rgba(90,184,122,0.3)",
    borderRadius: 8,
    cursor: "pointer",
  },
  demoName: { fontWeight: 600, fontSize: 13, color: TEXT },
  demoRight: { display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 2 },
  demoDate: { fontSize: 11, color: "#5ab87a", fontWeight: 700 },
  demoNext: { fontSize: 10, color: MUTED },

  // stats
  toggleBtn: {
    padding: "3px 10px",
    border: `1px solid ${BORDER}`,
    borderRadius: 5,
    background: "none",
    color: MUTED,
    fontFamily: "inherit",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.08em",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
  },
  statBox: {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: "10px 14px",
  },
  statLabel: { fontSize: 10, color: MUTED, marginBottom: 4, letterSpacing: "0.06em" },
  statVal: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" },
};

function CrmStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; background: ${BG}; }
      @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      input::placeholder, textarea::placeholder { color: ${MUTED}; }
      button:active { opacity: 0.75; }
      select option { background: #1a1c23; color: ${TEXT}; }
    `}</style>
  );
}
