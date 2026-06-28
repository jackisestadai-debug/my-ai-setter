"use client";

import { useEffect, useState } from "react";

const ACCESS_KEY = "svea-hq-2024";

const GCAL_EMBED =
  "https://calendar.google.com/calendar/embed?src=jackisestad.ai%40gmail.com&ctz=Europe%2FStockholm&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&mode=WEEK&hl=sv";

const WMO_LABELS: Record<number, string> = {
  0: "Klart", 1: "Mest klart", 2: "Delvis molnigt", 3: "Mulet",
  45: "Dimma", 48: "Issdimma",
  51: "Lätt duggregn", 53: "Duggregn", 55: "Kraftigt duggregn",
  61: "Lätt regn", 63: "Regn", 65: "Kraftigt regn",
  71: "Lätt snöfall", 73: "Snöfall", 75: "Kraftigt snöfall",
  80: "Regnskurar", 81: "Regnskurar", 82: "Kraftiga skurar",
  95: "Åska", 96: "Åska med hagel", 99: "Kraftig åska",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("sv-SE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

type Weather = { temp: number; label: string };
type NextMeeting = { name: string; demo_date: string };

export default function KalenderClient() {
  const [authorized, setAuthorized] = useState(false);
  const [today, setToday] = useState("");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [nextMeeting, setNextMeeting] = useState<NextMeeting | null>(null);
  const [meetingLoading, setMeetingLoading] = useState(true);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("k") || "";
    if (k === ACCESS_KEY) setAuthorized(true);
    setToday(formatDate(new Date()));
  }, []);

  useEffect(() => {
    if (!authorized) return;

    // Fetch Stockholm weather from Open-Meteo (no API key needed)
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=59.33&longitude=18.07&current=temperature_2m,weather_code&timezone=Europe%2FStockholm"
    )
      .then((r) => r.json())
      .then((d) => {
        const temp = Math.round(d.current.temperature_2m);
        const code = d.current.weather_code as number;
        const label = WMO_LABELS[code] ?? "Okänt";
        setWeather({ temp, label });
      })
      .catch(() => {});

    // Fetch next booked meeting
    const k = new URLSearchParams(window.location.search).get("k") || "";
    fetch(`/api/crm/leads?k=${k}&status=booked`)
      .then((r) => r.json())
      .then(({ leads }) => {
        if (!leads?.length) return;
        const withDate = (leads as NextMeeting[])
          .filter((l) => l.demo_date)
          .sort((a, b) => (a.demo_date < b.demo_date ? -1 : 1));
        const upcoming = withDate.find((l) => daysUntil(l.demo_date) >= 0);
        if (upcoming) setNextMeeting(upcoming);
      })
      .catch(() => {})
      .finally(() => setMeetingLoading(false));
  }, [authorized]);

  if (!authorized) {
    return (
      <div style={S.page}>
        <div style={{ color: "#7eb8d4", textAlign: "center", marginTop: 80, fontFamily: "monospace" }}>
          Ingen åtkomst.
        </div>
      </div>
    );
  }

  const days = nextMeeting ? daysUntil(nextMeeting.demo_date) : null;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.dateLabel}>{today}</div>
        <div style={S.widgets}>
          {weather && (
            <div style={S.widget}>
              <span style={S.widgetTemp}>{weather.temp}°C</span>
              <span style={S.widgetSub}>{weather.label}</span>
            </div>
          )}
          {!meetingLoading && (
            <div style={S.widget}>
              {nextMeeting && days !== null ? (
                <>
                  <span style={S.widgetTemp}>
                    {days === 0 ? "Idag!" : days === 1 ? "Imorgon" : `${days} dagar`}
                  </span>
                  <span style={S.widgetSub}>
                    {days === 0 || days === 1 ? "Nästa demo" : "till nästa demo"}
                    {nextMeeting.demo_date && (
                      <> · {new Date(nextMeeting.demo_date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}</>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <span style={S.widgetTemp}>—</span>
                  <span style={S.widgetSub}>Inga bokade demos</span>
                </>
              )}
            </div>
          )}
        </div>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  dateLabel: {
    fontSize: 13,
    color: "#7eb8d4",
    textTransform: "capitalize",
    letterSpacing: "0.05em",
    fontWeight: 600,
    paddingTop: 2,
  },
  widgets: {
    display: "flex",
    gap: 12,
    flexShrink: 0,
  },
  widget: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    background: "rgba(126,184,212,0.08)",
    border: "1px solid rgba(126,184,212,0.18)",
    borderRadius: 8,
    padding: "6px 12px",
    minWidth: 90,
  },
  widgetTemp: {
    fontSize: 15,
    fontWeight: 700,
    color: "#7eb8d4",
    lineHeight: 1.2,
  },
  widgetSub: {
    fontSize: 10,
    color: "rgba(126,184,212,0.6)",
    letterSpacing: "0.03em",
    textAlign: "right",
  },
  cal: {
    flex: 1,
    width: "100%",
    borderRadius: 10,
    border: "1px solid rgba(126,184,212,0.18)",
    minHeight: 0,
  },
};
