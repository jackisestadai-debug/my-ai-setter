"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* ── Types ── */
type NicheKey = "klinik" | "coach" | "artist" | "maklare" | "byra" | "restaurant";
interface NicheData {
  icon: string;
  label: string;
  conversation: { from: "aura" | "lead"; text: string }[];
}

/* ── Nisch-konversationer ── */
const NICHES: Record<NicheKey, NicheData> = {
  klinik: {
    icon: "🏥", label: "Klinik & Hälsa",
    conversation: [
      { from: "aura", text: "Hej! Söker du hjälp med något specifikt just nu? 😊" },
      { from: "lead", text: "Ja, jag har ont i ryggen och letar efter en naprapat" },
      { from: "aura", text: "Det förstår jag — ryggbesvär kan vara jobbigt. Vi har lediga tider redan den här veckan. Vill du att jag bokar in ett besök?" },
      { from: "lead", text: "Ja gärna, vad kostar det?" },
      { from: "aura", text: "Första besöket kostar 595 kr och tar 45 min. Jag skickar en bokningslänk direkt 👉 [länk]" },
    ],
  },
  coach: {
    icon: "🏋️", label: "Coach & PT",
    conversation: [
      { from: "aura", text: "Hej! Såg att du kollade in våra program — vad är ditt mål just nu? 💪" },
      { from: "lead", text: "Vill gå ner i vikt och komma igång med styrketräning" },
      { from: "aura", text: "Perfekt! Vi ser resultat redan inom 8 veckor med rätt program. Vill du boka en gratis 20-min konsultation?" },
      { from: "lead", text: "Ja det låter bra!" },
      { from: "aura", text: "Toppen! Välj en tid här 👉 [länk]. Ser fram emot att träffas!" },
    ],
  },
  artist: {
    icon: "🎤", label: "Artist & Event",
    conversation: [
      { from: "aura", text: "Tack för att du hör av dig! 🎶 Vad kan vi hjälpa dig med?" },
      { from: "lead", text: "Undrar om ni är tillgängliga för bröllop i juni" },
      { from: "aura", text: "Vilken fin anledning! Vi har några datum kvar i juni. Hur många gäster och vilket datum tänkte du?" },
      { from: "lead", text: "Ca 80 gäster, 14 juni" },
      { from: "aura", text: "14 juni är ledigt! Jag bokar ett samtal så vi går igenom detaljerna 👉 [länk]" },
    ],
  },
  maklare: {
    icon: "🏠", label: "Mäklare & Fastighet",
    conversation: [
      { from: "aura", text: "Hej! Letar du aktivt efter bostad just nu? 🏠" },
      { from: "lead", text: "Ja vi letar villa i Djursholm, budget ca 8 miljoner" },
      { from: "aura", text: "Bra budget! Vi har objekt på gång som matchar exakt. Vill du boka en privat visning den här veckan?" },
      { from: "lead", text: "Ja gärna, helst lördag" },
      { from: "aura", text: "Lördag fungerar! Välj tid här 👉 [länk]. Jag skickar adress direkt." },
    ],
  },
  byra: {
    icon: "📈", label: "Digital byrå",
    conversation: [
      { from: "aura", text: "Hej! Hur går det med er Instagram-trafik just nu?" },
      { from: "lead", text: "Okej men vi får inte ut så mycket av det som vi borde" },
      { from: "aura", text: "Det är vanligt! Vi ökar Instagram-ROI med 3–5× inom 90 dagar. Vill du höra hur? Kan boka 20 min direkt." },
      { from: "lead", text: "Absolut, vad kostar det?" },
      { from: "aura", text: "Vi börjar alltid med ett gratis strategisamtal — ingen sälj, bara se om vi passar. Här är länken 👉 [länk]" },
    ],
  },
  restaurant: {
    icon: "🍽️", label: "Restaurant & Café",
    conversation: [
      { from: "aura", text: "Hej! Vill du boka bord eller har du en fråga? 🍽️" },
      { from: "lead", text: "Vi är 8 personer och vill fira födelsedag nästa lördag" },
      { from: "aura", text: "Vad kul! Vi har ett perfekt fönsterbord för 8 ledigt. Vill du ha tårta eller dekorationer?" },
      { from: "lead", text: "Ja tårta vore toppen!" },
      { from: "aura", text: "Självklart! Bekräftar bokningen direkt 👉 [länk]" },
    ],
  },
};

