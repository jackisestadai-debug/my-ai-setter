"use client";

import { useEffect, useRef, useState } from "react";

export default function SveaLanding() {
  const [scrolled, setScrolled] = useState(false);
  const demoRef = useRef<HTMLElement | null>(null);
  const nicheRef = useRef<HTMLElement | null>(null);
  const bokRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <span style={s.logo}>Svea AI Partners</span>
        <div style={s.navLinks}>
          <button style={s.navLink} onClick={() => scrollTo(demoRef)}>Demo</button>
          <button style={s.navLink} onClick={() => scrollTo(nicheRef)}>Nischer</button>
          <button style={s.navCta} onClick={() => scrollTo(bokRef)}>Boka möte</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge}>AI-driven försäljning · Byggt för Sverige</div>
          <h1 style={s.h1}>
            Din AI-säljare som<br />
            <span style={s.accent}>bokar möten dygnet runt</span>
          </h1>
          <p style={s.heroSub}>
            Svea AI Partners levererar en fullt tränad AI-assistent som hanterar
            Instagram-DMs, kvalificerar leads och bokar möten — helt automatiskt,
            på svenska, i din röst.
          </p>
          <div style={s.heroBtns}>
            <button style={s.btnPrimary} onClick={() => scrollTo(demoRef)}>
              Se Aura i aktion →
            </button>
            <button style={s.btnGhost} onClick={() => scrollTo(bokRef)}>
              Boka ett 20-min samtal
            </button>
          </div>
          <div style={s.heroStats}>
            <Stat value="24/7" label="Alltid tillgänglig" />
            <Stat value="&lt;60 s" label="Svarstid" />
            <Stat value="3×" label="Fler bokade möten" />
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section ref={demoRef} style={s.section}>
        <SectionLabel>Demo</SectionLabel>
        <h2 style={s.h2}>Möt Aura — din AI-assistent</h2>
        <p style={s.sectionSub}>
          Aura pratar med dina leads precis som du skulle göra — empatisk,
          tydlig och alltid i rätt ton. Testa en konversation direkt nedan.
        </p>
        <div style={s.demoCard}>
          <div style={s.demoHeader}>
            <div style={s.demoAvatar}>A</div>
            <div>
              <div style={s.demoName}>Aura</div>
              <div style={s.demoStatus}>● Online nu</div>
            </div>
          </div>
          <div style={s.demoBubbles}>
            <DemoBubble from="aura">
              Hej! Jag såg att du följer oss — vad intressant! Vad är det du
              jobbar med just nu? 😊
            </DemoBubble>
            <DemoBubble from="lead">
              Jag driver en klinik och letar efter fler patienter</DemoBubble>
            <DemoBubble from="aura">
              Perfekt, det är precis där vi kan hjälpa. Vi har satt upp
              AI-system för kliniker som ökar bokningarna med 2–3x på 90 dagar.
              Skulle du ha 20 minuter för ett snabbt samtal den här veckan?
            </DemoBubble>
          </div>
          <div style={s.demoFooter}>
            <span style={s.demoNote}>
              ↑ Verklig konversation — inte ett manus, utan AI som tänker
            </span>
          </div>
        </div>
        <p style={s.demoLink}>
          Vill du testa din egen version?{" "}
          <button style={s.inlineLink} onClick={() => scrollTo(bokRef)}>
            Boka en demo
          </button>
        </p>
      </section>

      {/* NISCHER */}
      <section ref={nicheRef} style={{ ...s.section, background: "#0d0d0d" }}>
        <SectionLabel>Nischer</SectionLabel>
        <h2 style={s.h2}>Byggd för din bransch</h2>
        <p style={s.sectionSub}>
          Vi specialanpassar AI:n för varje kund — röst, tonalitet och
          säljflöde skräddarsys utifrån din nisch.
        </p>
        <div style={s.nicheGrid}>
          <NicheCard
            icon="🏥"
            title="Kliniker & Hälsa"
            desc="Boka patientmöten, filtrera leads och minska no-shows med automatiska påminnelser."
          />
          <NicheCard
            icon="🎤"
            title="Event & Artister"
            desc="Hantera bokningsförfrågningar och konvertera fans till betalande kunder direkt i DMs."
          />
          <NicheCard
            icon="🏋️"
            title="Coaches & PT"
            desc="Kvalificera prospekt och boka konsultationer utan att du behöver lyfta ett finger."
          />
          <NicheCard
            icon="🏠"
            title="Mäklare & Fastighet"
            desc="Svara på visningsförfrågningar, boka möten och håll leads varma automatiskt."
          />
          <NicheCard
            icon="📈"
            title="Digitala byråer"
            desc="Skala outreach utan att anställa — AI:n hanterar hundratals konversationer parallellt."
          />
          <NicheCard
            icon="✨"
            title="Din nisch"
            desc="Har du en annan bransch? Vi bygger anpassade flöden för alla typer av service-businesses."
          />
        </div>
      </section>

      {/* HUR DET FUNGERAR */}
      <section style={s.section}>
        <SectionLabel>Processen</SectionLabel>
        <h2 style={s.h2}>Igång på 7 dagar</h2>
        <div style={s.steps}>
          <Step num={1} title="Onboarding-samtal" desc="Vi lär oss din röst, ditt erbjudande och dina idealkunder på 60 minuter." />
          <Step num={2} title="AI-träning" desc="Vi konfigurerar och tränar Aura med dina riktlinjer, svar och säljflöde." />
          <Step num={3} title="Live & optimering" desc="AI:n går live. Vi följer upp veckovis och justerar tills konverteringen är maxad." />
        </div>
      </section>

      {/* BOKA MÖTE */}
      <section ref={bokRef} style={{ ...s.section, background: "#050510" }}>
        <SectionLabel>Boka möte</SectionLabel>
        <h2 style={s.h2}>Redo att testa?</h2>
        <p style={s.sectionSub}>
          Boka ett kostnadsfritt 20-minutersmöte. Vi visar hur Aura fungerar
          för just din verksamhet — inga förpliktelser.
        </p>
        {/* Calendly inline embed — byt ut URL mot din riktiga Calendly-länk */}
        <div style={s.calendlyWrap}>
          <iframe
            src="https://calendly.com/svea-ai-partners/demo"
            style={s.calendlyIframe}
            title="Boka möte med Svea AI Partners"
          />
        </div>
        <p style={s.calendlyFallback}>
          Fungerar inte inbäddningen?{" "}
          <a
            href="https://calendly.com/svea-ai-partners/demo"
            target="_blank"
            rel="noopener noreferrer"
            style={s.inlineLink}
          >
            Öppna Calendly direkt →
          </a>
        </p>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <span style={s.footerLogo}>Svea AI Partners</span>
        <span style={s.footerCopy}>© {new Date().getFullYear()} · Alla rättigheter förbehålls</span>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={s.stat}>
      <div style={s.statValue} dangerouslySetInnerHTML={{ __html: value }} />
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={s.sectionLabel}>{children}</div>;
}

