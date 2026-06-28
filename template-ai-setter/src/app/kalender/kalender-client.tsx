"use client";

import { useEffect, useState } from "react";

const ACCESS_KEY = process.env.NEXT_PUBLIC_ACCESS_KEY || "svea-hq-2024";
const GCAL_STORAGE_KEY = "rekvo-gcal-embed-url";

const FOOTBALLER_QUOTES: { quote: string; author: string }[] = [
  { quote: "Your love makes me strong, your hate makes me unstoppable.", author: "Cristiano Ronaldo" },
  { quote: "I don't have a Plan B, because if I had one, I would start to doubt Plan A.", author: "Kylian Mbappé" },
  { quote: "I start early and I stay late, day after day, year after year. It took me 17 years and 114 days to become an overnight success.", author: "Lionel Messi" },
  { quote: "I am like fine wine. I get better with age. You haven't seen the best of me yet.", author: "Zlatan Ibrahimović" },
  { quote: "Playing football is very simple, but playing simple football is the hardest thing there is.", author: "Johan Cruyff" },
  { quote: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.", author: "Pelé" },
  { quote: "Hard work beats talent when talent doesn't work hard.", author: "Wayne Rooney" },
  { quote: "I never wanted to be ordinary. I never wanted to look back and think I could have tried harder.", author: "Thierry Henry" },
  { quote: "The secret is to believe in your dreams; in your potential that you can be like your role model, your team, in the talent that you have, and to work hard every day.", author: "Ronaldinho" },
  { quote: "Some people believe football is a matter of life and death. I am very disappointed with that attitude. I can assure you it is much, much more important than that.", author: "Bill Shankly" },
  { quote: "You have to fight to reach your dream. You have to sacrifice and work hard for it.", author: "Lionel Messi" },
  { quote: "I am not a perfectionist, but I like to feel that things are done well.", author: "Zinedine Zidane" },
  { quote: "Impossible is just a word thrown around by small men who find it easier to live in the world they've been given than to explore the power they have to change it.", author: "Muhammad Ali (inspiration)" },
  { quote: "Age is just a number. What matters is how you feel and how you play.", author: "Didier Drogba" },
  { quote: "Talent without working hard is nothing.", author: "Cristiano Ronaldo" },
  { quote: "The more difficult the victory, the greater the happiness in winning.", author: "Pelé" },
  { quote: "You can't put a limit on anything. The more you dream, the farther you get.", author: "Michael Phelps (adopted by many footballers)" },
  { quote: "Everything is practice.", author: "Pelé" },
  { quote: "I learned all about life with a ball at my feet.", author: "Ronaldinho" },
  { quote: "When you have bad moments, work even harder. That's the only way.", author: "Kylian Mbappé" },
];

function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return FOOTBALLER_QUOTES[dayOfYear % FOOTBALLER_QUOTES.length];
}