const NICHE_KEYS = Object.keys(NICHES) as NicheKey[];

/* ── Animated demo conversation ── */
function AnimatedChat({ messages }: { messages: { from: "aura" | "lead"; text: string }[] }) {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setVisible(0);
    setTyping(false);
    let cancelled = false;

    async function run() {
      for (let i = 0; i < messages.length; i++) {
        if (cancelled) return;
        setTyping(true);
        await new Promise(r => setTimeout(r, 900));
        if (cancelled) return;
        setTyping(false);
        setVisible(i + 1);
        await new Promise(r => setTimeout(r, 600));
      }
    }
    run();
    return () => { cancelled = true; };
  }, [messages]);

  return (
    <div className="demo-phone__chat">
      {messages.slice(0, visible).map((m, i) => (
        <div key={i} className={`chat-bubble chat-bubble--${m.from}`}>{m.text}</div>
      ))}
      {typing && (
        <div className="chat-bubble chat-bubble--aura typing-indicator">
          <span /><span /><span />
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNiche, setActiveNiche] = useState<NicheKey>("klinik");

  const tjänsterRef = useRef<HTMLElement>(null);
  const aiRef = useRef<HTMLElement>(null);
  const webRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const omRef = useRef<HTMLElement>(null);
  const bokRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(ref: React.RefObject<HTMLElement | null>) {
    setMenuOpen(false);
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
  }

  return (
    <>
      {/* NAV */}
      <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
        <div className="nav__inner">
          <div className="nav__logo">
            <Image src="/logo.svg" alt="Rekvo" width={140} height={52} priority />
          </div>
          <nav className={`nav__links ${menuOpen ? "nav__links--open" : ""}`}>
            <button className="nav__link" onClick={() => go(tjänsterRef)}>Tjänster</button>
            <button className="nav__link" onClick={() => go(aiRef)}>AI-säljare</button>
            <button className="nav__link" onClick={() => go(webRef)}>Hemsidor</button>
            <button className="nav__link" onClick={() => go(omRef)}>Om oss</button>
            <button className="nav__cta" onClick={() => go(bokRef)}>Boka möte</button>
          </nav>
          <button className="nav__burger" aria-label="Meny" onClick={() => setMenuOpen(v => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero__glow" />
        <div className="container hero__inner">
          <span className="badge">Digitala verktyg · Byggt för svenska företag</span>
          <h1 className="hero__h1">
            Vi bygger det digitala<br />
            <span className="gradient-text">som driver din tillväxt</span>
          </h1>
          <p className="hero__sub">
            Rekvo hjälper företag att växa med AI-drivna säljsystem och
            professionella hemsidor — från idé till verklighet.
          </p>
          <div className="hero__btns">
            <button className="btn btn--primary" onClick={() => go(tjänsterRef)}>
              Se vad vi gör →
            </button>
            <button className="btn btn--ghost" onClick={() => go(bokRef)}>
              Boka ett gratis samtal
            </button>
          </div>
          <div className="stats">
            <Stat value="24/7" label="AI alltid aktiv" />
            <div className="stats__divider" />
            <Stat value="7 dagar" label="Från start till live" />
            <div className="stats__divider" />
            <Stat value="3×" label="Fler bokade möten" />
          </div>
        </div>
      </section>

      {/* TJÄNSTER */}
      <section ref={tjänsterRef} className="section section--dark">
        <div className="container">
          <p className="section__label">Vad vi gör</p>
          <h2 className="section__h2">Två tjänster, ett mål — din tillväxt</h2>
          <p className="section__sub">
            Vi kombinerar AI-teknik och webbdesign för att ge ditt företag
            en komplett digital närvaro som faktiskt säljer.
          </p>
          <div className="services-grid">
            <div className="service-card" onClick={() => go(aiRef)}>
              <div className="service-card__icon">🤖</div>
              <h3 className="service-card__title">AI-säljare</h3>
              <p className="service-card__desc">
                En fullt tränad AI-assistent som hanterar dina Instagram-DMs,
                kvalificerar leads och bokar möten — dygnet runt, i din röst.
              </p>
              <span className="service-card__link">Läs mer →</span>
            </div>
            <div className="service-card" onClick={() => go(webRef)}>
              <div className="service-card__icon">💻</div>
              <h3 className="service-card__title">Hemsidor</h3>
              <p className="service-card__desc">
                Moderna, snabba hemsidor byggda med Next.js och driftsatta på
                Vercel — optimerade för konvertering och Google-ranking.
              </p>
              <span className="service-card__link">Läs mer →</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI-SÄLJARE */}
      <section ref={aiRef} className="section">
        <div className="container">
          <p className="section__label">AI-säljare</p>
          <h2 className="section__h2">Rekvo Systems — din AI-assistent</h2>
          <p className="section__sub">
            Rekvo Systems pratar med dina leads precis som du skulle göra. Välj din
            bransch och se hur en verklig konversation ser ut.
          </p>

          {/* Nisch-väljare */}
          <div className="niche-picker">
            {NICHE_KEYS.map(key => (
              <button
                key={key}
                className={`niche-btn ${activeNiche === key ? "niche-btn--active" : ""}`}
                onClick={() => setActiveNiche(key)}
              >
                <span className="niche-btn__icon">{NICHES[key].icon}</span>
                <span className="niche-btn__label">{NICHES[key].label}</span>
              </button>
            ))}
          </div>

          {/* Demo */}
          <div className="demo-wrap">
            <div className="demo-phone">
              <div className="demo-phone__bar">
                <div className="demo-phone__avatar">A</div>
                <div>
                  <div className="demo-phone__name">Rekvo Systems</div>
                  <div className="demo-phone__status">● Online</div>
                </div>
              </div>
              <AnimatedChat key={activeNiche} messages={NICHES[activeNiche].conversation} />
              <div className="demo-phone__footer">
                <span className="demo-phone__note">Verklig AI-konversation anpassad för {NICHES[activeNiche].label.toLowerCase()}</span>
              </div>
            </div>

            <div className="demo-info">
              <h3 className="demo-info__h3">Vad Rekvo Systems gör åt dig</h3>
              <ul className="demo-info__list">
                <FeatureItem>Svarar på DMs inom sekunder, dygnet runt</FeatureItem>
                <FeatureItem>Ställer kvalificerande frågor i din röst</FeatureItem>
                <FeatureItem>Bokar möten direkt i din kalender</FeatureItem>
                <FeatureItem>Skickar påminnelser och följer upp automatiskt</FeatureItem>
                <FeatureItem>Tränas på ditt erbjudande och dina kunder</FeatureItem>
                <FeatureItem>Igång på 7 dagar — utan tekniska förkunskaper</FeatureItem>
              </ul>
              <button className="btn btn--primary" onClick={() => go(bokRef)}>
                Boka en AI-demo →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HEMSIDOR */}
      <section ref={webRef} className="section section--dark">
        <div className="container">
          <p className="section__label">Hemsidor</p>
          <h2 className="section__h2">Hemsidor som faktiskt konverterar</h2>
          <p className="section__sub">
            Vi designar och bygger moderna hemsidor optimerade för snabbhet,
            Google-ranking och konvertering. Precis som den här sidan.
          </p>
          <div className="web-grid">
            <WebFeature icon="⚡" title="Blixtsnabb" desc="Next.js och Vercel ger laddningstider under 1 sekund — Google älskar det." />
            <WebFeature icon="📱" title="Mobilanpassad" desc="Ser perfekt ut på alla skärmar, från mobil till desktop." />
            <WebFeature icon="🔍" title="SEO-optimerad" desc="Byggd för att ranka högt på Google från dag ett." />
            <WebFeature icon="🎨" title="Skräddarsydd design" desc="Ingen mall — varje sida designas utifrån ditt varumärke." />
            <WebFeature icon="🔗" title="Integrationer" desc="Kopplas ihop med bokningssystem, CRM och betalningar." />
            <WebFeature icon="🚀" title="Live på 7 dagar" desc="Från första möte till publicerad sida på en vecka." />
          </div>
          <div className="web-case">
            <div className="web-case__label">Case — rekvo.se</div>
            <p className="web-case__text">
              Den här sidan är ett exempel på vad vi bygger. Designad, kodad
              och driftsatt av Rekvo på 7 dagar.
            </p>
            <button className="btn btn--ghost" onClick={() => go(bokRef)}>
              Få en hemsida som denna →
            </button>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section ref={processRef} className="section">
        <div className="container">
          <p className="section__label">Process</p>
          <h2 className="section__h2">Från idé till live på 7 dagar</h2>
          <p className="section__sub">
            Inga långa projekt. Vi rör oss snabbt och levererar resultat.
          </p>
          <div className="process-steps">
            <ProcessStep num={1} title="Möte & brief" desc="Vi lär oss ditt företag, dina mål och din målgrupp på 60 minuter." />
            <div className="process-steps__arrow">→</div>
            <ProcessStep num={2} title="Design & bygge" desc="Vi designar, kodar och konfigurerar allt — du behöver inte göra något." />
            <div className="process-steps__arrow">→</div>
            <ProcessStep num={3} title="Live & optimering" desc="Vi publicerar och följer upp. Du ser resultat från dag ett." />
          </div>
        </div>
      </section>

      {/* RESULTAT */}
      <section className="section section--dark">
        <div className="container">
          <p className="section__label">Resultat</p>
          <h2 className="section__h2">Det våra kunder säger</h2>
          <div className="testimonials">
            <TestimonialCard
              quote="Vi gick från 3–4 bokningar i veckan till 12–15 utan att anställa fler. Rekvo Systems sköter allt."
              name="Maria L." role="Klinikägare, Stockholm" icon="🏥" />
            <TestimonialCard
              quote="Rekvo byggde vår hemsida på 5 dagar. Den ser proffsig ut och rankar redan på Google."
              name="Erik S." role="Företagare, Göteborg" icon="💻" />
            <TestimonialCard
              quote="AI:n hanterar all inbound nu. Jag kan fokusera på jobbet istället för att svara på DMs."
              name="Anna K." role="Digital byrå, Malmö" icon="📈" />
          </div>
        </div>
      </section>

      {/* OM REKVO */}
      <section ref={omRef} className="section">
        <div className="container">
          <p className="section__label">Om oss</p>
          <h2 className="section__h2">Vi är Rekvo</h2>
          <div className="about-wrap">
            <div className="about-text">
              <p>
                Rekvo är ett svenskt bolag som hjälper företag att växa digitalt —
                snabbt och utan krångel. Vi tror att alla företag förtjänar
                professionella digitala verktyg, oavsett storlek.
              </p>
              <p>
                Vi kombinerar AI-teknik med modern webbutveckling för att leverera
                system som faktiskt fungerar och ger mätbara resultat.
              </p>
              <p>
                Från kliniker och coaches till byråer och restauranger — vi har
                hjälpt företag i hela Sverige att automatisera sin försäljning
                och stärka sin digitala närvaro.
              </p>
              <button className="btn btn--primary" style={{ marginTop: 24 }} onClick={() => go(bokRef)}>
                Kom i kontakt →
              </button>
            </div>
            <div className="about-values">
              <ValueCard icon="⚡" title="Snabbhet" desc="Vi levererar på dagar, inte månader." />
              <ValueCard icon="🎯" title="Resultat" desc="Vi mäter allt och optimerar kontinuerligt." />
              <ValueCard icon="🤝" title="Enkelhet" desc="Inga tekniska förkunskaper krävs." />
            </div>
          </div>
        </div>
      </section>

      {/* BOKA MÖTE */}
      <section ref={bokRef} className="section section--cta">
        <div className="container">
          <p className="section__label">Kom igång</p>
          <h2 className="section__h2">Boka ett gratis 30-minutersmöte</h2>
          <p className="section__sub">
            Vi går igenom dina mål och visar vad vi kan göra för just ditt
            företag — inga förpliktelser, inga tekniska förkunskaper krävs.
          </p>
          <div className="book-cta-wrap">
            <a
              href="https://calendar.app.google/UDJT2g5qk4x4TTHx8"
              target="_blank"
              rel="noopener noreferrer"
              className="book-cta-btn"
            >
              Välj en tid som passar dig →
            </a>
            <p className="book-cta-note">Öppnas i Google Kalender · Gratis · 30 min</p>
          </div>
          <p className="calendly-fallback">
            Fungerar inte bokningsformuläret?{" "}
            <a href="mailto:hej@rekvo.se">Maila oss på hej@rekvo.se →</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer__inner">
          <Image src="/logo.svg" alt="Rekvo" width={120} height={45} />
          <div className="footer__links">
            <button onClick={() => go(tjänsterRef)}>Tjänster</button>
            <button onClick={() => go(aiRef)}>AI-säljare</button>
            <button onClick={() => go(webRef)}>Hemsidor</button>
            <button onClick={() => go(omRef)}>Om oss</button>
            <button onClick={() => go(bokRef)}>Kontakt</button>
          </div>
          <p className="footer__copy">© {new Date().getFullYear()} Rekvo · Alla rättigheter förbehålls</p>
        </div>
      </footer>

      <style>{css}</style>
    </>
  );
}

/* ── Sub-components ── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}
function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="feature-item">
      <span className="feature-item__check">✓</span>{children}
    </li>
  );
}
function WebFeature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="web-feature">
      <div className="web-feature__icon">{icon}</div>
      <h4 className="web-feature__title">{title}</h4>
      <p className="web-feature__desc">{desc}</p>
    </div>
  );
}
function ProcessStep({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="process-step">
      <div className="process-step__num">{num}</div>
      <h3 className="process-step__title">{title}</h3>
      <p className="process-step__desc">{desc}</p>
    </div>
  );
}
function TestimonialCard({ quote, name, role, icon }: { quote: string; name: string; role: string; icon: string }) {
  return (
    <div className="testimonial">
      <div className="testimonial__icon">{icon}</div>
      <p className="testimonial__quote">"{quote}"</p>
      <div className="testimonial__author">
        <strong>{name}</strong>
        <span>{role}</span>
      </div>
    </div>
  );
}
function ValueCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="value-card">
      <span className="value-card__icon">{icon}</span>
      <div>
        <div className="value-card__title">{title}</div>
        <div className="value-card__desc">{desc}</div>
      </div>
    </div>
  );
}

/* ── CSS ── */
const css = `
  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  /* Animations */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes typingPulse { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

  /* NAV */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; transition: background 0.3s, box-shadow 0.3s; }
  .nav--scrolled { background: rgba(7,7,26,0.93); backdrop-filter: blur(14px); box-shadow: 0 1px 0 rgba(255,255,255,0.06); }
  .nav__inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
  .nav__logo { display: flex; align-items: center; }
  .nav__links { display: flex; align-items: center; gap: 4px; }
  .nav__link { background: none; border: none; color: #aaa; font-size: 15px; cursor: pointer; padding: 8px 14px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
  .nav__link:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .nav__cta { background: #4f46e5; border: none; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; padding: 10px 22px; border-radius: 10px; margin-left: 8px; transition: background 0.2s, transform 0.15s; }
  .nav__cta:hover { background: #4338ca; transform: translateY(-1px); }
  .nav__burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
  .nav__burger span { display: block; width: 24px; height: 2px; background: #ccc; border-radius: 2px; }

  /* HERO */
  .hero { min-height: 100vh; display: flex; align-items: center; padding: 140px 0 80px; position: relative; overflow: hidden; }
  .hero__glow { position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 900px; height: 700px; background: radial-gradient(ellipse, rgba(79,70,229,0.22) 0%, transparent 65%); pointer-events: none; }
  .hero__inner { text-align: center; position: relative; width: 100%; }
  .badge { display: inline-block; background: rgba(79,70,229,0.15); border: 1px solid rgba(79,70,229,0.35); color: #a5b4fc; font-size: 13px; font-weight: 500; padding: 7px 18px; border-radius: 100px; margin-bottom: 32px; }
  .hero__h1 { font-size: clamp(38px, 6vw, 68px); font-weight: 800; line-height: 1.08; letter-spacing: -2px; color: #fff; margin: 0 0 28px; }
  .gradient-text { background: linear-gradient(135deg, #818cf8 0%, #c084fc 60%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero__sub { font-size: 18px; color: #8080a8; line-height: 1.75; max-width: 560px; margin: 0 auto 44px; }
  .hero__btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .btn { cursor: pointer; border-radius: 12px; font-size: 16px; font-weight: 600; padding: 14px 30px; border: none; transition: transform 0.15s, background 0.2s; }
  .btn:hover { transform: translateY(-2px); }
  .btn--primary { background: #4f46e5; color: #fff; }
  .btn--primary:hover { background: #4338ca; }
  .btn--ghost { background: transparent; border: 1px solid #2a2a4a; color: #c0c0e0; }
  .btn--ghost:hover { background: rgba(255,255,255,0.04); }
  .stats { display: flex; align-items: center; justify-content: center; margin-top: 60px; flex-wrap: wrap; }
  .stat { text-align: center; padding: 12px 40px; }
  .stat__value { font-size: 34px; font-weight: 800; color: #fff; letter-spacing: -1px; }
  .stat__label { font-size: 13px; color: #606080; margin-top: 4px; }
  .stats__divider { width: 1px; height: 48px; background: #1a1a3a; }

  /* SECTIONS */
  .section { padding: 110px 0; }
  .section--dark { background: #050514; }
  .section--cta { background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(79,70,229,0.18) 0%, transparent 70%); }
  .section__label { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 2.5px; color: #6366f1; text-transform: uppercase; margin-bottom: 14px; }
  .section__h2 { text-align: center; font-size: clamp(28px, 4vw, 46px); font-weight: 700; letter-spacing: -1px; color: #fff; margin: 0 auto 18px; max-width: 680px; }
  .section__sub { text-align: center; color: #707090; font-size: 17px; line-height: 1.75; max-width: 560px; margin: 0 auto 56px; }

  /* TJÄNSTER */
  .services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 800px; margin: 0 auto; }
  .service-card { background: #0a0a1e; border: 1px solid #141430; border-radius: 20px; padding: 36px 32px; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
  .service-card:hover { border-color: #4f46e5; transform: translateY(-4px); }
  .service-card__icon { font-size: 36px; margin-bottom: 16px; }
  .service-card__title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 12px; }
  .service-card__desc { font-size: 15px; color: #707090; line-height: 1.7; margin-bottom: 20px; }
  .service-card__link { color: #818cf8; font-size: 14px; font-weight: 600; }

  /* NICHE PICKER */
  .niche-picker { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 48px; }
  .niche-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 100px; background: #0a0a1e; border: 1px solid #1a1a36; color: #8080a8; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .niche-btn:hover { border-color: #4f46e5; color: #fff; }
  .niche-btn--active { border-color: #6366f1; background: rgba(79,70,229,0.15); color: #fff; }
  .niche-btn__icon { font-size: 18px; }

  /* DEMO */
  .demo-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; max-width: 960px; margin: 0 auto; }
  .demo-phone { background: #0a0a1e; border: 1px solid #1a1a36; border-radius: 20px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.5); }
  .demo-phone__bar { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #131330; background: #070720; }
  .demo-phone__avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #9333ea); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 17px; color: #fff; flex-shrink: 0; }
  .demo-phone__name { font-weight: 600; font-size: 15px; color: #e8e8f8; }
  .demo-phone__status { font-size: 12px; color: #34d399; margin-top: 2px; }
  .demo-phone__chat { padding: 20px 16px; display: flex; flex-direction: column; gap: 10px; min-height: 280px; }
  .chat-bubble { padding: 11px 15px; border-radius: 16px; max-width: 82%; font-size: 14px; line-height: 1.55; animation: fadeUp 0.3s ease forwards; }
  .chat-bubble--aura { align-self: flex-start; background: #16163a; color: #c8c8e8; border-bottom-left-radius: 4px; }
  .chat-bubble--lead { align-self: flex-end; background: #4f46e5; color: #fff; border-bottom-right-radius: 4px; }
  .typing-indicator { display: flex; gap: 4px; align-items: center; padding: 14px 18px; }
  .typing-indicator span { width: 7px; height: 7px; border-radius: 50%; background: #6366f1; animation: typingPulse 1.2s infinite; }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
  .demo-phone__footer { padding: 12px 20px; border-top: 1px solid #131330; background: #070720; }
  .demo-phone__note { font-size: 12px; color: #444464; }
  .demo-info__h3 { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 22px; }
  .demo-info__list { list-style: none; padding: 0; margin: 0 0 32px; display: flex; flex-direction: column; gap: 14px; }
  .feature-item { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: #9090b0; line-height: 1.5; }
  .feature-item__check { color: #6366f1; font-weight: 700; flex-shrink: 0; }

  /* HEMSIDOR */
  .web-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 48px; }
  .web-feature { background: #0a0a1e; border: 1px solid #141430; border-radius: 14px; padding: 24px; }
  .web-feature__icon { font-size: 26px; margin-bottom: 12px; }
  .web-feature__title { font-weight: 700; font-size: 16px; color: #fff; margin-bottom: 8px; }
  .web-feature__desc { font-size: 14px; color: #707090; line-height: 1.6; }
  .web-case { background: rgba(79,70,229,0.08); border: 1px solid rgba(79,70,229,0.2); border-radius: 16px; padding: 32px; text-align: center; max-width: 600px; margin: 0 auto; }
  .web-case__label { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: #6366f1; text-transform: uppercase; margin-bottom: 12px; }
  .web-case__text { color: #9090b0; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }

  /* PROCESS */
  .process-steps { display: flex; align-items: flex-start; gap: 16px; max-width: 900px; margin: 0 auto; justify-content: center; }
  .process-step { flex: 1; max-width: 260px; text-align: center; }
  .process-step__num { width: 52px; height: 52px; border-radius: 50%; background: rgba(79,70,229,0.15); border: 1px solid rgba(79,70,229,0.35); color: #818cf8; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; margin: 0 auto 18px; }
  .process-step__title { font-weight: 700; font-size: 17px; color: #fff; margin-bottom: 10px; }
  .process-step__desc { font-size: 14px; color: #707090; line-height: 1.65; }
  .process-steps__arrow { font-size: 28px; color: #2a2a5a; margin-top: 14px; flex-shrink: 0; }

  /* TESTIMONIALS */
  .testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .testimonial { background: #0a0a1e; border: 1px solid #141430; border-radius: 16px; padding: 28px 24px; }
  .testimonial__icon { font-size: 24px; margin-bottom: 14px; }
  .testimonial__quote { font-size: 15px; color: #9090b0; line-height: 1.7; margin: 0 0 20px; font-style: italic; }
  .testimonial__author { display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
  .testimonial__author strong { color: #d0d0f0; }
  .testimonial__author span { color: #505070; }

  /* OM OSS */
  .about-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; max-width: 960px; margin: 0 auto; }
  .about-text p { color: #9090b0; font-size: 16px; line-height: 1.8; margin: 0 0 16px; }
  .about-values { display: flex; flex-direction: column; gap: 16px; }
  .value-card { display: flex; align-items: flex-start; gap: 16px; background: #0a0a1e; border: 1px solid #141430; border-radius: 14px; padding: 20px; }
  .value-card__icon { font-size: 24px; flex-shrink: 0; }
  .value-card__title { font-weight: 700; font-size: 15px; color: #fff; margin-bottom: 4px; }
  .value-card__desc { font-size: 14px; color: #707090; }

  /* BOKA */
  .book-cta-wrap { text-align: center; padding: 20px 0 10px; }
  .book-cta-btn { display: inline-block; background: linear-gradient(135deg,#818cf8,#c084fc); color: #fff; font-size: 20px; font-weight: 600; padding: 20px 48px; border-radius: 14px; text-decoration: none; transition: opacity .2s, transform .2s; }
  .book-cta-btn:hover { opacity: .88; transform: translateY(-2px); }
  .book-cta-note { margin-top: 14px; color: #505070; font-size: 14px; }

  /* FOOTER */
  .footer { border-top: 1px solid #0e0e24; padding: 48px 0; background: #04040f; }
  .footer__inner { display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; }
  .footer__links { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
  .footer__links button { background: none; border: none; color: #44446a; font-size: 14px; cursor: pointer; transition: color 0.2s; }
  .footer__links button:hover { color: #888; }
  .footer__copy { font-size: 13px; color: #2a2a4a; margin: 0; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .nav__links { display: none; }
    .nav__links--open { display: flex; flex-direction: column; position: fixed; top: 72px; left: 0; right: 0; background: rgba(7,7,26,0.98); padding: 20px 24px 28px; border-bottom: 1px solid #141430; }
    .nav__burger { display: flex; }
    .services-grid { grid-template-columns: 1fr; }
    .demo-wrap { grid-template-columns: 1fr; gap: 36px; }
    .web-grid { grid-template-columns: 1fr 1fr; }
    .process-steps { flex-direction: column; align-items: center; gap: 12px; }
    .process-steps__arrow { transform: rotate(90deg); margin: -4px 0; }
    .testimonials { grid-template-columns: 1fr; }
    .about-wrap { grid-template-columns: 1fr; gap: 36px; }
    .stats__divider { display: none; }
    .stat { padding: 12px 20px; }
  }
  @media (max-width: 480px) {
    .web-grid { grid-template-columns: 1fr; }
    .niche-picker { gap: 8px; }
    .niche-btn { font-size: 13px; padding: 8px 14px; }
  }
`;