function DemoBubble({ from, children }: { from: "aura" | "lead"; children: React.ReactNode }) {
  return (
    <div style={{ ...s.bubble, ...(from === "lead" ? s.bubbleLead : s.bubbleAura) }}>
      {children}
    </div>
  );
}

function NicheCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={s.nicheCard}>
      <div style={s.nicheIcon}>{icon}</div>
      <div style={s.nicheTitle}>{title}</div>
      <div style={s.nicheDesc}>{desc}</div>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div style={s.step}>
      <div style={s.stepNum}>{num}</div>
      <div>
        <div style={s.stepTitle}>{title}</div>
        <div style={s.stepDesc}>{desc}</div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "#080818",
    color: "#e8e8f0",
    minHeight: "100vh",
  },

  /* NAV */
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 40px",
    transition: "background 0.3s, border-bottom 0.3s",
  },
  navScrolled: {
    background: "rgba(8,8,24,0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1a1a3a",
  },
  logo: { fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", color: "#fff" },
  navLinks: { display: "flex", gap: 8, alignItems: "center" },
  navLink: {
    background: "none",
    border: "none",
    color: "#aaa",
    fontSize: 14,
    cursor: "pointer",
    padding: "6px 14px",
    borderRadius: 6,
    transition: "color 0.2s",
  },
  navCta: {
    background: "#4f46e5",
    border: "none",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    padding: "8px 18px",
    borderRadius: 8,
  },

  /* HERO */
  hero: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "120px 24px 80px",
    background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1a1060 0%, transparent 70%)",
  },
  heroInner: {
    maxWidth: 760,
    textAlign: "center",
  },
  badge: {
    display: "inline-block",
    background: "rgba(79,70,229,0.2)",
    border: "1px solid rgba(79,70,229,0.4)",
    color: "#a5b4fc",
    fontSize: 13,
    fontWeight: 500,
    padding: "6px 16px",
    borderRadius: 20,
    marginBottom: 28,
    letterSpacing: "0.3px",
  },
  h1: {
    fontSize: "clamp(36px, 6vw, 64px)",
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: "-1.5px",
    margin: "0 0 24px",
    color: "#fff",
  },
  accent: {
    background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: 18,
    color: "#9090b0",
    lineHeight: 1.7,
    maxWidth: 560,
    margin: "0 auto 40px",
  },
  heroBtns: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  btnPrimary: {
    background: "#4f46e5",
    border: "none",
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    padding: "14px 28px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "transform 0.15s",
  },
  btnGhost: {
    background: "transparent",
    border: "1px solid #333",
    color: "#ccc",
    fontSize: 16,
    padding: "14px 28px",
    borderRadius: 10,
    cursor: "pointer",
  },
  heroStats: {
    display: "flex",
    gap: 40,
    justifyContent: "center",
    marginTop: 56,
    flexWrap: "wrap",
  },
  stat: { textAlign: "center" },
  statValue: { fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-1px" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 4 },

  /* SECTIONS */
  section: {
    padding: "100px 24px",
    maxWidth: "100%",
  },
  sectionLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "2px",
    color: "#6366f1",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  h2: {
    textAlign: "center",
    fontSize: "clamp(28px, 4vw, 44px)",
    fontWeight: 700,
    letterSpacing: "-0.8px",
    color: "#fff",
    margin: "0 auto 16px",
    maxWidth: 640,
  },
  sectionSub: {
    textAlign: "center",
    color: "#808098",
    fontSize: 17,
    lineHeight: 1.7,
    maxWidth: 560,
    margin: "0 auto 56px",
  },

  /* DEMO */
  demoCard: {
    maxWidth: 520,
    margin: "0 auto",
    background: "#0f0f1e",
    border: "1px solid #1e1e3a",
    borderRadius: 16,
    overflow: "hidden",
  },
  demoHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 20px",
    borderBottom: "1px solid #1a1a30",
    background: "#0a0a18",
  },
  demoAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #9333ea)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    color: "#fff",
  },
  demoName: { fontWeight: 600, fontSize: 14, color: "#e8e8f0" },
  demoStatus: { fontSize: 12, color: "#34d399", marginTop: 2 },
  demoBubbles: {
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 180,
  },
  bubble: {
    padding: "10px 14px",
    borderRadius: 14,
    maxWidth: "80%",
    fontSize: 14,
    lineHeight: 1.5,
  },
  bubbleAura: {
    alignSelf: "flex-start",
    background: "#1a1a30",
    color: "#d8d8f0",
    borderBottomLeftRadius: 4,
  },
  bubbleLead: {
    alignSelf: "flex-end",
    background: "#4f46e5",
    color: "#fff",
    borderBottomRightRadius: 4,
  },
  demoFooter: {
    padding: "12px 20px",
    borderTop: "1px solid #1a1a30",
    background: "#0a0a18",
  },
  demoNote: { fontSize: 12, color: "#555" },
  demoLink: { textAlign: "center", marginTop: 28, color: "#777", fontSize: 15 },
  inlineLink: {
    background: "none",
    border: "none",
    color: "#818cf8",
    fontSize: "inherit",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },

  /* NICHES */
  nicheGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    maxWidth: 900,
    margin: "0 auto",
  },
  nicheCard: {
    background: "#0f0f1e",
    border: "1px solid #1e1e3a",
    borderRadius: 14,
    padding: "28px 24px",
    transition: "border-color 0.2s",
  },
  nicheIcon: { fontSize: 28, marginBottom: 12 },
  nicheTitle: { fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 8 },
  nicheDesc: { fontSize: 14, color: "#808098", lineHeight: 1.6 },

  /* STEPS */
  steps: {
    maxWidth: 640,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  step: { display: "flex", gap: 20, alignItems: "flex-start" },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(79,70,229,0.2)",
    border: "1px solid rgba(79,70,229,0.4)",
    color: "#818cf8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  stepTitle: { fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 4 },
  stepDesc: { fontSize: 15, color: "#808098", lineHeight: 1.6 },

  /* CALENDLY */
  calendlyWrap: {
    maxWidth: 700,
    margin: "0 auto",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #1e1e3a",
    background: "#fff",
    minHeight: 650,
  },
  calendlyIframe: {
    width: "100%",
    height: 650,
    border: "none",
    display: "block",
  },
  calendlyFallback: {
    textAlign: "center",
    marginTop: 16,
    color: "#666",
    fontSize: 14,
  },

  /* FOOTER */
  footer: {
    borderTop: "1px solid #141428",
    padding: "32px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  footerLogo: { fontWeight: 700, fontSize: 15, color: "#444" },
  footerCopy: { fontSize: 13, color: "#444" },
};
