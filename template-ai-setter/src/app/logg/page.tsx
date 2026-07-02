"use client";
import React, { useEffect, useState, useRef } from "react";

const QUESTIONS = [
  { key: "plan",   label: "PLAN",   desc: "Vad är din en sak att göra imorgon?" },
  { key: "bevis",  label: "BEVIS",  desc: "Vad gjorde du faktiskt idag?" },
  { key: "undvek", label: "UNDVEK", desc: "Vad sköt du upp eller undvek?" },
  { key: "vinst",  label: "VINST",  desc: "En sak du är stolt över idag." },
] as const;

type Key = typeof QUESTIONS[number]["key"];
type Entry = Partial<Record<Key, string>> & { log_date?: string };

function getKey() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("k") ?? "";
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
}

export default function LoggPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [entry, setEntry] = useState<Entry>({});
  const [history, setHistory] = useState<Entry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState<Record<Key, boolean>>({ plan: true, bevis: true, undvek: true, vinst: true });
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const k = getKey();

  useEffect(() => {
    fetch(`/api/hq/daily-log?k=${k}&date=${today}`)
      .then((r) => r.json())
      .then((d) => setEntry(d.entry ?? {}))
      .catch(() => {});
  }, [k, today]);

  function handleChange(field: Key, value: string) {
    setEntry((e) => ({ ...e, [field]: value }));
    setSaved((s) => ({ ...s, [field]: false }));
    clearTimeout(timers.current[field]);
    timers.current[field] = setTimeout(() => {
      const current = { ...entry, [field]: value };
      fetch(`/api/hq/daily-log?k=${k}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, ...current }),
      }).then(() => setSaved((s) => ({ ...s, [field]: true }))).catch(() => {});
    }, 800);
  }

  function loadHistory() {
    fetch(`/api/hq/daily-log?k=${k}&history=1`)
      .then((r) => r.json())
      .then((d) => { setHistory(d.entries ?? []); setShowHistory(true); })
      .catch(() => {});
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080e1a", color: "#e8e0cc", fontFamily: "ui-sans-serif, system-ui, sans-serif", padding: "40px 24px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700, marginBottom: 4 }}>REKVO</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "0.06em" }}>LOGG JACK</h1>
          <div style={{ color: "rgba(232,224,204,0.4)", fontSize: 12, marginTop: 4 }}>{fmtDate(today)}</div>
        </div>
        <button onClick={showHistory ? () => setShowHistory(false) : loadHistory} style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, color: "#c9a84c", fontSize: 11, padding: "7px 14px", cursor: "pointer", letterSpacing: "0.08em" }}>
          {showHistory ? "IDAG" : "HISTORIK"}
        </button>
      </div>

      {!showHistory ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {QUESTIONS.map(({ key, label, desc }, i) => (
            <div key={key} style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 10, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span style={{ color: "rgba(201,168,76,0.4)", fontSize: 10, marginRight: 8 }}>0{i + 1}</span>
                  <span style={{ color: "#c9a84c", fontSize: 11, letterSpacing: "0.14em", fontWeight: 700 }}>{label}</span>
                  <span style={{ color: "rgba(232,224,204,0.4)", fontSize: 11, marginLeft: 10 }}>{desc}</span>
                </div>
                <span style={{ fontSize: 9, color: saved[key] ? "rgba(201,168,76,0.3)" : "#c9a84c", letterSpacing: "0.05em" }}>
                  {saved[key] ? "● sparat" : "sparar…"}
                </span>
              </div>
              <textarea
                value={entry[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                rows={3}
                style={{ width: "100%", background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 6, color: "#e8e0cc", fontSize: 13, padding: "10px 12px", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
                placeholder="Skriv här..."
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.length === 0 && <div style={{ color: "rgba(232,224,204,0.3)", fontSize: 13 }}>Ingen historik ännu.</div>}
          {history.map((h) => (
            <div key={h.log_date} style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 12 }}>{h.log_date ? fmtDate(h.log_date) : ""}</div>
              {QUESTIONS.map(({ key, label }) => h[key] ? (
                <div key={key} style={{ marginBottom: 8 }}>
                  <span style={{ color: "rgba(201,168,76,0.5)", fontSize: 10, letterSpacing: "0.1em", marginRight: 8 }}>{label}</span>
                  <span style={{ color: "rgba(232,224,204,0.8)", fontSize: 12 }}>{h[key]}</span>
                </div>
              ) : null)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
