"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* ── SVG Icons ── */
function Ico({ name, size = 24, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const paths: Record<string, string> = {
    bolt:     "M13 2L4.5 13H11L10 22L19.5 11H13L13 2Z",
    clock:    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 4v6l4 2-1 2-5-2.5V6h2Z",
    message:  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z",
    calendar: "M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    bell:     "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
    zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8Z",
    star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z",
    check:    "M20 6L9 17l-5-5",
    users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    trending: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
    globe:    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-6.9 4h3.5c.3 1.5.7 2.9 1.4 4.2H4.2A8.1 8.1 0 0 1 5.1 6ZM4.2 14h3.8c-.7 1.3-1.1 2.7-1.4 4.2H5.1A8.1 8.1 0 0 1 4.2 14Zm7.8 6c-1-.1-2.1-1.6-2.8-4h5.6c-.7 2.4-1.8 3.9-2.8 4Zm-3-6h6c.1-.6.2-1.3.2-2s-.1-1.4-.2-2H9c-.1.6-.2 1.3-.2 2s.1 1.4.2 2Zm2.2-10c1 .1 2.1 1.6 2.8 4H9.2c.7-2.4 1.8-3.9 2.8-4Zm3 10c-.3 1.5-.7 2.9-1.4 4.2h3.8a8.1 8.1 0 0 0 .9-4.2h-3.3Zm1.7-6a8.1 8.1 0 0 0-.9-2H15.9c.7 1.3 1.1 2.7 1.4 4.2h3.5a8.1 8.1 0 0 0-.9-2.2Z",
    mobile:   "M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-5 18a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
    speed:    "M13 2L3 14h9l-1 8 10-12h-9l1-8Z",
    shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    edit:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z",
    link:     "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  };
  const d = paths[name] || paths.check;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Types ── */
type NicheKey = "klinik" | "coach" | "artist" | "maklare" | "byra" | "restaurant";
type PlatformKey = "instagram" | "facebook" | "sms" | "whatsapp" | "email";
interface Msg { from: "aura" | "lead"; text: string }
interface NicheData {
  icon: string;
  label: string;
  conversation: Msg[];
  sms: Msg[];
  email: { subject: string; messages: Msg[] };
}

/* ── Platform metadata ── */
const PLATFORMS: Record<PlatformKey, { label: string; accent: string }> = {
  instagram: { label: "Instagram DM", accent: "#E1306C" },
  facebook:  { label: "Messenger",    accent: "#0084FF" },
  sms:       { label: "SMS",          accent: "#34C759" },
  whatsapp:  { label: "WhatsApp",     accent: "#25D366" },
  email:     { label: "Email",        accent: "#6366f1" },
};
const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];

/* ── Niche data ── */
const NICHES: Record<NicheKey, NicheData> = {
  klinik: {
    icon: "🏥", label: "Klinik & Hälsa",
    conversation: [
      { from: "lead", text: "Hej! Jag funderar på botox runt ögonen men har aldrig gjort det förut, lite nervös" },
      { from: "aura", text: "Hej! Det är helt förståeligt att man är lite osäker inför första gången. Ögonpartiet är faktiskt ett av det vanligaste vi jobbar med och resultatet brukar bli väldigt naturligt. Vi börjar alltid med en gratis konsultation så du vet exakt vad som händer innan du bestämmer dig." },
      { from: "lead", text: "Okej, det låter bra. Men vad kostar det om jag väl bestämmer mig?" },
      { from: "aura", text: "Botox kostar från 1 500 kr beroende på område och mängd. Det går vi igenom exakt under konsultationen, utan några dolda avgifter." },
      { from: "lead", text: "Och behöver man boka lång tid i förväg?" },
      { from: "aura", text: "Nej, vi brukar ha tider inom en vecka. Just nu har vi onsdag 14:00 eller torsdag 09:00 ledigt. Vilken passar bäst för dig?" },
      { from: "lead", text: "Onsdag passar jättebra!" },
      { from: "aura", text: "Perfekt! Jag bokar in dig onsdag 14:00. Du får en bekräftelse inom kort med all information du behöver." },
    ],
    sms: [
      { from: "lead", text: "Hej, vad kostar botox hos er?" },
      { from: "aura", text: "Hej! Botox från 1 500 kr, konsultationen är alltid gratis. Vilket område tänker du?" },
      { from: "lead", text: "Runt ögonen. Måste man boka länge i förväg?" },
      { from: "aura", text: "Nej, vi har tider den här veckan. Onsdag 14:00 eller torsdag 09:00, vad passar?" },
      { from: "lead", text: "Onsdag funkar" },
      { from: "aura", text: "Toppen! Bokat onsdag 14:00. Bekräftelse kommer nu." },
    ],
    email: {
      subject: "Fråga om botoxbehandling",
      messages: [
        { from: "lead", text: "Hej,\n\njag är intresserad av botox runt ögonen men har aldrig gjort det förut. Jag undrar vad konsultationen innebär, vad behandlingen kostar och hur lång tid i förväg man behöver boka.\n\nMed vänliga hälsningar" },
        { from: "aura", text: "Hej,\n\ntack för din förfrågan! Konsultationen är kostnadsfri och tar ungefär 20 minuter. Vi går igenom dina önskemål, tittar på området och berättar exakt vad som passar för dig – utan att du behöver bestämma dig på plats.\n\nBotox kostar från 1 500 kr beroende på område och mängd. Vi har tider inom en vecka, just nu är onsdag 14:00 och torsdag 09:00 lediga.\n\nVilken tid passar dig?\n\nMed vänliga hälsningar,\nVår AI-assistent" },
      ],
    },
  },
  coach: {
    icon: "🏋️", label: "Coach & PT",
    conversation: [
      { from: "lead", text: "Hej! Jag har försökt träna på egen hand i ett år men ser inga resultat alls" },
      { from: "aura", text: "Hej! Det är tyvärr väldigt vanligt – utan rätt upplägg är det svårt att se framsteg oavsett hur hårt man kör. Vad är ditt huvudmål, handlar det om viktnedgång, styrka eller välmående?" },
      { from: "lead", text: "Mest att gå ner i vikt och känna mig starkare. Har också dålig kost" },
      { from: "aura", text: "Då behöver du både träning och kostupplägg, och det är precis vad vi erbjuder. Allt anpassas helt efter dig och din vardag – inga generiska program." },
      { from: "lead", text: "Det låter bra men jag har testat PT förut och det funkade inte, blev för dyrt" },
      { from: "aura", text: "Det förstår jag. Därför börjar vi alltid med ett gratis samtal där vi går igenom vad som faktiskt passar din ekonomi och ditt schema. Inget köptvång." },
      { from: "lead", text: "Okej, det kan jag göra. När har ni tid?" },
      { from: "aura", text: "Måndag 07:00 eller onsdag 17:30 passar för ett introduktionssamtal. Vilket funkar bäst för dig?" },
    ],
    sms: [
      { from: "lead", text: "Hej, letar efter PT. Hur mycket kostar det?" },
      { from: "aura", text: "Hej! Paket från 450 kr per pass. Vi börjar alltid med ett gratis samtal. Vad är ditt mål?" },
      { from: "lead", text: "Gå ner i vikt, har försökt själv men det funkar inte" },
      { from: "aura", text: "Förstår! Det är svårt utan rätt upplägg. Måndag 07:00 eller onsdag 17:30 för ett gratis samtal?" },
      { from: "lead", text: "Onsdag passar bättre" },
      { from: "aura", text: "Perfekt, onsdag 17:30 är bokat. Vi ses då!" },
    ],
    email: {
      subject: "Fråga om personlig träning och kostupplägg",
      messages: [
        { from: "lead", text: "Hej,\n\njag har tränat på egen hand ett tag men ser inga resultat. Jag söker en PT som kan hjälpa med både träning och kost. Hur fungerar upplägget och vad kostar det?\n\nMed vänliga hälsningar" },
        { from: "aura", text: "Hej,\n\ntack för din förfrågan! Vi erbjuder personlig träning, kostupplägg och löpande coachning – allt anpassat helt efter dig. Alla nya klienter börjar med ett kostnadsfritt 30-minuterssamtal där vi kartlägger dina mål och ser vad som passar din vardag.\n\nPriser börjar från 450 kr per pass. Vi är tillgängliga måndag till lördag, 06:00–21:00.\n\nVi har måndag 07:00 och onsdag 17:30 ledigt den här veckan. Passar något av dessa?\n\nMed vänliga hälsningar,\nVår AI-assistent" },
      ],
    },
  },
  artist: {
    icon: "🎤", label: "Artist & Event",
    conversation: [
      { from: "lead", text: "Hejsan! Vi ska gifta oss i sommar och letar efter livemusik till bröllopet" },
      { from: "aura", text: "Hej och stort grattis! 🎶 Det låter fantastiskt. Vilket datum har ni valt?" },
      { from: "lead", text: "14 juni. Vi är ungefär 70 till 80 gäster" },
      { from: "aura", text: "14 juni är ledigt! Vi spelar allt från ceremoni till fest och anpassar repertoaren helt efter er stämning och önskemål." },
      { from: "lead", text: "Hur mycket kostar det ungefär? Vi har en ganska tajt budget" },
      { from: "aura", text: "Det beror på hur länge ni vill ha musik och vilken sättning. Vi sätter ihop ett prisförslag anpassat efter er budget efter ett kort samtal, utan förpliktelser." },
      { from: "lead", text: "Okej det verkar vettigt, vi bokar gärna ett samtal" },
      { from: "aura", text: "Toppen! Tisdag 10:00 eller torsdag 13:00 passar för ett samtal. Vilken tid passar er bäst?" },
    ],
    sms: [
      { from: "lead", text: "Hej! Lediga för bröllop 14 juni?" },
      { from: "aura", text: "Hej! Ja, 14 juni är ledigt. Hur många gäster och vilken stil på musiken?" },
      { from: "lead", text: "Ca 80 gäster, vill ha allt från lugnt till fest" },
      { from: "aura", text: "Det fixar vi! Tisdag 10 eller torsdag 13 för ett kort samtal om detaljer?" },
      { from: "lead", text: "Torsdag passar bäst" },
      { from: "aura", text: "Perfekt! Torsdag 13:00 är bokat. Vi ses då." },
    ],
    email: {
      subject: "Förfrågan – livemusik bröllop 14 juni",
      messages: [
        { from: "lead", text: "Hej,\n\nvi planerar bröllop den 14 juni och söker livemusik för ca 70–80 gäster. Vad erbjuder ni, hur fungerar prissättningen och vad innebär ett samarbete?\n\nMed vänliga hälsningar" },
        { from: "aura", text: "Hej och stort grattis till det kommande bröllopet!\n\n14 juni är ledigt. Vi erbjuder allt från ceremonispelning till festmusik och anpassar oss helt efter era önskemål gällande genre, stämning och tid.\n\nEn offert sätts ihop efter ett kort samtal där vi förstår vad ni vill ha – utan förpliktelser. Vi har tisdag 10:00 eller torsdag 13:00 tillgängligt.\n\nPassar något av dessa?\n\nMed vänliga hälsningar,\nVår AI-assistent" },
      ],
    },
  },
  maklare: {
    icon: "🏠", label: "Mäklare & Fastighet",
    conversation: [
      { from: "lead", text: "Hej! Vi har letat hus i nästan ett år nu men inget passar, börjar kännas hopplöst" },
      { from: "aura", text: "Hej! Det förstår jag verkligen, det är en tuff marknad just nu. Vad är viktigast för er – storlek, läge eller pris?" },
      { from: "lead", text: "Vi vill ha minst 5 rum, trädgård och inte för långt från stan. Budget runt 6 miljoner" },
      { from: "aura", text: "Det är ett tydligt önskemål. Vi har faktiskt objekt på gång som inte publicerats ännu och som matchar det ganska väl." },
      { from: "lead", text: "Vi har hört det förut från andra mäklare men inget har hänt" },
      { from: "aura", text: "Det förstår jag att man är skeptisk efter ett år. Boka ett möte så visar vi konkret vilka objekt vi menar – inga tomma löften." },
      { from: "lead", text: "Okej, det kan vi göra. När har ni tid?" },
      { from: "aura", text: "Torsdag 10:00 eller fredag 13:00 passar. Vilken funkar bäst för er?" },
    ],
    sms: [
      { from: "lead", text: "Hej, söker villa 5 rum och trädgård nära stan, budget 6M" },
      { from: "aura", text: "Hej! Vi har objekt på gång som matchar det. Är ni flexibla på läget?" },
      { from: "lead", text: "Ja, max 20 min från centrum" },
      { from: "aura", text: "Perfekt, det stämmer med vad vi har. Torsdag 10 eller fredag 13 för ett möte?" },
      { from: "lead", text: "Fredag passar oss bättre" },
      { from: "aura", text: "Bokat! Fredag 13:00. Bekräftelse skickas nu." },
    ],
    email: {
      subject: "Söker villa – 5 rum, trädgård, nära stan",
      messages: [
        { from: "lead", text: "Hej,\n\nvi letar aktivt efter villa med minst 5 rum och trädgård, gärna inom 20 minuter från centrum. Budget cirka 6 miljoner. Vi har letat länge utan resultat och undrar om ni har något som passar eller kommande objekt.\n\nMed vänliga hälsningar" },
        { from: "aura", text: "Hej,\n\ntack för er förfrågan! Vi förstår frustrationen när jakten drar ut på tiden. Vi har ett par objekt på gång som matchar era önskemål väl – varav ett ännu inte är publicerat.\n\nJag föreslår ett kort möte på ca 30 minuter där vi visar er vad vi har och lyssnar på vad som är viktigast för just er.\n\nVi har torsdag 10:00 och fredag 13:00 ledigt. Fungerar något av dessa?\n\nMed vänliga hälsningar,\nVår AI-assistent" },
      ],
    },
  },
  byra: {
    icon: "📈", label: "Digital byrå",
    conversation: [
      { from: "lead", text: "Hej! Vi lägger pengar på annonser varje månad men känner att vi inte når rätt personer alls" },
      { from: "aura", text: "Hej! Det är tyvärr ett väldigt vanligt problem. Vad säljer ni och till vilken målgrupp?" },
      { from: "lead", text: "Vi säljer redovisningstjänster till småföretag och kör annonser på Meta" },
      { from: "aura", text: "Det är en stark målgrupp om man sätter upp det rätt. Problemet brukar vara att målgruppsinställningarna är för breda eller att budskapet inte träffar rätt. Har ni koll på er kostnad per lead idag?" },
      { from: "lead", text: "Nej egentligen inte, vi ser bara att budgeten försvinner" },
      { from: "aura", text: "Då är det första steget att skapa tydlig spårning så ni ser exakt vad ni får för pengarna. Vi tar hand om det åt er." },
      { from: "lead", text: "Det låter bra men vi har haft dåliga erfarenheter av byråer som lovar mycket" },
      { from: "aura", text: "Det förstår jag. Vi börjar alltid med en gratis genomgång av er nuvarande annonsering, utan köptvång. Ni ser konkret vad vi hittar innan ni bestämmer er." },
      { from: "lead", text: "Okej, det kan vi testa. Hur snabbt kan ni?" },
      { from: "aura", text: "Onsdag 09:00 eller fredag 13:00 är ledigt. Vilken passar er bäst?" },
    ],
    sms: [
      { from: "lead", text: "Hej, vi kör Meta-annonser men får inga kunder" },
      { from: "aura", text: "Hej! Vad säljer ni och vet ni vad en ny kund är värd för er?" },
      { from: "lead", text: "Redovisning till företag, en kund är värd ca 20 000 kr/år" },
      { from: "aura", text: "Då finns det stor potential att optimera. Gratis genomgång av era annonser – onsdag 09 eller fredag 13?" },
      { from: "lead", text: "Fredag passar" },
      { from: "aura", text: "Toppen! Fredag 13:00 bokat. Vi skickar en bekräftelse." },
    ],
    email: {
      subject: "Fråga om betalda annonser och bättre resultat",
      messages: [
        { from: "lead", text: "Hej,\n\nvi är ett redovisningsföretag som investerar i betalda annonser på Meta men ser väldigt lite avkastning. Vi vet inte om problemet är målgruppen, budskapet eller något annat. Vad erbjuder ni och hur skulle ett samarbete se ut?\n\nMed vänliga hälsningar" },
        { from: "aura", text: "Hej,\n\ntack för din förfrågan! Baserat på det du beskriver handlar det troligtvis om en kombination av för bred målgrupp och otydligt budskap – det är de vanligaste orsakerna.\n\nVi hjälper B2B-företag att nå rätt beslutsfattare via betalda annonser och vi mäter alltid kostnad per lead så ni ser exakt vad ni får.\n\nVi börjar med en kostnadsfri genomgång av er nuvarande annonsering – utan köptvång. Vi har onsdag 09:00 och fredag 13:00 ledigt.\n\nPassar något av dessa?\n\nMed vänliga hälsningar,\nVår AI-assistent" },
      ],
    },
  },
  restaurant: {
    icon: "🍽️", label: "Restaurang & Café",
    conversation: [
      { from: "lead", text: "Hej! Vi vill boka bord för 12 personer, vi ska fira ett 40-årsdagsfirande nästa lördag" },
      { from: "aura", text: "Hej, vad roligt! Grattis till jubilaren 🎂 Nästa lördag har vi plats för 12. Har ni några önskemål kring maten eller stämningen?" },
      { from: "lead", text: "Ja gärna! Kan man beställa tårta hos er?" },
      { from: "aura", text: "Absolut, det ordnar vi. Vi kan också lägga en blomma eller ett välkomstglas på bordet om ni vill, säg bara till." },
      { from: "lead", text: "Åh vad trevligt! Hur dags på kvällen rekommenderar ni?" },
      { from: "aura", text: "För en grupp på 12 brukar 18:00 fungera bäst – då hinner ni ta det lugnt utan att känna er stressade." },
      { from: "lead", text: "Det passar perfekt. Vilket namn ska bokningen stå på?" },
      { from: "lead", text: "Anna Lindström" },
      { from: "aura", text: "Perfekt! Bokning för Anna Lindström, 12 personer lördag 18:00 med tårta. Bekräftelse skickas direkt till dig." },
    ],
    sms: [
      { from: "lead", text: "Hej, kan man boka bord för 12 pers nästa lördag?" },
      { from: "aura", text: "Hej! Ja, vi har plats. Vilket tillfälle är det?" },
      { from: "lead", text: "40-årsdag, vi vill ha tårta också" },
      { from: "aura", text: "Det fixar vi! Vilket klockslag passar och vilket namn på bokningen?" },
      { from: "lead", text: "18:00, Anna Lindström" },
      { from: "aura", text: "Bokat! Anna Lindström, 12 pers lördag 18:00 med tårta. Bekräftelse kommer nu." },
    ],
    email: {
      subject: "Bordsbokning – 12 personer, 40-årsdagsfirande",
      messages: [
        { from: "lead", text: "Hej,\n\nvi vill boka bord för 12 personer nästa lördag för att fira ett 40-årsdagsfirande. Är det möjligt och erbjuder ni något extra som tårta eller dekorationer? Vilka tider är ni öppna?\n\nMed vänliga hälsningar" },
        { from: "aura", text: "Hej och grattis till jubilaren!\n\nVi har plats för 12 nästa lördag. Vi är öppna från 17:00 och erbjuder tårta, välkomstglas och blomdekorationer mot tillägg – säg bara vad ni önskar.\n\nFör en grupp på 12 brukar 18:00 fungera bäst för en lugn och trevlig kväll.\n\nVilket namn ska bokningen stå på och passar 18:00?\n\nMed vänliga hälsningar,\nVår AI-assistent" },
      ],
    },
  },
};

const NICHE_KEYS = Object.keys(NICHES) as NicheKey[];

/* ── Animated chat (Instagram / Messenger / SMS / WhatsApp) ── */
function AnimatedChat({ messages, nicheLabel }: { messages: Msg[]; nicheLabel: string }) {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setVisible(0);
    setTyping(false);
    let cancelled = false;
    async function run() {
      for (let i = 0; i < messages.length; i++) {
        if (cancelled) return;
        if (messages[i].from === "aura") {
          setTyping(true);
          await new Promise(r => setTimeout(r, 1000));
          if (cancelled) return;
          setTyping(false);
        }
        setVisible(i + 1);
        await new Promise(r => setTimeout(r, 650));
      }
    }
    run();
    return () => { cancelled = true; };
  }, [messages]);

  const visibleMsgs = messages.slice(0, visible);

  return (
    <div className="plat-chat">
      {visibleMsgs.map((m, i) => {
        const isAura = m.from === "aura";
        const prev = visibleMsgs[i - 1];
        const showLabel = !prev || prev.from !== m.from;
        return (
          <div key={i} className={`plat-row plat-row--${isAura ? "recv" : "sent"}`}>
            {showLabel && (
              <div className={`plat-label ${isAura ? "plat-label--recv" : "plat-label--sent"}`}>
                {isAura ? "Rekvo AI" : "Kund"}
              </div>
            )}
            <div className={`plat-bubble plat-bubble--${isAura ? "recv" : "sent"}`}>{m.text}</div>
          </div>
        );
      })}
      {typing && (
        <div className="plat-row plat-row--recv">
          <div className="plat-bubble plat-bubble--recv plat-typing">
            <span /><span /><span />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Email thread ── */
function EmailThread({ data }: { data: { subject: string; messages: Msg[] } }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    setVisible(0);
    let cancelled = false;
    async function run() {
      await new Promise(r => setTimeout(r, 400));
      if (cancelled) return;
      setVisible(1);
      await new Promise(r => setTimeout(r, 1800));
      if (cancelled) return;
      setVisible(2);
    }
    run();
    return () => { cancelled = true; };
  }, [data]);

  return (
    <div className="email-thread">
      <div className="email-meta">
        <div className="email-meta__row"><span>Från</span><span>{data.messages[0]?.from === "lead" ? "kund@example.com" : "info@dittföretag.se"}</span></div>
        <div className="email-meta__row"><span>Till</span><span>info@dittföretag.se</span></div>
        <div className="email-meta__row email-meta__subject"><span>Ämne</span><strong>{data.subject}</strong></div>
      </div>
      {data.messages.slice(0, visible).map((m, i) => (
        <div key={i} className={`email-msg email-msg--${m.from === "aura" ? "reply" : "original"}`} style={{ animation: "fadeUp 0.4s ease" }}>
          {i > 0 && <div className="email-reply-tag">Svar ↩</div>}
          <div className="email-body">
            {m.text.split("\n").map((line, j) => <p key={j}>{line || " "}</p>)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Platform header ── */
function PlatformHeader({ platform, label }: { platform: PlatformKey; label: string }) {
  const initial = label[0];
  if (platform === "instagram") return (
    <div className="plat-header ph--ig">
      <span className="ph__back">‹</span>
      <span className="ph__avatar ph__avatar--ig">{initial}</span>
      <span className="ph__info"><span className="ph__name">{label}</span><span className="ph__sub">Aktiv nu</span></span>
      <span className="ph__actions">📹 ℹ️</span>
    </div>
  );
  if (platform === "facebook") return (
    <div className="plat-header ph--fb">
      <span className="ph__back" style={{ color: "#0084FF" }}>‹</span>
      <span className="ph__avatar ph__avatar--fb">{initial}</span>
      <span className="ph__info"><span className="ph__name">{label}</span><span className="ph__sub">Aktiv nu · Messenger</span></span>
      <span className="ph__actions">📹 📞</span>
    </div>
  );
  if (platform === "sms") return (
    <div className="plat-header ph--sms">
      <span className="ph__back">‹</span>
      <span className="ph__avatar ph__avatar--sms">{initial}</span>
      <span className="ph__info"><span className="ph__name">{label}</span><span className="ph__sub">Textmeddelande</span></span>
    </div>
  );
  if (platform === "whatsapp") return (
    <div className="plat-header ph--wa">
      <span className="ph__back">‹</span>
      <span className="ph__avatar ph__avatar--wa">{initial}</span>
      <span className="ph__info"><span className="ph__name">{label}</span><span className="ph__sub">Online</span></span>
      <span className="ph__actions">🔍 📹</span>
    </div>
  );
  return null;
}

/* ── Platform input bar ── */
function PlatformInput({ platform }: { platform: PlatformKey }) {
  const placeholders: Record<PlatformKey, string> = {
    instagram: "Skriv ett meddelande...",
    facebook: "Aa",
    sms: "Textmeddelande",
    whatsapp: "Skriv ett meddelande",
    email: "",
  };
  if (platform === "email") return null;
  return (
    <div className={`plat-input pi--${platform}`}>
      <span className="pi__icon">{platform === "facebook" ? "＋" : "📎"}</span>
      <span className="pi__field">{placeholders[platform]}</span>
      <span className="pi__icon">{platform === "sms" ? "🔊" : "🎤"}</span>
    </div>
  );
}

/* ── Platform demo shell ── */
function PlatformDemo({ platform, niche }: { platform: PlatformKey; niche: NicheKey }) {
  const nd = NICHES[niche];
  const msgs = platform === "sms" ? nd.sms : nd.conversation;

  if (platform === "email") return (
    <div className="plat-shell plat--email">
      <div className="plat-header ph--email">
        <span style={{ fontSize: 20 }}>✉️</span>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#202124" }}>E-post</span>
      </div>
      <EmailThread key={`${niche}-email`} data={nd.email} />
    </div>
  );

  return (
    <div className={`plat-shell plat--${platform}`}>
      <PlatformHeader platform={platform} label={nd.label} />
      <AnimatedChat key={`${platform}-${niche}`} messages={msgs} nicheLabel={nd.label} />
      <PlatformInput platform={platform} />
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

  /* Scroll reveal */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("reveal--in"); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
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
            <Image src="/logo.svg" alt="Rekvo" width={180} height={66} priority />
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
            Vi hjälper dig att få fler kunder, med ett smart system som svarar och bokar åt dig, och en hemsida som faktiskt fungerar.
          </p>
          <div className="hero__btns">
            <button className="btn btn--primary" onClick={() => go(bokRef)}>
              Testa gratis i 7 dagar →
            </button>
            <button className="btn btn--ghost" onClick={() => go(tjänsterRef)}>
              Se vad vi gör
            </button>
          </div>
          <div className="stats">
            <Stat value="Gratis i 7 dagar" label="Testa utan risk" />
            <div className="stats__divider" />
            <Stat value="Ingen bindning" label="Avsluta när du vill" />
            <div className="stats__divider" />
            <Stat value="Klar på 7 dagar" label="Vi sköter allt" />
          </div>
          {/* Floating notification cards */}
          <div className="hero-floats" aria-hidden>
            <div className="hf-card hf-card--1">
              <div className="hf-card__icon"><Ico name="calendar" size={18} color="#2563eb" /></div>
              <div><div className="hf-card__title">Möte bokat automatiskt</div><div className="hf-card__sub">Klinik · 14:00 onsdag</div></div>
            </div>
            <div className="hf-card hf-card--2">
              <div className="hf-card__icon"><Ico name="message" size={18} color="#34d399" /></div>
              <div><div className="hf-card__title">Nytt meddelande besvaras</div><div className="hf-card__sub">Instagram DM · 03:42</div></div>
            </div>
            <div className="hf-card hf-card--3">
              <div className="hf-card__icon"><Ico name="trending" size={18} color="#f472b6" /></div>
              <div><div className="hf-card__title">+3 nya leads i veckan</div><div className="hf-card__sub">Följde upp automatiskt</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* SMÄRTA */}
      <section className="section section--pain">
        <div className="container">
          <p className="section__label">Känner du igen dig?</p>
          <h2 className="section__h2">Du är duktig på det du gör.<br />Men försäljningen tar all din tid.</h2>
          <div className="pain-grid">
            <div className="pain-card reveal"><p>Du svarar på samma frågor om och om igen i meddelanden, men hinner aldrig följa upp</p></div>
            <div className="pain-card reveal"><p>Leads faller bort för att du inte har tid att svara snabbt nog, de går vidare till konkurrenten</p></div>
            <div className="pain-card reveal"><p>Du jobbar kvällar och helger för att hänga med, men kalen&shy;dern fylls ändå inte</p></div>
            <div className="pain-card reveal"><p>Du betalar för annonser men ingen hanterar de leads som faktiskt hör av sig</p></div>
          </div>
          <p className="pain-solution">Rekvo löser det här, utan att du behöver anställa eller lära dig ny teknik.</p>
        </div>
      </section>

      {/* TJÄNSTER */}
      <section ref={tjänsterRef} className="section section--dark">
        <div className="container">
          <p className="section__label">Vad vi gör</p>
          <h2 className="section__h2">Två tjänster, ett mål, din tillväxt</h2>
          <p className="section__sub">Vi kombinerar smarta säljverktyg och webbdesign för att ge ditt företag en digital närvaro som faktiskt säljer.</p>
          <div className="services-grid">
            <div className="service-card reveal" onClick={() => go(aiRef)}>
              <h3 className="service-card__title">AI-säljare</h3>
              <p className="service-card__desc">Ett system som svarar på meddelanden, sorterar ut seriösa kunder och bokar möten åt dig, dygnet runt. Helt anpassat till hur du pratar och vad du säljer.</p>
              <span className="service-card__link">Läs mer →</span>
            </div>
            <div className="service-card reveal" onClick={() => go(webRef)}>
              <h3 className="service-card__title">Hemsidor</h3>
              <p className="service-card__desc">Moderna, snabba hemsidor som syns på Google och förvandlar besökare till kunder. Designade från grunden utifrån ditt företag.</p>
              <span className="service-card__link">Läs mer →</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI-SÄLJARE */}
      <section ref={aiRef} className="section">
        <div className="container">
          <p className="section__label">AI-säljare</p>
          <h2 className="section__h2">Se hur det ser ut på riktigt</h2>
          <p className="section__sub">Välj en plattform och en bransch för att se exakt hur systemet pratar med dina kunder.</p>

          {/* Niche picker */}
          <div className="niche-picker">
            {NICHE_KEYS.map(key => (
              <button
                key={key}
                className={`niche-btn ${activeNiche === key ? "niche-btn--active" : ""}`}
                onClick={() => setActiveNiche(key)}
              >
                <span className="niche-btn__label">{NICHES[key].label}</span>
              </button>
            ))}
          </div>

          {/* Demo */}
          <div className="demo-wrap">
            <div className="phone-frame">
              <div className="phone-frame__notch"><div className="phone-frame__speaker" /></div>
              <PlatformDemo platform="instagram" niche={activeNiche} />
              <div className="phone-frame__home" />
            </div>
            <div className="demo-info">
              <h3 className="demo-info__h3">Som att anställa någon som aldrig slutar jobba</h3>
              <p className="demo-info__intro">Helt anpassad efter ditt företag, svarar i din ton och hanterar kontakten med kunder från första meddelande till bokat möte.</p>
              <ul className="demo-info__list">
                <FeatureItem>Svarar direkt, oavsett om det är mitt på dagen eller 3 på natten</FeatureItem>
                <FeatureItem>Svarar på vanliga frågor om ditt företag, priser och tider</FeatureItem>
                <FeatureItem>Följer upp kunder som inte svarat, precis som du skulle göra</FeatureItem>
                <FeatureItem>Påminner kunder om bokade möten så ingen glömmer</FeatureItem>
                <FeatureItem>Bokar in möten direkt i din kalender utan att du behöver göra något</FeatureItem>
                <FeatureItem>Anpassad till hur du pratar och vad just ditt företag säljer</FeatureItem>
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
          <p className="section__sub">Vi designar och bygger moderna hemsidor som laddar snabbt, syns när folk söker på Google och faktiskt förvandlar besökare till kunder.</p>
          <div className="web-grid">
            <WebFeature icon="speed" title="Blixtsnabb" desc="Laddar på under en sekund. Besökare stannar kvar och Google gillar det." />
            <WebFeature icon="mobile" title="Mobilanpassad" desc="Ser perfekt ut på alla skärmar, oavsett om man använder mobil eller dator." />
            <WebFeature icon="globe" title="Syns på Google" desc="Din sida dyker upp när folk söker efter det du erbjuder, från dag ett." />
            <WebFeature icon="edit" title="Skräddarsydd design" desc="Ingen mall. Varje sida designas från grunden utifrån ditt företag." />
            <WebFeature icon="link" title="Kopplas till dina verktyg" desc="Fungerar med din kalender, ditt bokningssystem och betalningar." />
            <WebFeature icon="bolt" title="Klar på 7 dagar" desc="Från första möte till en färdig sida på en vecka." />
          </div>
          <div className="web-case">
            <div className="web-case__label">Case, rekvo.se</div>
            <p className="web-case__text">Den här sidan är ett exempel på vad vi bygger. Designad, kodad och driftsatt av Rekvo på 7 dagar.</p>
            <button className="btn btn--ghost" onClick={() => go(bokRef)}>Få en hemsida som denna →</button>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section ref={processRef} className="section">
        <div className="container">
          <p className="section__label">Process</p>
          <h2 className="section__h2">Klart på 7 dagar. Inte 7 månader.</h2>
          <p className="section__sub">Inga långa projekt. Vi rör oss snabbt och levererar resultat.</p>
          <div className="process-steps">
            <ProcessStep num={1} title="Vi lär känna dig" desc="Vi lär oss ditt företag, dina mål och dina kunder på ett kort möte." />
            <div className="process-steps__arrow">→</div>
            <ProcessStep num={2} title="Vi bygger allt" desc="Vi sköter allt arbete. Du behöver inte göra något eller kunna något." />
            <div className="process-steps__arrow">→</div>
            <ProcessStep num={3} title="Du kör igång" desc="Vi levererar och följer upp. Du ser resultat från dag ett." />
          </div>
        </div>
      </section>

      {/* FÖRDELAR */}
      <section className="section section--dark">
        <div className="container">
          <p className="section__label">Varför Rekvo</p>
          <h2 className="section__h2">Tre saker vi gör annorlunda</h2>
          <div className="benefits-grid">
            <div className="benefit-card reveal">
              <div className="benefit-card__icon"><Ico name="clock" size={28} color="#2563eb" /></div>
              <h3 className="benefit-card__title">Alltid tillgänglig</h3>
              <p className="benefit-card__desc">Systemet svarar på varje meddelande direkt, dygnet runt, utan pauser. Inga leads tappas bort för att du sover eller är upptagen.</p>
            </div>
            <div className="benefit-card reveal">
              <div className="benefit-card__icon"><Ico name="star" size={28} color="#2563eb" /></div>
              <h3 className="benefit-card__title">Helt skräddarsytt</h3>
              <p className="benefit-card__desc">Varje system byggs från grunden efter ditt företag, dina erbjudanden och hur du pratar med dina kunder.</p>
            </div>
            <div className="benefit-card reveal">
              <div className="benefit-card__icon"><Ico name="zap" size={28} color="#2563eb" /></div>
              <h3 className="benefit-card__title">Igång på 7 dagar</h3>
              <p className="benefit-card__desc">Du behöver inte vänta månader eller lära dig någon teknik. Vi sköter allt, och du ser resultat från dag ett.</p>
            </div>
          </div>
        </div>
      </section>

      {/* OM REKVO */}
      <section ref={omRef} className="section">
        <div className="container">
          <p className="section__label">Om oss</p>
          <div style={{ marginBottom: 24 }}><Image src="/logo.svg" alt="Rekvo" width={160} height={60} /></div>
          <div className="about-wrap">
            <div className="about-text">
              <p>Vi hjälper företag att sluta tappa kunder till dålig digital närvaro.</p>
              <p>De flesta förlorar leads på två ställen. Långsamma svar på meddelanden, och hemsidor som inte konverterar. Vi löser båda.</p>
              <p><strong>AI-säljare.</strong> Ett system som svarar på varje meddelande, på alla plattformar, dygnet runt. Instagram, Facebook, SMS. Det är helt anpassat efter ditt företag, pratar som en människa och sorterar ut seriösa kunder och bokar möten, medan du gör annat.</p>
              <p><strong>Hemsidor.</strong> Snabba, moderna hemsidor. Inte bara snygga, byggda för att synas på Google och faktiskt konvertera besökare till kunder.</p>
              <p>Du behöver inte kunna teknik. Vi bygger, driftsätter och sköter allt. Du loggar in, ser resultatet, och kör ditt företag.</p>
              <button className="btn btn--primary" style={{ marginTop: 24 }} onClick={() => go(bokRef)}>Kom i kontakt →</button>
            </div>
            <div className="about-values">
              <ValueCard icon="bolt" title="Snabbhet" desc="Vi levererar på dagar, inte månader." />
              <ValueCard icon="trending" title="Resultat" desc="Vi följer upp och justerar tills det fungerar." />
              <ValueCard icon="shield" title="Enkelhet" desc="Vi sköter allt, du fokuserar på ditt företag." />
            </div>
          </div>
        </div>
      </section>

      {/* BOKA MÖTE */}
      <section ref={bokRef} className="section section--cta">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Image src="/logo.svg" alt="Rekvo" width={160} height={60} /></div>
          <p className="section__label">Kom igång</p>
          <h2 className="section__h2">Boka ett gratis 30-minutersmöte</h2>
          <p className="section__sub">Vi går igenom ditt företag och visar konkret vad som är möjligt. Gratis, utan bindning och utan krav på förkunskaper.</p>
          <div className="book-cta-wrap">
            <a href="https://calendar.app.google/UDJT2g5qk4x4TTHx8" target="_blank" rel="noopener noreferrer" className="book-cta-btn">
              Välj en tid som passar dig →
            </a>
            <p className="book-cta-note">Öppnas i Google Kalender · Gratis · 30 min</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer__inner">
          <Image src="/logo.svg" alt="Rekvo" width={160} height={60} />
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
  return <div className="stat"><div className="stat__value">{value}</div><div className="stat__label">{label}</div></div>;
}
function FeatureItem({ children }: { children: React.ReactNode }) {
  return <li className="feature-item"><span className="feature-item__check">✓</span>{children}</li>;
}
function WebFeature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="web-feature reveal">
      <div className="web-feature__icon"><Ico name={icon} size={26} color="#2563eb" /></div>
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
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item reveal ${open ? "faq-item--open" : ""}`}>
      <button className="faq-item__q" onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        <span className="faq-item__arrow">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="faq-item__a">{a}</div>}
    </div>
  );
}
function ValueCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="value-card reveal">
      <span className="value-card__icon"><Ico name={icon} size={22} color="#2563eb" /></span>
      <div><div className="value-card__title">{title}</div><div className="value-card__desc">{desc}</div></div>
    </div>
  );
}

/* ── CSS ── */
const css = `
  * { box-sizing: border-box; }
  body { background: #0f1623; color: #e2e8f0; }
  .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes typingPulse { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

  /* NAV */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; transition: background 0.3s, box-shadow 0.3s; }
  .nav--scrolled { background: rgba(15,22,35,0.95); backdrop-filter: blur(14px); box-shadow: 0 1px 0 rgba(255,255,255,0.06); }
  .nav__inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
  .nav__logo { display: flex; align-items: center; }
  .nav__links { display: flex; align-items: center; gap: 4px; }
  .nav__link { background: none; border: none; color: #94a3b8; font-size: 15px; cursor: pointer; padding: 8px 14px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
  .nav__link:hover { color: #f1f5f9; background: rgba(255,255,255,0.06); }
  .nav__cta { background: #3b82f6; border: none; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; padding: 10px 22px; border-radius: 10px; margin-left: 8px; transition: background 0.2s, transform 0.15s; }
  .nav__cta:hover { background: #2563eb; transform: translateY(-1px); }
  .nav__burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
  .nav__burger span { display: block; width: 24px; height: 2px; background: #94a3b8; border-radius: 2px; }

  /* HERO */
  .hero { min-height: 100vh; display: flex; align-items: center; padding: 140px 0 80px; position: relative; overflow: hidden; background: #0f1623; }
  .hero__glow { position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 900px; height: 700px; background: radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 65%); pointer-events: none; }
  .hero__inner { text-align: center; position: relative; width: 100%; }
  .hero__logo-stamp { margin-bottom: 20px; opacity: 0.85; }
  .badge { display: inline-block; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); color: #93c5fd; font-size: 13px; font-weight: 500; padding: 7px 18px; border-radius: 100px; margin-bottom: 32px; }
  .hero__h1 { font-size: clamp(38px, 6vw, 68px); font-weight: 800; line-height: 1.08; letter-spacing: -2px; color: #f1f5f9; margin: 0 0 28px; }
  .gradient-text { background: linear-gradient(135deg, #60a5fa 0%, #818cf8 60%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero__sub { font-size: 18px; color: #94a3b8; line-height: 1.75; max-width: 560px; margin: 0 auto 44px; }
  .hero__btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .btn { cursor: pointer; border-radius: 12px; font-size: 16px; font-weight: 600; padding: 14px 30px; border: none; transition: transform 0.15s, background 0.2s, box-shadow 0.2s; }
  .btn:hover { transform: translateY(-2px); }
  .btn--primary { background: #3b82f6; color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
  .btn--primary:hover { background: #2563eb; box-shadow: 0 6px 20px rgba(59,130,246,0.45); }
  .btn--ghost { background: transparent; border: 1px solid #1e2d45; color: #94a3b8; }
  .btn--ghost:hover { background: rgba(255,255,255,0.04); color: #e2e8f0; }
  .stats { display: flex; align-items: center; justify-content: center; margin-top: 60px; flex-wrap: wrap; background: #162032; border: 1px solid #1e2d45; border-radius: 20px; padding: 8px 0; max-width: 640px; margin-left: auto; margin-right: auto; }
  .stat { text-align: center; padding: 12px 40px; }
  .stat__value { font-size: clamp(16px, 2.2vw, 22px); font-weight: 800; color: #f1f5f9; letter-spacing: -0.5px; }
  .stat__label { font-size: 12px; color: #64748b; margin-top: 4px; }
  .stats__divider { width: 1px; height: 40px; background: #1e2d45; }

  /* SECTIONS */
  .section { padding: 110px 0; background: #0f1623; }
  .section--dark { background: #111b2e; }
  .section--pain { background: #111b2e; }
  .section--cta { background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(59,130,246,0.12) 0%, transparent 70%); }
  .section__label { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 2.5px; color: #60a5fa; text-transform: uppercase; margin-bottom: 14px; }
  .section__h2 { text-align: center; font-size: clamp(28px, 4vw, 46px); font-weight: 700; letter-spacing: -1px; color: #f1f5f9; margin: 0 auto 18px; max-width: 680px; }
  .section__h3 { text-align: left; font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 0 0 18px; }
  .section__sub { text-align: center; color: #64748b; font-size: 17px; line-height: 1.75; max-width: 560px; margin: 0 auto 48px; }

  /* TJÄNSTER */
  .services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 800px; margin: 0 auto; }
  .service-card { background: #162032; border: 1px solid #1e2d45; border-radius: 20px; padding: 36px 32px; cursor: pointer; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
  .service-card:hover { border-color: #3b82f6; transform: translateY(-4px); box-shadow: 0 12px 40px rgba(59,130,246,0.12); }
  .service-card__title { font-size: 22px; font-weight: 700; color: #f1f5f9; margin-bottom: 12px; }
  .service-card__desc { font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 20px; }
  .service-card__link { color: #60a5fa; font-size: 14px; font-weight: 600; }

  /* PLATFORM PICKER */
  .platform-picker { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
  .platform-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; background: #162032; border: 1px solid #1e2d45; color: #64748b; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .platform-btn:hover { border-color: #3b82f6; color: #e2e8f0; }
  .platform-btn__label { white-space: nowrap; }

  /* Platform icon dots */
  .picon { width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; display: inline-block; }
  .picon--instagram { background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 7px; }
  .picon--facebook { background: #0084FF; border-radius: 50%; }
  .picon--sms { background: #34C759; border-radius: 6px; }
  .picon--whatsapp { background: #25D366; border-radius: 50%; }
  .picon--email { background: #3b82f6; border-radius: 6px; }

  .platform-btn--active[data-p="instagram"] { border-color: #E1306C; background: rgba(225,48,108,0.1); color: #E1306C; }
  .platform-btn--active[data-p="facebook"]  { border-color: #0084FF; background: rgba(0,132,255,0.1); color: #0084FF; }
  .platform-btn--active[data-p="sms"]       { border-color: #34C759; background: rgba(52,199,89,0.1); color: #34C759; }
  .platform-btn--active[data-p="whatsapp"]  { border-color: #25D366; background: rgba(37,211,102,0.1); color: #25D366; }
  .platform-btn--active[data-p="email"]     { border-color: #3b82f6; background: rgba(59,130,246,0.1); color: #93c5fd; }

  /* NICHE PICKER */
  .niche-picker { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 40px; }
  .niche-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 100px; background: #162032; border: 1px solid #1e2d45; color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .niche-btn:hover { border-color: #3b82f6; color: #e2e8f0; }
  .niche-btn--active { border-color: #3b82f6; background: rgba(59,130,246,0.12); color: #93c5fd; font-weight: 600; }

  /* DEMO LAYOUT */
  .demo-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; max-width: 960px; margin: 0 auto; }

  /* PLATFORM SHELL */
  .plat-shell { border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); width: 100%; max-width: 340px; margin: 0 auto; height: 480px; display: flex; flex-direction: column; }
  .plat--instagram { background: #000; }
  .plat--facebook  { background: #fff; }
  .plat--sms       { background: #f2f2f7; }
  .plat--whatsapp  { background: #0B141A; }
  .plat--email     { background: #fff; }

  /* CSS vars for bubble colours */
  .plat--instagram { --sb:#3797F0; --sc:#fff; --rb:#262626; --rc:#fff; }
  .plat--facebook  { --sb:#0084FF; --sc:#fff; --rb:#f0f0f0; --rc:#1c1e21; }
  .plat--sms       { --sb:#34C759; --sc:#fff; --rb:#e5e5ea; --rc:#000; }
  .plat--whatsapp  { --sb:#005C4B; --sc:#e9edef; --rb:#1E2B33; --rc:#e9edef; }

  /* Chat area */
  .plat-chat { padding: 14px 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto; }
  .plat-row { display: flex; flex-direction: column; margin-bottom: 6px; }
  .plat-row--recv { align-items: flex-start; }
  .plat-row--sent { align-items: flex-end; }
  .plat-label { font-size: 11px; font-weight: 600; opacity: 0.5; margin-bottom: 4px; letter-spacing: 0.2px; }
  .plat-label--recv { color: var(--rc, #fff); padding-left: 4px; }
  .plat-label--sent { color: var(--sc, #fff); padding-right: 4px; }
  .plat-bubble { padding: 9px 13px; border-radius: 18px; max-width: 80%; font-size: 14px; line-height: 1.5; animation: fadeUp 0.25s ease; }
  .plat-bubble--recv { background: var(--rb); color: var(--rc); border-bottom-left-radius: 4px; }
  .plat-bubble--sent { background: var(--sb); color: var(--sc); border-bottom-right-radius: 4px; }
  .plat-typing { display: flex; gap: 4px; align-items: center; min-width: 48px; }
  .plat-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--rc,#888); opacity: 0.5; animation: typingPulse 1.2s infinite; }
  .plat-typing span:nth-child(2) { animation-delay: 0.2s; }
  .plat-typing span:nth-child(3) { animation-delay: 0.4s; }

  /* Platform headers */
  .plat-header { display: flex; align-items: center; gap: 10px; padding: 11px 14px; }
  .ph__back { font-size: 22px; line-height: 1; padding-right: 2px; }
  .ph__avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; flex-shrink: 0; }
  .ph__info { display: flex; flex-direction: column; flex: 1; }
  .ph__name { font-weight: 600; font-size: 14px; line-height: 1.2; }
  .ph__sub { font-size: 11px; opacity: 0.55; margin-top: 2px; }
  .ph__actions { margin-left: auto; display: flex; gap: 10px; font-size: 17px; }

  .ph--ig { background: #000; color: #fff; border-bottom: 1px solid #1a1a1a; }
  .ph__avatar--ig { background: linear-gradient(135deg,#f09433,#dc2743,#bc1888); color: #fff; }
  .ph--fb { background: #fff; color: #1c1e21; border-bottom: 1px solid #e4e6ea; }
  .ph__avatar--fb { background: #0084FF; color: #fff; }
  .ph--sms { background: #f2f2f7; color: #000; border-bottom: 1px solid #e0e0e0; }
  .ph__avatar--sms { background: #8e8e93; color: #fff; }
  .ph--wa { background: #1F2C34; color: #e9edef; border-bottom: 1px solid #2a3942; }
  .ph__avatar--wa { background: #25D366; color: #fff; }
  .ph--email { background: #f8f9fa; color: #202124; border-bottom: 1px solid #e0e0e0; padding: 12px 16px; gap: 10px; }

  /* Platform input bars */
  .plat-input { display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
  .pi__field { flex: 1; font-size: 13px; opacity: 0.35; }
  .pi__icon { font-size: 17px; opacity: 0.5; }
  .pi--instagram { background: #000; border-top: 1px solid #1a1a1a; color: #fff; }
  .pi--facebook  { background: #fff; border-top: 1px solid #e4e6ea; color: #1c1e21; }
  .pi--sms       { background: #f2f2f7; border-top: 1px solid #e0e0e0; color: #000; }
  .pi--whatsapp  { background: #1F2C34; border-top: 1px solid #2a3942; color: #e9edef; }

  /* Email */
  .email-thread { background: #fff; }
  .email-meta { padding: 14px 18px; border-bottom: 1px solid #e8eaed; background: #f8f9fa; }
  .email-meta__row { display: flex; gap: 10px; font-size: 12px; color: #202124; padding: 3px 0; }
  .email-meta__row span:first-child { color: #5f6368; min-width: 34px; }
  .email-meta__subject { margin-top: 4px; font-size: 13px; }
  .email-msg { padding: 14px 18px; border-bottom: 1px solid #f0f0f0; }
  .email-msg--reply { background: #f8f9fa; }
  .email-reply-tag { font-size: 11px; font-weight: 600; color: #3b82f6; letter-spacing: 0.5px; margin-bottom: 8px; }
  .email-body p { font-size: 13px; color: #202124; line-height: 1.65; margin: 0 0 4px; }

  /* DEMO INFO */
  .demo-info__h3 { font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 0 0 12px; }
  .demo-info__intro { font-size: 15px; color: #64748b; line-height: 1.7; margin: 0 0 24px; }
  .demo-info__list { list-style: none; padding: 0; margin: 0 0 32px; display: flex; flex-direction: column; gap: 14px; }
  .feature-item { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: #94a3b8; line-height: 1.5; }
  .feature-item__check { color: #60a5fa; font-weight: 700; flex-shrink: 0; }

  /* HEMSIDOR */
  .web-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 48px; }
  .web-feature { background: #162032; border: 1px solid #1e2d45; border-radius: 14px; padding: 24px; transition: border-color 0.2s, transform 0.2s; }
  .web-feature:hover { border-color: #3b82f6; transform: translateY(-2px); }
  .web-feature__icon { margin-bottom: 14px; }
  .web-feature__title { font-weight: 700; font-size: 16px; color: #f1f5f9; margin-bottom: 8px; }
  .web-feature__desc { font-size: 14px; color: #64748b; line-height: 1.6; }
  .web-case { background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.2); border-radius: 16px; padding: 32px; text-align: center; max-width: 600px; margin: 0 auto; }
  .web-case__label { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: #60a5fa; text-transform: uppercase; margin-bottom: 12px; }
  .web-case__text { color: #94a3b8; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }

  /* PROCESS */
  .process-steps { display: flex; align-items: flex-start; gap: 16px; max-width: 900px; margin: 0 auto; justify-content: center; }
  .process-step { flex: 1; max-width: 260px; text-align: center; }
  .process-step__num { width: 52px; height: 52px; border-radius: 50%; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px; margin: 0 auto 18px; }
  .process-step__title { font-weight: 700; font-size: 17px; color: #f1f5f9; margin-bottom: 10px; }
  .process-step__desc { font-size: 14px; color: #64748b; line-height: 1.65; }
  .process-steps__arrow { font-size: 28px; color: #1e2d45; margin-top: 14px; flex-shrink: 0; }

  /* FÖRDELAR */
  .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 40px; }
  .benefit-card { background: #162032; border: 1px solid #1e2d45; border-radius: 16px; padding: 32px 28px; transition: border-color 0.2s, transform 0.2s; }
  .benefit-card:hover { border-color: #3b82f6; transform: translateY(-2px); }
  .benefit-card__title { font-size: 20px; font-weight: 700; color: #e2e8f0; margin: 0 0 12px; }
  .benefit-card__desc { font-size: 15px; color: #64748b; line-height: 1.7; margin: 0; }

  /* SMÄRTA */
  .pain-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin: 40px 0 32px; }
  .pain-card { background: #162032; border: 1px solid #1e2d45; border-radius: 16px; padding: 28px 24px; }
  .pain-card p { margin: 0; color: #94a3b8; font-size: 15px; line-height: 1.6; }
  .pain-solution { text-align: center; font-size: 18px; font-weight: 600; color: #e2e8f0; max-width: 540px; margin: 0 auto; }

  /* OM OSS */
  .about-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; max-width: 960px; margin: 0 auto; }
  .about-text p { color: #94a3b8; font-size: 16px; line-height: 1.8; margin: 0 0 16px; }
  .about-values { display: flex; flex-direction: column; gap: 16px; }
  .value-card { display: flex; align-items: flex-start; gap: 16px; background: #162032; border: 1px solid #1e2d45; border-radius: 14px; padding: 20px; }
  .value-card__icon { flex-shrink: 0; }
  .value-card__title { font-weight: 700; font-size: 15px; color: #e2e8f0; margin-bottom: 4px; }
  .value-card__desc { font-size: 14px; color: #64748b; }

  /* SCROLL REVEAL */
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.55s ease, transform 0.55s ease; }
  .reveal--in { opacity: 1; transform: translateY(0); }

  /* PHONE FRAME */
  .phone-frame { position: relative; background: #1a1a1a; border-radius: 44px; padding: 12px 8px 16px; box-shadow: 0 0 0 2px #2a2a2a, 0 32px 80px rgba(0,0,0,0.6), inset 0 0 0 1px #333; max-width: 280px; margin: 0 auto; }
  .phone-frame__notch { display: flex; justify-content: center; align-items: center; height: 28px; margin-bottom: 6px; }
  .phone-frame__speaker { width: 60px; height: 6px; background: #222; border-radius: 3px; }
  .phone-frame__home { width: 40px; height: 5px; background: #222; border-radius: 3px; margin: 10px auto 0; }
  .phone-frame .plat-shell { border-radius: 12px; max-width: 100%; }

  /* HERO FLOATS */
  @keyframes floatA { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
  @keyframes floatB { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(8px); } }
  @keyframes floatC { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
  .hero-floats { position: absolute; inset: 0; pointer-events: none; display: none; }
  @media (min-width: 1024px) { .hero-floats { display: block; } }
  .hf-card { position: absolute; display: flex; align-items: center; gap: 12px; background: rgba(22,32,50,0.9); border: 1px solid #1e2d45; backdrop-filter: blur(12px); border-radius: 14px; padding: 12px 18px; min-width: 210px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .hf-card__icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(59,130,246,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .hf-card__title { font-size: 13px; font-weight: 600; color: #e2e8f0; }
  .hf-card__sub { font-size: 11px; color: #64748b; margin-top: 2px; }
  .hf-card--1 { top: 38%; left: 2%; animation: floatA 4s ease-in-out infinite; }
  .hf-card--2 { top: 52%; right: 2%; animation: floatB 5s ease-in-out infinite; }
  .hf-card--3 { bottom: 14%; left: 4%; animation: floatC 4.5s ease-in-out infinite; }

  /* BENEFIT ICON */
  .benefit-card__icon { margin-bottom: 16px; }

  /* BOKA */
  .book-cta-wrap { text-align: center; padding: 20px 0 10px; }
  .book-cta-btn { display: inline-block; background: linear-gradient(135deg,#3b82f6,#818cf8); color: #fff; font-size: 20px; font-weight: 600; padding: 20px 48px; border-radius: 14px; text-decoration: none; transition: opacity .2s, transform .2s; box-shadow: 0 8px 30px rgba(59,130,246,0.3); max-width: 100%; }
  .book-cta-btn:hover { opacity: .88; transform: translateY(-2px); }
  .book-cta-note { margin-top: 14px; color: #94a3b8; font-size: 14px; }

  /* FAQ */
  .faq-list { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
  .faq-item { background: #162032; border: 1px solid #1e2d45; border-radius: 14px; overflow: hidden; transition: border-color 0.2s; }
  .faq-item--open { border-color: rgba(59,130,246,0.4); }
  .faq-item__q { display: flex; justify-content: space-between; align-items: center; gap: 16px; width: 100%; background: none; border: none; color: #e2e8f0; font-size: 16px; font-weight: 600; padding: 20px 24px; cursor: pointer; text-align: left; }
  .faq-item__q:hover { color: #60a5fa; }
  .faq-item__arrow { font-size: 22px; color: #3b82f6; flex-shrink: 0; line-height: 1; }
  .faq-item__a { padding: 0 24px 20px; color: #64748b; font-size: 15px; line-height: 1.75; }

  /* FOOTER */
  .footer { border-top: 1px solid #1e2d45; padding: 48px 0; background: #0a1220; }
  .footer__inner { display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; }
  .footer__links { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
  .footer__links button { background: none; border: none; color: #475569; font-size: 14px; cursor: pointer; transition: color 0.2s; }
  .footer__links button:hover { color: #94a3b8; }
  .footer__copy { font-size: 13px; color: #475569; margin: 0; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .nav__links { display: none; }
    .nav__links--open { display: flex; flex-direction: column; position: fixed; top: 72px; left: 0; right: 0; background: rgba(15,22,35,0.98); padding: 20px 24px 28px; border-bottom: 1px solid #1e2d45; }
    .nav__burger { display: flex; }
    .services-grid { grid-template-columns: 1fr; }
    .demo-wrap { grid-template-columns: 1fr; gap: 36px; }
    .web-grid { grid-template-columns: 1fr 1fr; }
    .process-steps { flex-direction: column; align-items: center; gap: 12px; }
    .process-steps__arrow { transform: rotate(90deg); margin: -4px 0; }
    .about-wrap { grid-template-columns: 1fr; gap: 36px; }
    .stats__divider { display: none; }
    .stat { padding: 12px 20px; }
    .platform-picker { gap: 6px; }
    .platform-btn { padding: 8px 12px; font-size: 13px; }
    .platform-btn__label { display: none; }
    .book-cta-btn { font-size: 17px; padding: 16px 32px; }
    .hero__h1 { letter-spacing: -1px; }
    .section { padding: 72px 0; }
    .service-card { padding: 28px 24px; }
  }
  @media (max-width: 480px) {
    .web-grid { grid-template-columns: 1fr; }
    .niche-picker { gap: 6px; }
    .niche-btn { font-size: 12px; padding: 7px 12px; }
    .hero__btns { flex-direction: column; align-items: center; }
    .hero__btns .btn { width: 100%; max-width: 320px; }
    .stats { border-radius: 14px; }
  }
`;
