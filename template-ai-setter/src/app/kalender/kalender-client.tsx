"use client";

import { useEffect, useState } from "react";

const ACCESS_KEY = "svea-hq-2024";

// Google Calendar embed URL derived from the iCal feed address
const GCAL_EMBED =
  "https://calendar.google.com/calendar/embed?src=jackisestad.ai%40gmail.com&ctz=Europe%2FStockholm&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&mode=WEEK&hl=sv";

function formatDate(d: Date) {
  return d.toLocaleDateString("sv-SE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function KalenderClient() {
  const [authorized, setAuthorized] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("k") || "";
    if (k === ACCESS_KEY) setAuthorized(true);
    setToday(formatDate(new Date()));
  }, []);

  if (!authorized) {
    return (
      <div style={S.page}>
        <div style={{ color: "#7eb8d4", textAlign: "center", marginTop: 80, fontFamily: "monospace" }}>
          Ingen åtkomst.
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.dateLabel}>{today}</div>
      </div>
      <iframe
        src={GCAL_EMBED}
        style={S.cal}
        frameBorder="0"
        scrolling="no"
        title="Google Kalender"
      />
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    background: "#0d0d0d",
    color: "#e8e0cc",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    padding: "16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    display: "flex",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 13,
    color: "#7eb8d4",
    textTransform: "capitalize",
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  cal: {
    flex: 1,
    width: "100%",
    borderRadius: 10,
    border: "1px solid rgba(126,184,212,0.18)",
    minHeight: 0,
  },
};
