"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const demoRef = useRef<HTMLElement>(null);
  const nicheRef = useRef<HTMLElement>(null);
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

  return (
    <>
      {/* ── NAV ── */}
      <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
        <div className="nav__inner">
          <div className="nav__logo">
            <Image src="/logo.svg" alt="Svea AI Partners" width={160} height={60} priority />
          </div>

          <nav className={`nav__links ${menuOpen ? "nav__links--open" : ""}`}>
            <button className="nav__link" onClick={() => go(demoRef)}>Demo</button>
            <button className="nav__link" onClick={() => go(nicheRef)}>Nischer</button>
            <button className="nav__link" onClick={() => go(processRef)}>Process</button>
            <button className="nav__cta" onClick={() => go(contactRef)}>Boka möte</button>
          </nav>

          <button
            className="nav__burger"
            aria-label="Meny"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__glow" />
        <div className="container hero__inner">
          <span className="badge">AI-driven försäljning · Byggt för Sverige</span>
          <h1 className="hero__h1">
            Din AI-säljare som bokar<br />
            <span className="gradient-text">möten dygnet runt</span>
          </h1>
          <p className="hero__sub">
            Svea AI Partners levererar en fullt tränad AI-assistent som hanterar
            Instagram-DMs, kvalificerar leads och bokar möten — helt automatiskt,
            på svenska, i din röst.
          </p>
          <div className="hero__btns">
            <button className="btn btn--primary" onClick={() => go(demoRef)}>
              Se Aura i aktion →
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

      {/* ── SOCIAL PROOF ── */}
      <div className="proof-bar">
        <div className="container proof-bar__inner">
          <span className="proof-bar__label">Används av:</span>
          <span className="proof-bar__item">🏥 Kliniker</span>
          <span className="proof-bar__item">🎤 Artister</span>
          <span className="proof-bar__item">🏋️ Coaches</span>
          <span className="proof-bar__item">🏠 Mäklare</span>
          <span className="proof-bar__item">📈 Byråer</span>
        </div>
      </div>

      {/* ── DEMO ── */}
      <section ref={demoRef} className="section section--dark">
        <div className="container">
          <p className="section__label">Demo</p>
          <h2 className="section__h2">Möt Aura — din AI-assistent</h2>
          <p className="section__sub">
            Aura pratar med dina leads precis som du skulle göra — empatisk, tydlig
            och alltid i rätt ton. Se en verklig konversation nedan.
          </p>

          <div className="demo-wrap">
            <div className="demo-phone">
              <div className="demo-phone__bar">
                <div className="demo-phone__avatar">A</div>
                <div>
                  <div className="demo-phone__name">Aura</div>
                  <div className="demo-phone__status">● Online</div>
                </div>
              </div>
              <div className="demo-phone__chat">
                <ChatBubble from="aura">
                  Hej! Jag såg att du följer oss — vad kul! Vad är det du jobbar med just nu? 😊
                </ChatBubble>
                <ChatBubble from="lead">Jag driver en klinik och letar efter fler patienter</ChatBubble>
                <ChatBubble from="aura">
                  Perfekt, det är precis där vi kan hjälpa. Vi har satt upp AI-system för kliniker
                  som ökar bokningarna med 2–3× på 90 dagar. Skulle du ha 20 min för ett snabbt
                  samtal den här veckan?
                </ChatBubble>
                <ChatBubble from="lead">Ja absolut, det låter intressant!</ChatBubble>
                <ChatBubble from="aura">
                  Toppen! Här är en länk för att välja en tid som passar dig 👉 [calendly-länk]
                </ChatBubble>
              </div>
              <div className="demo-phone__footer">
                <span className="demo-phone__note">Verklig AI-konversation — inte ett manus</span>
              </div>
            </div>

            <div className="demo-info">
              <h3 className="demo-info__h3">Vad Aura gör åt dig</h3>
              <ul className="demo-info__list">
                <FeatureItem>Svarar på nya DMs inom sekunder, dygnet runt</FeatureItem>
                <FeatureItem>Ställer kvalificerande frågor i din röst</FeatureItem>
                <FeatureItem>Bokar möten direkt i din kalender</FeatureItem>
                <FeatureItem>Skickar påminnelser och följer upp automatiskt</FeatureItem>
                <FeatureItem>Lär sig av varje konversation och förbättras kontinuerligt</FeatureItem>
              </ul>
              <button className="btn btn--primary" onClick={() => go(contactRef)}>
                Testa din version →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── NISCHER ── */}
      <section ref={nicheRef} className="section">
        <div className="container">
          <p className="section__label">Nischer</p>
          <h2 className="section__h2">Byggd för din bransch</h2>
          <p className="section__sub">
            Vi specialanpassar AI:n för varje kund — röst, tonalitet och säljflöde
            skräddarsys utifrån din verksamhet.
          </p>
          <div className="niche-grid">
            <NicheCard icon="🏥" title="Kliniker & Hälsa"
              desc="Boka patientmöten, filtrera leads och minska no-shows med automatiska påminnelser." />
            <NicheCard icon="🎤" title="Event & Artister"
              desc="Hantera bokningsförfrågningar och konvertera fans till betalande kunder direkt i DMs." />
            <NicheCard icon="🏋️" title="Coaches & PT"
              desc="Kvalificera prospekt och boka konsultationer utan att du behöver lyfta ett finger." />
            <NicheCard icon="🏠" title="Mäklare & Fastighet"
              desc="Svara på visningsförfrågningar, boka möten och håll leads varma automatiskt." />
            <NicheCard icon="📈" title="Digitala byråer"
              desc="Skala outreach utan att anställa — AI:n hanterar hundratals konversationer parallellt." />
            <NicheCard icon="✨" title="Din nisch"
              desc="Annan bransch? Vi bygger anpassade flöden för alla typer av service-businesses." />
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
              name="Maria L."
              role="Klinikägare, Stockholm"
            />
            <TestimonialCard
              quote="Fantastiskt verktyg. Mina följare börjar en konversation och avslutar med en bokad tid — helt automatiskt."
              name="Johan K."
              role="Personlig tränare, Göteborg"
            />
            <TestimonialCard
              quote="Svea AI satte upp systemet på en vecka. Nu hanterar AI:n all inbound och jag kan fokusera på jobbet."
              name="Anna S."
              role="Digital byrå, Malmö"
            />
          </div>
        </div>
      </section>

      {/* ── BOKA MÖTE ── */}
      <section ref={contactRef} className="section section--cta">
        <div className="container">
          <p className="section__label">Kom igång</p>
          <h2 className="section__h2">Boka ett gratis 20-minutersmöte</h2>
          <p className="section__sub">
            Vi visar hur Aura fungerar för just din verksamhet — inga förpliktelser,
            inga tekniska förkunskaper krävs.
          </p>
          <div className="calendly-wrap">
            <iframe
              src="https://calendly.com/svea-ai-partners/demo"
              className="calendly-iframe"
              title="Boka möte med Svea AI Partners"
            />
          </div>
          <p className="calendly-fallback">
            Fungerar inte inbäddningen?{" "}
            <a
              href="https://calendly.com/svea-ai-partners/demo"
              target="_blank"
              rel="noopener noreferrer"
            >
              Öppna Calendly direkt →
            </a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container footer__inner">
          <Image src="/logo.svg" alt="Svea AI Partners" width={120} height={45} />
          <div className="footer__links">
            <button onClick={() => go(demoRef)}>Demo</button>
            <button onClick={() => go(nicheRef)}>Nischer</button>
            <button onClick={() => go(processRef)}>Process</button>
            <button onClick={() => go(contactRef)}>Kontakt</button>
          </div>
          <p className="footer__copy">© {new Date().getFullYear()} Svea AI Partners · Alla rättigheter förbehålls</p>
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

function NicheCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="niche-card">
      <div className="niche-card__icon">{icon}</div>
      <h3 className="niche-card__title">{title}</h3>
      <p className="niche-card__desc">{desc}</p>
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

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="testimonial">
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
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* NAV */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    transition: background 0.3s, box-shadow 0.3s;
  }
  .nav--scrolled {
    background: rgba(7,7,26,0.93);
    backdrop-filter: blur(14px);
    box-shadow: 0 1px 0 rgba(255,255,255,0.06);
  }
  .nav__inner {
    max-width: 1100px; margin: 0 auto; padding: 0 24px;
    height: 72px; display: flex; align-items: center; justify-content: space-between;
  }
  .nav__logo { display: flex; align-items: center; }
  .nav__links { display: flex; align-items: center; gap: 4px; }
  .nav__link {
    background: none; border: none; color: #aaa; font-size: 15px;
    cursor: pointer; padding: 8px 16px; border-radius: 8px;
    transition: color 0.2s, background 0.2s;
  }
  .nav__link:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .nav__cta {
    background: #4f46e5; border: none; color: #fff;
    font-size: 14px; font-weight: 600; cursor: pointer;
    padding: 10px 22px; border-radius: 10px; margin-left: 8px;
    transition: background 0.2s, transform 0.15s;
  }
  .nav__cta:hover { background: #4338ca; transform: translateY(-1px); }
  .nav__burger {
    display: none; flex-direction: column; gap: 5px;
    background: none; border: none; cursor: pointer; padding: 8px;
  }
  .nav__burger span {
    display: block; width: 24px; height: 2px; background: #ccc; border-radius: 2px;
  }

  /* HERO */
  .hero {
    min-height: 100vh;
    display: flex; align-items: center;
    padding: 140px 0 80px;
    position: relative; overflow: hidden;
  }
  .hero__glow {
    position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
    width: 900px; height: 700px;
    background: radial-gradient(ellipse, rgba(79,70,229,0.25) 0%, transparent 65%);
    pointer-events: none;
  }
  .hero__inner { text-align: center; position: relative; }
  .badge {
    display: inline-block;
    background: rgba(79,70,229,0.15);
    border: 1px solid rgba(79,70,229,0.35);
    color: #a5b4fc; font-size: 13px; font-weight: 500;
    padding: 7px 18px; border-radius: 100px; margin-bottom: 32px;
    letter-spacing: 0.3px;
  }
  .hero__h1 {
    font-size: clamp(38px, 6vw, 68px);
    font-weight: 800; line-height: 1.08; letter-spacing: -2px;
    color: #fff; margin: 0 0 28px;
  }
  .gradient-text {
    background: linear-gradient(135deg, #818cf8 0%, #c084fc 60%, #f472b6 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero__sub {
    font-size: 18px; color: #8080a8; line-height: 1.75;
    max-width: 580px; margin: 0 auto 44px;
  }
  .hero__btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

  .btn { cursor: pointer; border-radius: 12px; font-size: 16px; font-weight: 600;
    padding: 14px 30px; border: none; transition: transform 0.15s, opacity 0.2s; }
  .btn:hover { transform: translateY(-2px); }
  .btn--primary { background: #4f46e5; color: #fff; }
  .btn--primary:hover { background: #4338ca; }
  .btn--ghost { background: transparent; border: 1px solid #2a2a4a; color: #c0c0e0; }
  .btn--ghost:hover { background: rgba(255,255,255,0.04); }

  .stats {
    display: flex; align-items: center; justify-content: center;
    gap: 0; margin-top: 60px; flex-wrap: wrap;
  }
  .stat { text-align: center; padding: 12px 40px; }
  .stat__value { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -1px; }
  .stat__label { font-size: 13px; color: #606080; margin-top: 4px; }
  .stats__divider { width: 1px; height: 48px; background: #1a1a3a; }

  /* PROOF BAR */
  .proof-bar {
    border-top: 1px solid #0e0e24; border-bottom: 1px solid #0e0e24;
    background: #050514; padding: 18px 0;
  }
  .proof-bar__inner {
    display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
    justify-content: center;
  }
  .proof-bar__label { font-size: 13px; color: #44446a; font-weight: 500; }
  .proof-bar__item { font-size: 14px; color: #5a5a7a; }

  /* SECTIONS */
  .section { padding: 110px 0; }
  .section--dark { background: #050514; }
  .section--cta {
    background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(79,70,229,0.18) 0%, transparent 70%);
  }
  .section__label {
    text-align: center; font-size: 12px; font-weight: 700;
    letter-spacing: 2.5px; color: #6366f1; text-transform: uppercase; margin-bottom: 14px;
  }
  .section__h2 {
    text-align: center; font-size: clamp(28px, 4vw, 46px);
    font-weight: 700; letter-spacing: -1px; color: #fff;
    margin: 0 auto 18px; max-width: 680px;
  }
  .section__sub {
    text-align: center; color: #707090; font-size: 17px; line-height: 1.75;
    max-width: 560px; margin: 0 auto 60px;
  }

  /* DEMO */
  .demo-wrap {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 60px; align-items: center; max-width: 960px; margin: 0 auto;
  }
  .demo-phone {
    background: #0a0a1e;
    border: 1px solid #1a1a36;
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.5);
  }
  .demo-phone__bar {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px; border-bottom: 1px solid #131330;
    background: #070720;
  }
  .demo-phone__avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, #4f46e5, #9333ea);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 17px; color: #fff; flex-shrink: 0;
  }
  .demo-phone__name { font-weight: 600; font-size: 15px; color: #e8e8f8; }
  .demo-phone__status { font-size: 12px; color: #34d399; margin-top: 2px; }
  .demo-phone__chat {
    padding: 20px 16px; display: flex; flex-direction: column; gap: 10px; min-height: 260px;
  }
  .chat-bubble {
    padding: 11px 15px; border-radius: 16px;
    max-width: 82%; font-size: 14px; line-height: 1.55;
  }
  .chat-bubble--aura {
    align-self: flex-start; background: #16163a; color: #c8c8e8;
    border-bottom-left-radius: 4px;
  }
  .chat-bubble--lead {
    align-self: flex-end; background: #4f46e5; color: #fff;
    border-bottom-right-radius: 4px;
  }
  .demo-phone__footer {
    padding: 12px 20px; border-top: 1px solid #131330;
    background: #070720;
  }
  .demo-phone__note { font-size: 12px; color: #444464; }

  .demo-info { }
  .demo-info__h3 { font-size: 24px; font-weight: 700; color: #fff; margin: 0 0 24px; }
  .demo-info__list { list-style: none; padding: 0; margin: 0 0 36px; display: flex; flex-direction: column; gap: 14px; }
  .feature-item { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: #9090b0; line-height: 1.5; }
  .feature-item__check { color: #6366f1; font-weight: 700; flex-shrink: 0; }

  /* NICHES */
  .niche-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .niche-card {
    background: #0a0a1e; border: 1px solid #141430;
    border-radius: 16px; padding: 28px 24px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .niche-card:hover { border-color: #2a2a6a; transform: translateY(-3px); }
  .niche-card__icon { font-size: 30px; margin-bottom: 14px; }
  .niche-card__title { font-weight: 700; font-size: 16px; color: #fff; margin-bottom: 8px; }
  .niche-card__desc { font-size: 14px; color: #707090; line-height: 1.65; }

  /* PROCESS */
  .process-steps {
    display: flex; align-items: flex-start; gap: 16px;
    max-width: 900px; margin: 0 auto; justify-content: center;
  }
  .process-step {
    flex: 1; max-width: 260px; text-align: center;
  }
  .process-step__num {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(79,70,229,0.15);
    border: 1px solid rgba(79,70,229,0.35);
    color: #818cf8; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 20px; margin: 0 auto 18px;
  }
  .process-step__title { font-weight: 700; font-size: 17px; color: #fff; margin-bottom: 10px; }
  .process-step__desc { font-size: 14px; color: #707090; line-height: 1.65; }
  .process-steps__arrow { font-size: 28px; color: #2a2a5a; margin-top: 14px; flex-shrink: 0; }

  /* TESTIMONIALS */
  .testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .testimonial {
    background: #0a0a1e; border: 1px solid #141430;
    border-radius: 16px; padding: 28px 24px;
  }
  .testimonial__quote { font-size: 15px; color: #9090b0; line-height: 1.7; margin: 0 0 20px; font-style: italic; }
  .testimonial__author { display: flex; flex-direction: column; gap: 2px; font-size: 14px; }
  .testimonial__author strong { color: #d0d0f0; }
  .testimonial__author span { color: #505070; }

  /* CALENDLY */
  .calendly-wrap {
    max-width: 760px; margin: 0 auto;
    border-radius: 20px; overflow: hidden;
    border: 1px solid #1a1a3a;
    background: #fff;
  }
  .calendly-iframe { width: 100%; height: 660px; border: none; display: block; }
  .calendly-fallback { text-align: center; margin-top: 18px; font-size: 14px; color: #505070; }
  .calendly-fallback a { color: #818cf8; text-decoration: underline; }

  /* FOOTER */
  .footer {
    border-top: 1px solid #0e0e24; padding: 48px 0;
    background: #04040f;
  }
  .footer__inner {
    display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;
  }
  .footer__links { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
  .footer__links button {
    background: none; border: none; color: #44446a;
    font-size: 14px; cursor: pointer; transition: color 0.2s;
  }
  .footer__links button:hover { color: #888; }
  .footer__copy { font-size: 13px; color: #2a2a4a; margin: 0; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .nav__links { display: none; }
    .nav__links--open {
      display: flex; flex-direction: column;
      position: fixed; top: 72px; left: 0; right: 0;
      background: rgba(7,7,26,0.98); padding: 20px 24px 28px;
      border-bottom: 1px solid #141430;
    }
    .nav__burger { display: flex; }
    .demo-wrap { grid-template-columns: 1fr; gap: 36px; }
    .niche-grid { grid-template-columns: 1fr 1fr; }
    .process-steps { flex-direction: column; align-items: center; gap: 12px; }
    .process-steps__arrow { transform: rotate(90deg); margin: -4px 0; }
    .testimonials { grid-template-columns: 1fr; }
    .stats__divider { display: none; }
    .stat { padding: 12px 20px; }
  }
  @media (max-width: 500px) {
    .niche-grid { grid-template-columns: 1fr; }
    .hero__h1 { letter-spacing: -1px; }
  }
`;
