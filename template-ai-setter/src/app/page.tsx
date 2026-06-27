"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* ── Nisch-data ── */
type NicheKey = "klinik" | "coach" | "artist" | "maklare" | "byra" | "restaurant";

interface NicheData {
  icon: string;
  label: string;
  heroLine: string;
  heroSub: string;
  conversation: { from: "aura" | "lead"; text: string }[];
  features: string[];
  result: string;
  ctaLabel: string;
}

const NICHES: Record<NicheKey, NicheData> = {
  klinik: {
    icon: "🏥",
    label: "Klinik & Hälsa",
    heroLine: "Fyll din bokningskalender — automatiskt",
    heroSub:
      "Aura hanterar patientförfrågningar i Instagram-DMs, kvalificerar och bokar tider direkt. Inga fler missade leads.",
    conversation: [
      { from: "aura", text: "Hej! Söker du hjälp med något specifikt just nu? 😊" },
      { from: "lead", text: "Ja, jag har haft ont i ryggen ett tag och letar efter en naprapat" },
      { from: "aura", text: "Det förstår jag — ryggbesvär kan vara riktigt jobbigt. Vi har lediga tider redan den här veckan. Vill du att jag bokar in ett första besök åt dig?" },
      { from: "lead", text: "Ja gärna, vad kostar det?" },
      { from: "aura", text: "Första besöket kostar 595 kr och tar 45 min. Jag skickar en bokningslänk direkt 👉 [länk]" },
    ],
    features: [
      "Svarar på patientfrågor dygnet runt",
      "Bokar in besök direkt i ditt bokningssystem",
      "Minskar no-shows med automatiska påminnelser",
      "Hanterar återkommande patienter och uppföljningar",
      "Fungerar på svenska, engelska och fler språk",
    ],
    result: "Kliniker ser i snitt 3× fler bokningar inom 60 dagar.",
    ctaLabel: "Boka demo för din klinik →",
  },
  coach: {
    icon: "🏋️",
    label: "Coach & PT",
    heroLine: "Mer tid för klienter — AI:n sköter inboket",
    heroSub:
      "Aura kvalificerar leads, svarar på frågor om dina program och bokar konsultationer — medan du tränar dina befintliga klienter.",
    conversation: [
      { from: "aura", text: "Hej! Såg att du kollade in våra träningsprogram — vad är ditt mål just nu? 💪" },
      { from: "lead", text: "Jag vill gå ner i vikt och komma igång med styrketräning" },
      { from: "aura", text: "Perfekt, det är precis vad vi fokuserar på! Vi brukar se resultat redan inom 8 veckor med rätt program. Vill du boka en gratis 20-min konsultation så vi kan hitta rätt upplägg för dig?" },
      { from: "lead", text: "Det låter bra!" },
      { from: "aura", text: "Toppen! Här är en länk för att välja en tid 👉 [länk]. Ser fram emot att träffas!" },
    ],
    features: [
      "Kvalificerar leads baserat på mål och budget",
      "Bokar gratis konsultationer automatiskt",
      "Presenterar dina program och priser",
      "Följer upp ointresserade leads efter 3–7 dagar",
      "Hanterar frågor om schema, betalning och avbokning",
    ],
    result: "Coacher sparar i snitt 15 timmar per vecka på administration.",
    ctaLabel: "Boka demo för din coaching →",
  },
  artist: {
    icon: "🎤",
    label: "Artist & Event",
    heroLine: "Konvertera fans till betalande kunder — i DMs",
    heroSub:
      "Aura hanterar bokningsförfrågningar, säljer biljetter och event-paket direkt i Instagram-DMs. Aldrig en missad affärsmöjlighet.",
    conversation: [
      { from: "aura", text: "Tack för att du hör av dig! 🎶 Vad kan vi hjälpa dig med?" },
      { from: "lead", text: "Jag undrar om ni är tillgängliga för en bröllopsceremoni i juni" },
      { from: "aura", text: "Vilken fin anledning! Juni är populärt — vi har fortfarande några datum lediga. Kan du berätta mer om din dag? Ungefär hur många gäster och vilket datum tänkte du?" },
      { from: "lead", text: "Ca 80 gäster, 14 juni" },
      { from: "aura", text: "14 juni är faktiskt ledigt! Jag bokar in ett kort samtal med oss så vi kan gå igenom detaljerna och skicka offert. Fungerar det i morgon kl 10? 👉 [länk]" },
    ],
    features: [
      "Hanterar bokningsförfrågningar för event och spelningar",
      "Svarar på prisfrågor och skickar offerter",
      "Säljer merch och biljetter via DMs",
      "Bygger relation med fans automatiskt",
      "Håller varma leads varma tills de bokar",
    ],
    result: "Artister ökar intäkterna från DMs med 4× utan extra jobb.",
    ctaLabel: "Boka demo för ditt artisteri →",
  },
  maklare: {
    icon: "🏠",
    label: "Mäklare & Fastighet",
    heroLine: "Boka fler visningar — utan att lyfta luren",
    heroSub:
      "Aura svarar på fastighetsförfrågningar, kvalificerar spekulanter och bokar visningar direkt i din kalender.",
    conversation: [
      { from: "aura", text: "Hej! Ser att du är intresserad av fastigheter i området — letar du aktivt just nu? 🏠" },
      { from: "lead", text: "Ja vi letar efter villa i Djursholm, budget ca 8 miljoner" },
      { from: "aura", text: "Bra budget för det området! Vi har ett par objekt på gång som matchar exakt det du beskriver. Vill du boka en privat visning den här veckan?" },
      { from: "lead", text: "Ja gärna, helst på lördag" },
      { from: "aura", text: "Lördag fungerar! Välj en tid här så bekräftar vi direkt 👉 [länk]. Jag skickar adress och detaljer så fort det är bokat." },
    ],
    features: [
      "Kvalificerar spekulanter (budget, tidplan, krav)",
      "Bokar visningar direkt i din kalender",
      "Följer upp efter visningar automatiskt",
      "Hanterar både köpare och säljare",
      "Arbetar parallellt med hundratals leads",
    ],
    result: "Mäklare bokar 2× fler visningar utan att öka arbetstiden.",
    ctaLabel: "Boka demo för din mäklarbyrå →",
  },
  byra: {
    icon: "📈",
    label: "Digital byrå",
    heroLine: "Skala din outreach utan att anställa",
    heroSub:
      "Aura hanterar hundratals parallella DM-konversationer, kvalificerar prospekt och bokar säljmöten — helt automatiskt.",
    conversation: [
      { from: "aura", text: "Hej! Ser att ni driver en e-handel — hur går det med er sociala trafik just nu?" },
      { from: "lead", text: "Okej men vi får inte ut så mycket av Instagram som vi borde" },
      { from: "aura", text: "Det är vanligt! De flesta e-handlare vi jobbar med ökar sin Instagram-ROI med 3–5× inom 90 dagar. Vill du höra hur vi gör det? Kan boka ett 20-min möte direkt." },
      { from: "lead", text: "Absolut, vad kostar det?" },
      { from: "aura", text: "Vi börjar alltid med ett gratis strategisamtal — ingen sälj, bara ett möte för att se om vi passar varandra. Här är länken 👉 [länk]" },
    ],
    features: [
      "Hanterar hundratals parallella prospektkonversationer",
      "Kvalificerar leads baserat på bransch och budget",
      "Bokar discovery calls i ditt CRM",
      "Anpassas till din byrås röst och erbjudande",
      "Integreras med GoHighLevel och andra CRM-system",
    ],
    result: "Byråer genererar 5× fler kvalificerade möten per månad.",
    ctaLabel: "Boka demo för din byrå →",
  },
  restaurant: {
    icon: "🍽️",
    label: "Restaurant & Café",
    heroLine: "Fyll dina bord — AI:n tar bordsbokningarna",
    heroSub:
      "Aura hanterar bordsbokningar, svarar på menyfrågor och säljer event-paket direkt i Instagram-DMs.",
    conversation: [
      { from: "aura", text: "Hej! Välkommen 🍽️ Vill du boka bord eller har du en fråga?" },
      { from: "lead", text: "Vi är 8 personer och vill fira en födelsedag nästa lördag" },
      { from: "aura", text: "Vad kul! Vi har ett perfekt fönsterbord för 8 ledigt nästa lördag. Vill du ha en speciell tårta eller dekorationer? Vi ordnar det gärna!" },
      { from: "lead", text: "Ja tårta vore toppen! Kan ni skriva ett namn på den?" },
      { from: "aura", text: "Absolut! Vad ska vi skriva? Jag bekräftar bokningen och noterar dina önskemål direkt 👉 [bokningslänk]" },
    ],
    features: [
      "Tar emot och bekräftar bordsreservationer 24/7",
      "Svarar på frågor om meny, allergi och öppettider",
      "Säljer event-paket och privata middagar",
      "Skickar påminnelser och hanterar avbokningar",
      "Tar emot cateringförfrågningar automatiskt",
    ],
    result: "Restauranger ökar sin beläggning med 30% på 30 dagar.",
    ctaLabel: "Boka demo för din restaurang →",
  },
};