function formatDate(d: Date) {
  return d.toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function KalenderClient() {
  const [authorized, setAuthorized] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [today, setToday] = useState("");
  const quote = getDailyQuote();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const k = params.get("k") || "";
    if (k === ACCESS_KEY) {
      setAuthorized(true);
    }
    const saved = localStorage.getItem(GCAL_STORAGE_KEY);
    if (saved) setEmbedUrl(saved);
    else setShowSetup(true);
    setToday(formatDate(new Date()));
  }, []);

  const saveUrl = () => {
    const url = inputUrl.trim();
    if (!url) return;
    localStorage.setItem(GCAL_STORAGE_KEY, url);
    setEmbedUrl(url);
    setShowSetup(false);
  };

  const clearUrl = () => {
    localStorage.removeItem(GCAL_STORAGE_KEY);
    setEmbedUrl(null);
    setInputUrl("");
    setShowSetup(true);
  };

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
        <button style={S.settingsBtn} onClick={() => setShowSetup((v) => !v)}>⚙ Kalender-URL</button>
      </div>

      <div style={S.quoteCard}>
        <div style={S.quoteText}>&ldquo;{quote.quote}&rdquo;</div>
        <div style={S.quoteAuthor}>— {quote.author}</div>
      </div>

      {showSetup && (
        <div style={S.setupCard}>
          <div style={S.setupTitle}>KOPPLA GOOGLE KALENDER</div>
          <div style={S.setupInstructions}>
            1. Gå till <strong>Google Kalender</strong> → Inställningar → din kalender<br />
            2. Scrolla ner till <strong>&quot;Integrera kalender&quot;</strong><br />
            3. Kopiera <strong>inbäddnings-URL</strong> (börjar med <code>https://calendar.google.com/calendar/embed?src=</code>)<br />
            4. Klistra in den nedan
          </div>
          <div style={S.inputRow}>
            <input
              style={S.input}
              placeholder="https://calendar.google.com/calendar/embed?src=..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveUrl()}
            />
            <button style={S.saveBtn} onClick={saveUrl}>Spara</button>
          </div>
        </div>
      )}

      {embedUrl && !showSetup && (
        <div style={S.calWrap}>
          <iframe
            src={embedUrl}
            style={S.calIframe}
            frameBorder="0"
            scrolling="no"
            title="Google Kalender"
          />
          <button style={S.clearBtn} onClick={clearUrl}>Byt kalender</button>
        </div>
      )}

      {!embedUrl && !showSetup && (
        <div style={{ textAlign: "center", color: "#7eb8d4", marginTop: 40, fontFamily: "monospace", fontSize: 13 }}>
          Ingen kalender konfigurerad. <button style={{ ...S.clearBtn, display: "inline-block" }} onClick={() => setShowSetup(true)}>Lägg till</button>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0d0d0d",
    color: "#e8e0cc",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 13,
    color: "#7eb8d4",
    textTransform: "capitalize",
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  settingsBtn: {
    background: "rgba(126,184,212,0.08)",
    border: "1px solid rgba(126,184,212,0.2)",
    color: "#7eb8d4",
    borderRadius: 6,
    padding: "4px 12px",
    fontSize: 11,
    cursor: "pointer",
    letterSpacing: "0.08em",
  },
  quoteCard: {
    background: "linear-gradient(135deg, rgba(126,184,212,0.07), rgba(13,19,36,0.6))",
    border: "1px solid rgba(126,184,212,0.18)",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#f5f0e1",
    fontStyle: "italic",
    marginBottom: 10,
  },
  quoteAuthor: {
    fontSize: 12,
    color: "#7eb8d4",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  setupCard: {
    background: "rgba(126,184,212,0.05)",
    border: "1px solid rgba(126,184,212,0.2)",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 24,
  },
  setupTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.2em",
    color: "#7eb8d4",
    marginBottom: 14,
  },
  setupInstructions: {
    fontSize: 13,
    color: "#b0a890",
    lineHeight: 1.8,
    marginBottom: 16,
  },
  inputRow: {
    display: "flex",
    gap: 10,
  },
  input: {
    flex: 1,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(126,184,212,0.3)",
    borderRadius: 8,
    color: "#e8e0cc",
    padding: "10px 14px",
    fontSize: 13,
    outline: "none",
  },
  saveBtn: {
    background: "linear-gradient(90deg,#c9a84c,#7eb8d4)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  calWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  calIframe: {
    width: "100%",
    height: "calc(100vh - 280px)",
    minHeight: 500,
    borderRadius: 12,
    border: "1px solid rgba(126,184,212,0.18)",
  },
  clearBtn: {
    background: "rgba(126,184,212,0.08)",
    border: "1px solid rgba(126,184,212,0.2)",
    color: "#7eb8d4",
    borderRadius: 6,
    padding: "4px 12px",
    fontSize: 11,
    cursor: "pointer",
    letterSpacing: "0.08em",
    alignSelf: "flex-start",
  },
};