const NICHE_KEYS = Object.keys(NICHES) as NicheKey[];

/* ── Main component ── */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNiche, setActiveNiche] = useState<NicheKey | null>(null);
  const [animating, setAnimating] = useState(false);

  const nicheRef = useRef<HTMLElement>(null);
  const demoRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(ref: React.RefObject<HTMLElement | null>) {
    setMenuOpen(false);
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
  }

  function pickNiche(key: NicheKey) {
    if (key === activeNiche) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveNiche(key);
      setAnimating(false);
      setTimeout(() => demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }, 220);
  }

  const niche = activeNiche ? NICHES[activeNiche] : null;

  return (
    <>
      {/* ── NAV ── */}
      <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
        <div className="nav__inner">
          <div className="nav__logo">
            <Image src="/logo.svg" alt="Rekvo" width={160} height={60} priority />
          </div>
          <nav className={`nav__links ${menuOpen ? "nav__links--open" : ""}`}>
            <button className="nav__link" onClick={() => go(nicheRef)}>Välj bransch</button>
            <button className="nav__link" onClick={() => go(demoRef)}>Demo</button>
            <button className="nav__link" onClick={() => go(processRef)}>Process</button>
            <button className="nav__cta" onClick={() => go(contactRef)}>Boka möte</button>
          </nav>
          <button className="nav__burger" aria-label="Meny" onClick={() => setMenuOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__glow" />
        <div className={`container hero__inner ${animating ? "fade-out" : "fade-in"}`}>
          <span className="badge">
            {niche ? `${niche.icon} Anpassad för ${niche.label}` : "AI-driven försäljning · Byggt för Sverige"}
          </span>
          <h1 className="hero__h1">
            {niche ? (
              niche.heroLine
            ) : (
              <>
                Din AI-säljare som bokar<br />
                <span className="gradient-text">möten dygnet runt</span>
              </>
            )}
          </h1>
          <p className="hero__sub">
            {niche
              ? niche.heroSub
              : "Rekvo levererar en fullt tränad AI-assistent som hanterar Instagram-DMs, kvalificerar leads och bokar möten — helt automatiskt, på svenska, i din röst."}
          </p>
          <div className="hero__btns">
            <button className="btn btn--primary" onClick={() => go(niche ? demoRef : nicheRef)}>
              {niche ? "Se din demo →" : "Välj din bransch →"}
            </button>
            <button className="btn btn--ghost" onClick={() => go(contactRef)}>
              Boka ett gratis samtal
            </button>
          </div>
          <div className="stats">
            <Stat value="24/7" label="Alltid tillgänglig" />
            <div className="stats__divider" />
            <Stat value="&lt;60s" label="Svarstid" />
            <div className="stats__divider" />
            <Stat value="3×" label="Fler bokade möten" />
          </div>
        </div>
      </section>

      {/* ── NISCH-VÄLJARE ── */}
      <section ref={nicheRef} className="section section--dark">
        <div className="container">
          <p className="section__label">Steg 1</p>
          <h2 className="section__h2">Vad är du för typ av företag?</h2>
          <p className="section__sub">
            Välj din bransch — så visar vi hur Aura pratar med just dina kunder
            och vad du kan förvänta dig i resultat.
          </p>
          <div className="niche-picker">
            {NICHE_KEYS.map((key) => {
              const n = NICHES[key];
              return (
                <button
                  key={key}
                  className={`niche-btn ${activeNiche === key ? "niche-btn--active" : ""}`}
                  onClick={() => pickNiche(key)}
                >
                  <span className="niche-btn__icon">{n.icon}</span>
                  <span className="niche-btn__label">{n.label}</span>
                  {activeNiche === key && <span className="niche-btn__check">✓</span>}
                </button>
              );
            })}
          </div>
          {!activeNiche && (
            <p className="niche-hint">↑ Klicka på din bransch för att se en personaliserad demo</p>
          )}
        </div>
      </section>

      {/* ── DEMO (personaliserad) ── */}
      <section ref={demoRef} className="section">
        <div className="container">
          <p className="section__label">Demo</p>
          <h2 className="section__h2">
            {niche ? `Så pratar Aura med dina ${niche.label.toLowerCase()}-kunder` : "Möt Aura — din AI-assistent"}
          </h2>
          <p className="section__sub">
            {niche
              ? `En verklig exempelkonversation för ${niche.label.toLowerCase()}. Ton och innehåll anpassas helt efter din verksamhet.`
              : "Välj en bransch ovan för att se en konversation anpassad för just din verksamhet."}
          </p>

          <div className={`demo-wrap ${animating ? "fade-out" : "fade-in"}`}>
            <div className="demo-phone">
              <div className="demo-phone__bar">
                <div className="demo-phone__avatar">A</div>
                <div>
                  <div className="demo-phone__name">Aura</div>
                  <div className="demo-phone__status">● Online</div>
                </div>
              </div>
              <div className="demo-phone__chat">
                {niche ? (
                  niche.conversation.map((msg, i) => (
                    <ChatBubble key={i} from={msg.from}>{msg.text}</ChatBubble>
                  ))
                ) : (
                  <>
                    <ChatBubble from="aura">Hej! Kul att du hittade oss 😊 Vad är det du jobbar med?</ChatBubble>
                    <div className="demo-empty">
                      <span>← Välj din bransch för att se en riktigt konversation</span>
                    </div>
                  </>
                )}
              </div>
              <div className="demo-phone__footer">
                <span className="demo-phone__note">
                  {niche ? `Anpassat för ${niche.label} — inte ett manus, utan AI som tänker` : "Verklig AI-konversation — anpassas för din bransch"}
                </span>
              </div>
            </div>

            <div className="demo-info">
              {niche ? (
                <>
                  <h3 className="demo-info__h3">Vad Aura gör för {niche.label.toLowerCase()}</h3>
                  <ul className="demo-info__list">
                    {niche.features.map((f, i) => <FeatureItem key={i}>{f}</FeatureItem>)}
                  </ul>
                  <div className="result-box">
                    <span className="result-box__icon">📊</span>
                    <span className="result-box__text">{niche.result}</span>
                  </div>
                  <button className="btn btn--primary" style={{ marginTop: 24 }} onClick={() => go(contactRef)}>
                    {niche.ctaLabel}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="demo-info__h3">Vad Aura gör åt dig</h3>
                  <ul className="demo-info__list">
                    <FeatureItem>Svarar på DMs inom sekunder, dygnet runt</FeatureItem>
                    <FeatureItem>Ställer kvalificerande frågor i din röst</FeatureItem>
                    <FeatureItem>Bokar möten direkt i din kalender</FeatureItem>
                    <FeatureItem>Skickar påminnelser och följer upp automatiskt</FeatureItem>
                    <FeatureItem>Lär sig av varje konversation och förbättras</FeatureItem>
                  </ul>
                  <button className="btn btn--primary" onClick={() => go(nicheRef)}>
                    Välj din bransch för att se mer →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section ref={processRef} className="section section--dark">
        <div className="container">
          <p className="section__label">Process</p>
          <h2 className="section__h2">Igång på 7 dagar</h2>
          <p className="section__sub">
            Inga tekniska förkunskaper krävs. Vi sköter allt — du fokuserar på din verksamhet.
          </p>
          <div className="process-steps">
            <ProcessStep num={1} title="Onboarding-samtal"
              desc="Vi lär oss din röst, ditt erbjudande och dina idealkunder på 60 minuter." />
            <div className="process-steps__arrow">→</div>
            <ProcessStep num={2} title="AI-träning"
              desc="Vi konfigurerar och tränar Aura med dina riktlinjer, svar och säljflöde." />
            <div className="process-steps__arrow">→</div>
            <ProcessStep num={3} title="Live & optimering"
              desc="AI:n går live. Vi följer upp veckovis och justerar tills konverteringen är maxad." />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="container">
          <p className="section__label">Resultat</p>
          <h2 className="section__h2">Det våra kunder säger</h2>
          <div className="testimonials">
            <TestimonialCard
              quote="Vi gick från 3–4 bokningar i veckan till 12–15 utan att anställa fler. Aura sköter allt."
              name="Maria L." role="Klinikägare, Stockholm" icon="🏥" />
            <TestimonialCard
              quote="Mina följare börjar en konversation och avslutar med en bokad konsultation — helt automatiskt."
              name="Johan K." role="Personlig tränare, Göteborg" icon="🏋️" />
            <TestimonialCard
              quote="Rekvo satte upp systemet på en vecka. Nu hanterar AI:n all inbound och jag kan fokusera på jobbet."
              name="Anna S." role="Digital byrå, Malmö" icon="📈" />
          </div>
        </div>
      </section>

      {/* ── BOKA MÖTE ── */}
      <section ref={contactRef} className="section section--cta">
        <div className="container">
          <p className="section__label">Kom igång</p>
          <h2 className="section__h2">
            {niche ? `Boka en demo för din ${niche.label.toLowerCase()}` : "Boka ett gratis 20-minutersmöte"}
          </h2>
          <p className="section__sub">
            {niche
              ? `Vi visar exakt hur Aura kan anpassas för ${niche.label.toLowerCase()} och vad du kan förvänta dig i resultat — inga förpliktelser.`
              : "Vi visar hur Aura fungerar för just din verksamhet — inga förpliktelser, inga tekniska förkunskaper krävs."}
          </p>
          <div className="calendly-wrap">
            <iframe
              src="https://calendly.com/rekvo/demo"
              className="calendly-iframe"
              title="Boka möte med Rekvo"
            />
          </div>
          <p className="calendly-fallback">
            Fungerar inte inbäddningen?{" "}
            <a href="https://calendly.com/rekvo/demo" target="_blank" rel="noopener noreferrer">
              Öppna Calendly direkt →
            </a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container footer__inner">
          <Image src="/logo.svg" alt="Rekvo" width={120} height={45} />
          <div className="footer__links">
            <button onClick={() => go(nicheRef)}>Välj bransch</button>
            <button onClick={() => go(demoRef)}>Demo</button>
            <button onClick={() => go(processRef)}>Process</button>
            <button onClick={() => go(contactRef)}>Kontakt</button>
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
      <div className="stat__value" dangerouslySetInnerHTML={{ __html: value }} />
      <div className="stat__label">{label}</div>
    </div>
  );
}

function ChatBubble({ from, children }: { from: "aura" | "lead"; children: React.ReactNode }) {
  return <div className={`chat-bubble chat-bubble--${from}`}>{children}</div>;
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="feature-item">
      <span className="feature-item__check">✓</span>
      {children}
    </li>
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

/* ── Styles ── */
const css = `
  .container {
    max-width: 1100px; margin: 0 auto; padding: 0 24px;
  }

  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .fade-out { opacity: 0; transform: translateY(8px); transition: opacity 0.2s, transform 0.2s; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  /* NAV */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; transition: background 0.3s, box-shadow 0.3s; }
  .nav--scrolled { background: rgba(7,7,26,0.93); backdrop-filter: blur(14px); box-shadow: 0 1px 0 rgba(255,255,255,0.06); }
  .nav__inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
  .nav__logo { display: flex; align-items: center; }
  .nav__links { display: flex; align-items: center; gap: 4px; }
  .nav__link { background: none; border: none; color: #aaa; font-size: 15px; cursor: pointer; padding: 8px 16px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
  .nav__link:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .nav__cta { background: #4f46e5; border: none; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; padding: 10px 22px; border-radius: 10px; margin-left: 8px; transition: background 0.2s, transform 0.15s; }
  .nav__cta:hover { background: #4338ca; transform: translateY(-1px); }
  .nav__burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
  .nav__burger span { display: block; width: 24px; height: 2px; background: #ccc; border-radius: 2px; }

  /* HERO */
  .hero { min-height: 100vh; display: flex; align-items: center; padding: 140px 0 80px; position: relative; overflow: hidden; }
  .hero__glow { position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 900px; height: 700px; background: radial-gradient(ellipse, rgba(79,70,229,0.25) 0%, transparent 65%); pointer-events: none; }
  .hero__inner { text-align: center; position: relative; width: 100%; }
  .badge { display: inline-block; background: rgba(79,70,229,0.15); border: 1px solid rgba(79,70,229,0.35); color: #a5b4fc; font-size: 13px; font-weight: 500; padding: 7px 18px; border-radius: 100px; margin-bottom: 32px; letter-spacing: 0.3px; transition: all 0.3s; }
  .hero__h1 { font-size: clamp(38px, 6vw, 68px); font-weight: 800; line-height: 1.08; letter-spacing: -2px; color: #fff; margin: 0 0 28px; }
  .gradient-text { background: linear-gradient(135deg, #818cf8 0%, #c084fc 60%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero__sub { font-size: 18px; color: #8080a8; line-height: 1.75; max-width: 580px; margin: 0 auto 44px; }
  .hero__btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  .btn { cursor: pointer; border-radius: 12px; font-size: 16px; font-weight: 600; padding: 14px 30px; border: none; transition: transform 0.15s, background 0.2s; }
  .btn:hover { transform: translateY(-2px); }
  .btn--primary { background: #4f46e5; color: #fff; }
  .btn--primary:hover { background: #4338ca; }
  .btn--ghost { background: transparent; border: 1px solid #2a2a4a; color: #c0c0e0; }
  .btn--ghost:hover { background: rgba(255,255,255,0.04); }

  .stats { display: flex; align-items: center; justify-content: center; gap: 0; margin-top: 60px; flex-wrap: wrap; }
  .stat { text-align: center; padding: 12px 40px; }
  .stat__value { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -1px; }
  .stat__label { font-size: 13px; color: #606080; margin-top: 4px; }
  .stats__divider { width: 1px; height: 48px; background: #1a1a3a; }

  /* SECTIONS */
  .section { padding: 110px 0; }
  .section--dark { background: #050514; }
  .section--cta { background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(79,70,229,0.18) 0%, transparent 70%); }
  .section__label { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 2.5px; color: #6366f1; text-transform: uppercase; margin-bottom: 14px; }
  .section__h2 { text-align: center; font-size: clamp(28px, 4vw, 46px); font-weight: 700; letter-spacing: -1px; color: #fff; margin: 0 auto 18px; max-width: 700px; }
  .section__sub { text-align: center; color: #707090; font-size: 17px; line-height: 1.75; max-width: 560px; margin: 0 auto 60px; }

  /* NICHE PICKER */
  .niche-picker { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 760px; margin: 0 auto; }
  .niche-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 18px 22px; border-radius: 14px;
    background: #0a0a1e; border: 1px solid #141430;
    color: #a0a0c0; font-size: 15px; font-weight: 500;
    cursor: pointer; text-align: left;
    transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.15s;
    position: relative;
  }
  .niche-btn:hover { border-color: #4f46e5; color: #fff; transform: translateY(-2px); }
  .niche-btn--active { border-color: #6366f1; background: rgba(79,70,229,0.12); color: #fff; }
  .niche-btn__icon { font-size: 24px; flex-shrink: 0; }
  .niche-btn__label { flex: 1; }
  .niche-btn__check { color: #6366f1; font-weight: 700; font-size: 16px; }
  .niche-hint { text-align: center; color: #444464; font-size: 14px; margin-top: 28px; }

  /* DEMO */
  .demo-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; max-width: 960px; margin: 0 auto; }
  .demo-phone { background: #0a0a1e; border: 1px solid #1a1a36; border-radius: 20px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.5); }
  .demo-phone__bar { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #131330; background: #070720; }
  .demo-phone__avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #9333ea); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 17px; color: #fff; flex-shrink: 0; }
  .demo-phone__name { font-weight: 600; font-size: 15px; color: #e8e8f8; }
  .demo-phone__status { font-size: 12px; color: #34d399; margin-top: 2px; }
  .demo-phone__chat { padding: 20px 16px; display: flex; flex-direction: column; gap: 10px; min-height: 280px; }
  .demo-empty { display: flex; align-items: center; justify-content: center; flex: 1; color: #333355; font-size: 13px; text-align: center; padding: 20px; margin-top: 16px; }
  .chat-bubble { padding: 11px 15px; border-radius: 16px; max-width: 82%; font-size: 14px; line-height: 1.55; }
  .chat-bubble--aura { align-self: flex-start; background: #16163a; color: #c8c8e8; border-bottom-left-radius: 4px; }
  .chat-bubble--lead { align-self: flex-end; background: #4f46e5; color: #fff; border-bottom-right-radius: 4px; }
  .demo-phone__footer { padding: 12px 20px; border-top: 1px solid #131330; background: #070720; }
  .demo-phone__note { font-size: 12px; color: #444464; }

  .demo-info__h3 { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 22px; }
  .demo-info__list { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 14px; }
  .feature-item { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: #9090b0; line-height: 1.5; }
  .feature-item__check { color: #6366f1; font-weight: 700; flex-shrink: 0; }

  .result-box { display: flex; align-items: flex-start; gap: 12px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); border-radius: 12px; padding: 14px 18px; }
  .result-box__icon { font-size: 20px; flex-shrink: 0; }
  .result-box__text { font-size: 14px; color: #a5b4fc; line-height: 1.55; font-weight: 500; }

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

  /* CALENDLY */
  .calendly-wrap { max-width: 760px; margin: 0 auto; border-radius: 20px; overflow: hidden; border: 1px solid #1a1a3a; background: #fff; }
  .calendly-iframe { width: 100%; height: 660px; border: none; display: block; }
  .calendly-fallback { text-align: center; margin-top: 18px; font-size: 14px; color: #505070; }
  .calendly-fallback a { color: #818cf8; text-decoration: underline; }

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
    .niche-picker { grid-template-columns: 1fr 1fr; }
    .demo-wrap { grid-template-columns: 1fr; gap: 36px; }
    .process-steps { flex-direction: column; align-items: center; gap: 12px; }
    .process-steps__arrow { transform: rotate(90deg); margin: -4px 0; }
    .testimonials { grid-template-columns: 1fr; }
    .stats__divider { display: none; }
    .stat { padding: 12px 20px; }
  }
  @media (max-width: 480px) {
    .niche-picker { grid-template-columns: 1fr; }
    .hero__h1 { letter-spacing: -1px; }
  }
`;
