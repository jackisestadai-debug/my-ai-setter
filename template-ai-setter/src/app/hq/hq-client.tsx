"use client";

/**
 * AURA HQ — the Iron Man experience.
 *
 * POWER MODEL:
 *   - Page load: if the mic permission is already granted, Aura AUTO-BOOTS —
 *     two-act cinematic synced to BOOT_IGNITE: energy GATHERS (streaks pulled
 *     in from the room's edges, arc rings drawing in, radar sweep, tick
 *     reticle charging) then the core IGNITES (round flash, shockwaves, room
 *     blooms, SYSTEMS ONLINE). Sound mirrors it: noise riser + sub heartbeat
 *     into a chord bloom. Tap anywhere to skip. When the ignition settles he
 *     says one short rotating line ("Online." / "Systems up, boss.") — the
 *     TTS is prefetched during the cinematic so it lands on time.
 *     First-ever visit (no mic permission yet) shows a "tap to power up" gate.
 *   - Live: CLAP (or tap the orb) and talk. After he answers he auto-listens.
 *   - Sleep: 30s idle, or say "go to sleep" — descending sound, room dims.
 *     Clap or tap wakes him (short ignition + sound).
 *   - Shutdown: say "shut down" — he says goodbye, power-down sequence +
 *     sound, mic fully OFF. Only a tap reboots (full cinematic again).
 *
 * Audio architecture (the part that breaks if you "improve" it):
 *   - getUserMedia mic stream = CLAP DETECTION ONLY, active only while idle or
 *     asleep. It is fully stopped before speech recognition starts, because on
 *     Mac Chrome an open mic stream steals audio from webkitSpeechRecognition.
 *   - SpeechRecognition runs ONLY inside a capture window (after clap/tap or
 *     after Aura finishes speaking).
 *   - The TTS <audio> element's MediaElementSource drives the speaking orb.
 *   - Sound effects are synthesized with WebAudio oscillators — no files.
 *
 * Panels: every reply REPLACES what's on screen (no stacking); "keep that up"
 * makes Aura resend one. The data rings around the orb are ON DEMAND — they
 * light up when the convo is about numbers (or a booking lands), then fade.
 *
 * No login — bookmarked ?k=<key> link. Palette: #0d0d0d / #7eb8d4 / #4a90b8 (cream & gold).
 */

import React, { Component, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Optional per-deployment overrides — pass from a wrapper page to customise
 *  without touching the owner client. Omit for the default Rekvo setup. */
export interface HqPitchBeat {
  say: string;
  panels?: { kind: string; [k: string]: unknown }[];
  rings?: boolean;
  autoConv?: boolean;
  conv?: { role: "lead" | "setter"; text: string }[];
  closeConv?: boolean;
  hold?: number;
  switchTab?: "aura" | "dashboard" | "crm" | "kalender" | "noter";
}

export interface HqConfig {
  brandName?: string;
  apiBase?: string; // e.g. "/api/klinik-demo"
  dashboardPath?: string; // e.g. "/klinik-demo/dashboard"
  hideTabs?: Array<"crm" | "kalender" | "noter">; // tabs to hide
  pitchBeats?: HqPitchBeat[] | ((kickoff: string) => HqPitchBeat[]); // custom pitch script
}

interface SR {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((e: SREvent) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null;
  start: () => void; stop: () => void;
}
interface SREvent { resultIndex: number; results: { length: number;[i: number]: { 0: { transcript: string }; isFinal: boolean } } }
function getSR(): SR | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const C = (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SR) | undefined;
  if (!C) return null;
  try { return new C(); } catch { return null; }
}

/** Dashboard brand name resolved at runtime (see HqConfig). */
const DEFAULT_BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "REKVO";

type Tab = "aura" | "dashboard" | "crm" | "kalender" | "noter";
type OrbState = "idle" | "listening" | "thinking" | "speaking" | "asleep";
type FxMode = "" | "boot" | "wake" | "down" | "off";

interface PanelRow { label?: string; value?: number | string; primary?: string; secondary?: string; tertiary?: string; from?: string; text?: string; time?: string }
interface ReportSection { h?: string; body?: string }
interface ReportFix { n?: number; title?: string; body?: string; why?: string; impact?: string; target?: string; confidence?: string }
interface Panel { kind: string; title?: string; rows?: PanelRow[]; items?: { label: string; value: string | number }[]; value?: string | number; sub?: string; accent?: boolean; summary?: string; sections?: ReportSection[]; fixes?: ReportFix[] }
interface LivePanel extends Panel { id: number; x: number; y: number; leaving?: boolean }
interface Ring { leads7: number; engaged: number; booked7: number; cash7: string }
interface Ripple { ang: number; t0: number; kind: string }

const KEY = (): string => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("k") || "");
const SLEEP_MS = 30_000;
const LISTEN_WINDOW_MS = 60_000; // pure safety net — endpointing decides when he's done, NOT this
const PULSE_EVERY_MS = 45_000;
const BOOT_MS = 3600;
const BOOT_IGNITE = 0.62;      // fraction of the boot when the core ignites — visuals + sound + flash all sync to this
const RING_SHOW_MS = 12_000;
const PANEL_SLOTS = [{ x: 62, y: 14 }, { x: 5, y: 14 }, { x: 62, y: 50 }, { x: 5, y: 50 }, { x: 33.5, y: 14 }, { x: 33.5, y: 50 }];
const CINE_SLOTS = [{ x: 2.5, y: 26 }, { x: 35, y: 26 }, { x: 67.5, y: 26 }]; // cinema: big row under the raised orb
const CONVO_HOLD_MS = 90_000; // after an exchange the mic stays HOT this long — no clap mid-conversation
const ACK_AFTER_MS = 900;     // brain slower than this → Aura acknowledges out loud while he works
// Context-aware acks: a question/lookup gets a "checking" line, an action gets
// a "doing it" line, and control commands (sleep/shutdown/theme/demo/clear) or
// small talk get NO ack (they'd sound wrong, or he just answers instantly).
const ACK_SETS: Record<"ask" | "act", string[]> = {
  ask: ["Kollar.", "Ett ögonblick.", "Hämtar det.", "Checkar nu."],
  act: ["Fixar det.", "Klart.", "Gör det nu.", "Klart om en sekund."],
};
type AckCat = "ask" | "act" | null;
function ackCategory(text: string): AckCat {
  const t = text.trim().toLowerCase();
  // control / instant — never ack these
  if (/\b(go to sleep|good night|stand ?by|shut ?down|power (off|down)|turn (yourself|you) off)\b/.test(t)) return null;
  if (/\b(demo mode|exit demo|demo time|presentation mode)\b/.test(t)) return null;
  if (/\b(clear|close that|remove this|never ?mind|cancel|stop)\b/.test(t)) return null;
  if (/(make it |switch to |change (the )?theme|go (gold|blue|red|green|purple|cyan|teal|pink|orange|white|silver))/.test(t)) return null;
  // action — doing something to a lead / the system
  if (/\b(turn|move|tag|untag|ban|unban|send|fire|book|pause|resume|set|remove|add|draft|disqualify|mark)\b/.test(t)) return "act";
  // question / lookup — most of the slow data pulls
  if (/\b(what|whats|how|who|when|where|why|which|show|pull|find|give|tell|catch me up|brief|hottest|how much|how many|did|do i|are |is )\b/.test(t) || t.includes("?")) return "ask";
  return null; // greetings / small talk → no ack, he just replies (fast)
}

const isDemo = (): boolean => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");

// ── THEME: Aura recolors the whole room on command ("make it blue") ──
type RGB = [number, number, number];
const THEMES: Record<string, RGB> = {
  gold: [126, 184, 212], amber: [245, 180, 70], orange: [242, 150, 66], red: [240, 86, 86],
  crimson: [230, 70, 90], pink: [242, 120, 200], magenta: [230, 90, 200], purple: [176, 124, 255],
  violet: [150, 110, 255], blue: [88, 150, 255], cyan: [64, 210, 232], teal: [60, 200, 180],
  green: [80, 212, 140], emerald: [60, 210, 150], lime: [160, 220, 80], white: [222, 228, 240],
  silver: [200, 208, 224], ice: [180, 220, 255],
};
function resolveTheme(s: string): RGB | null {
  const t = (s || "").trim().toLowerCase();
  const hex = t.match(/^#?([0-9a-f]{6})$/);
  if (hex) { const n = parseInt(hex[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  for (const k in THEMES) if (t.includes(k)) return THEMES[k];
  return null;
}
const lighten = ([r, g, b]: RGB): RGB => [Math.min(255, r * 0.5 + 150), Math.min(255, g * 0.5 + 150), Math.min(255, b * 0.5 + 140)];
const darken = ([r, g, b]: RGB): RGB => [r * 0.6, g * 0.5, b * 0.35];
const rgbStr = ([r, g, b]: RGB) => `${r | 0},${g | 0},${b | 0}`;
const hexStr = ([r, g, b]: RGB) => "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");

/** Override stylesheet that recolors the chrome to the active theme. Every
 *  selector is `.hq-root`-prefixed so it outranks the base gold CSS by
 *  specificity regardless of stylesheet order. */
function themeCss(base: RGB): string {
  const g = rgbStr(base), gl = rgbStr(lighten(base)), gc = hexStr(base), gc2 = hexStr(darken(base));
  if (g === "201,168,76") return ""; // default gold = base CSS, no override needed
  const R = ".hq-root ";
  return `
    ${R}.hq-wm { text-shadow: 0 0 18px rgba(${g},0.4); } ${R}.hq-wm .g { color: ${gc}; }
    ${R}.hq-corner { border-color: rgba(${g},0.4); }
    ${R}.hq-tab { background: rgba(${g},0.05); border-color: rgba(${g},0.24); }
    ${R}.hq-tab::after { background: linear-gradient(90deg, transparent, rgba(${gl},0.28), transparent); }
    ${R}.hq-tab:hover { border-color: rgba(${g},0.7); box-shadow: 0 0 18px rgba(${g},0.28), inset 0 0 12px rgba(${g},0.08); }
    ${R}.hq-tab.on { background: linear-gradient(90deg,${gc},${gc2}); box-shadow: 0 0 22px rgba(${g},0.4); }
    ${R}.hq-state.s-speaking { color: ${gc}; }
    ${R}.hq-hud .ok { color: ${gc}; text-shadow: 0 0 10px rgba(${g},0.5); }
    ${R}.hq-wake, ${R}.hq-fxlabel { color: ${gc}; text-shadow: 0 0 14px rgba(${g},0.6); }
    ${R}.hq-wake.live { color: ${hexStr(lighten(base))}; }
    ${R}.hq-demobadge { background: linear-gradient(90deg,${gc},${gc2}); }
    ${R}.hq-panel { background: linear-gradient(160deg, rgba(${g},0.08), rgba(13,19,36,0.52)); border-color: rgba(${g},0.45);
      box-shadow: 0 0 0 1px rgba(${g},0.08), 0 18px 60px rgba(0,0,0,0.6), 0 0 40px rgba(${g},0.14); }
    ${R}.hq-panel:hover { border-color: rgba(${g},0.85); box-shadow: 0 0 0 1px rgba(${g},0.15), 0 24px 70px rgba(0,0,0,0.65), 0 0 56px rgba(${g},0.3); }
    ${R}.hq-panel::before { background: linear-gradient(90deg, transparent, rgba(${gl},0.95), transparent); box-shadow: 0 0 14px rgba(${g},0.9); }
    ${R}.hq-panel::after { background: linear-gradient(90deg, transparent, rgba(${g},0.18), transparent); }
    ${R}.hq-panel-bar { border-bottom-color: rgba(${g},0.2); background: rgba(${g},0.07); }
    ${R}.hq-panel-title, ${R}.hq-statitem-v { color: ${gc}; }
    ${R}.hq-barfill { background: linear-gradient(90deg,${gc2},${gc}); box-shadow: 0 0 12px rgba(${g},0.6); }
    ${R}.hq-metric-val.acc { color: ${gc}; text-shadow: 0 0 24px rgba(${g},0.55); }
    ${R}.hq-statitem { border-color: rgba(${g},0.16); }
    ${R}.hq-bub.us { background: rgba(${g},0.16); border-color: rgba(${g},0.32); }
    ${R}.hq-frame { border-color: rgba(${g},0.3); box-shadow: 0 0 40px rgba(${g},0.1); }
    ${R}.hq-launch-title { color: ${gc}; text-shadow: 0 0 20px rgba(${g},0.4); }
    ${R}.hq-dm-send { background: linear-gradient(90deg,${gc},${gc2}); }
  `;
}

/**
 * Smart endpointing — how long to wait after Jack stops talking before
 * firing the command. Not one hardcoded window: the wait adapts to whether
 * the sentence SOUNDS finished. A trailing connector, filler, or dangling
 * verb ("and", "umm", "show me", "what about") means he's mid-thought —
 * give him room. A complete-sounding command stays snappy.
 */
const MID_THOUGHT = new Set([
  "and", "but", "or", "so", "because", "plus", "also", "then", "like", "actually", "basically",
  "um", "umm", "uh", "uhh", "er", "hmm",
  "to", "for", "with", "of", "in", "on", "at", "about", "from", "by", "into", "versus", "vs",
  "the", "a", "an", "my", "his", "her", "their", "our", "your",
  "is", "are", "was", "were", "can", "could", "should", "would", "will", "do", "does", "did",
  "what", "which", "who", "how", "why", "when", "where", "if", "whether",
  "i", "we", "he", "she", "they", "me", "show", "give", "pull", "send", "tell", "make", "get",
]);
function endpointDelay(text: string, lastFinal: boolean): number {
  const words = text.trim().toLowerCase().replace(/[^a-z0-9'\s]/g, "").split(/\s+/);
  const last = words[words.length - 1] || "";
  if (MID_THOUGHT.has(last)) return 2200;  // sounds unfinished — let him think
  if (words.length <= 2) return 1300;      // barely started
  return lastFinal ? 500 : 750;            // sounds complete — stay snappy
}

const GREETINGS = [
  "Aura online. Välkommen tillbaka — vad kan jag hjälpa dig med idag?",
  "Systemen är gröna. Vad behöver du?",
  "Uppstartad och redo. Hur kan jag assistera dig?",
  "Allt körs smidigt. Säg bara till.",
  "Bra timing — allt ser bra ut. Vad vill du gå igenom?",
];
function nextGreeting(): string {
  let i = 0;
  try {
    i = (parseInt(localStorage.getItem("hq-greet") ?? "0", 10) || 0) % GREETINGS.length;
    localStorage.setItem("hq-greet", String((i + 1) % GREETINGS.length));
  } catch { /* rotation is best-effort */ }
  return GREETINGS[i];
}

class Boundary extends Component<{ children: ReactNode }, { broken: boolean }> {
  constructor(p: { children: ReactNode }) { super(p); this.state = { broken: false }; }
  static getDerivedStateFromError() { return { broken: true }; }
  render() {
    if (this.state.broken) return <div className="hq-center"><div><h1>Glitch.</h1><button className="hq-go" onClick={() => location.reload()}>Reload</button></div></div>;
    return this.props.children;
  }
}

export default function HqClient({ config }: { config?: HqConfig } = {}) {
  return <Boundary><Hq config={config} /><HqStyles /></Boundary>;
}

function Hq({ config }: { config?: HqConfig } = {}) {
  const BRAND_NAME = config?.brandName ?? DEFAULT_BRAND;
  const apiBase = config?.apiBase ?? "/api/hq";
  const dashboardPath = config?.dashboardPath ?? "/dashboard";
  const hideTabs = new Set(config?.hideTabs ?? []);
  const [tab, setTab] = useState<Tab>("aura");
  const [online, setOnline] = useState(false);
  const [orb, setOrb] = useState<OrbState>("idle");
  const [heard, setHeard] = useState("");
  const [said, setSaid] = useState("");
  const [panels, setPanels] = useState<LivePanel[]>([]);
  const [note, setNote] = useState("");
  const [fxLabel, setFxLabel] = useState("");
  const [fxMode, setFxMode] = useState<FxMode>("");
  const [srSupported, setSrSupported] = useState(true);
  const [textInput, setTextInput] = useState("");

  const orbRef = useRef<OrbState>("idle"); orbRef.current = orb;
  const fxModeRef = useRef<FxMode>(""); fxModeRef.current = fxMode;
  const panelsLive = useRef<LivePanel[]>([]); panelsLive.current = panels;
  const panelSwap = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineRef = useRef(false);
  const keyRef = useRef("");
  const histRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const panelId = useRef(1);
  const lastActivity = useRef(Date.now());

  const acRef = useRef<AudioContext | null>(null);
  const ttsAnalyser = useRef<AnalyserNode | null>(null);
  const ttsSrcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const micStream = useRef<MediaStream | null>(null);
  const micAnalyser = useRef<AnalyserNode | null>(null);
  const clapEma = useRef(0);
  const lastClap = useRef(0);

  const srRef = useRef<SR | null>(null);
  const micState = useRef<"off" | "ready" | "capturing">("off");
  const captureBuf = useRef("");
  const lastFinalRef = useRef(false);
  const convoUntil = useRef(0);
  const ackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ackUrls = useRef<{ ask: string[]; act: string[] }>({ ask: [], act: [] });
  const ackAudioRef = useRef<HTMLAudioElement | null>(null);
  const demoRef = useRef(false);
  const [cinema, setCinema] = useState(false);
  const [demo, setDemo] = useState(false);
  const [demoChatOpen, setDemoChatOpen] = useState(false);
  const [autoConvMsgs, setAutoConvMsgs] = useState<{ role: "lead" | "setter"; text: string }[]>([]);
  const autoConvRef = useRef(false);
  // Cinematic "deal closed" takeover — fires when cash lands (real events only).
  const [dealClose, setDealClose] = useState<{ amount: number; at: number } | null>(null);
  const [themeRgb, setThemeRgb] = useState<RGB>([126, 184, 212]);
  const themeRef = useRef<RGB>([126, 184, 212]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const ampRef = useRef(0);
  const tintRef = useRef<[number, number, number]>([126, 184, 212]);
  const powerRef = useRef(0.18);
  const glOkRef = useRef(false);
  const glCanvas = useRef<HTMLCanvasElement | null>(null);
  const silence = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWin = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakingLock = useRef(false);

  const fxRef = useRef<{ mode: FxMode; t0: number; dur: number }>({ mode: "", t0: 0, dur: 0 });
  const bootTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetUrl = useRef<Promise<string | null> | null>(null);
  const scrambleIv = useRef<ReturnType<typeof setInterval> | null>(null);
  const labelTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ringRef = useRef<Ring | null>(null);
  const ringsAt = useRef(-1e9);
  const flashRef = useRef(-1e9);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastPulseRef = useRef(new Date().toISOString());

  const orbCanvas = useRef<HTMLCanvasElement | null>(null);
  const bgCanvas = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef(0); const bgRaf = useRef(0);

  // forward decls via refs (break circular hook deps)
  const beginCaptureRef = useRef<() => void>(() => {});
  const bootUpRef = useRef<() => void>(() => {});
  const goSleepRef = useRef<() => void>(() => {});

  useEffect(() => {
    const k = KEY(); keyRef.current = k; setSrSupported(getSR() !== null);
    if (isDemo()) { demoRef.current = true; setDemo(true); ringRef.current = { leads7: 47, engaged: 19, booked7: 11, cash7: "38 500 kr" }; }
  }, []);

  // ── room depth: the whole HQ leans with the mouse (parallax) ──
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mx = e.clientX / window.innerWidth - 0.5, my = e.clientY / window.innerHeight - 0.5;
      mouseRef.current = { x: mx, y: my };
      document.documentElement.style.setProperty("--mx", String(mx));
      document.documentElement.style.setProperty("--my", String(my));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── theme + demo runtime switches (Aura flips these by voice) ──
  const applyTheme = useCallback((base: RGB) => { themeRef.current = base; setThemeRgb(base); }, []);
  const applyDemo = useCallback((on: boolean) => {
    demoRef.current = on; setDemo(on);
    if (on) {
      // freeze the rings to believable fake numbers so nothing real shows
      ringRef.current = { leads7: 38 + ((Math.random() * 18) | 0), engaged: 16 + ((Math.random() * 8) | 0), booked7: 8 + ((Math.random() * 6) | 0), cash7: `${(28 + ((Math.random() * 18) | 0)) * 1000} kr` };
    }
  }, []);

  const bump = useCallback(() => { lastActivity.current = Date.now(); if (orbRef.current === "asleep") setOrb("idle"); }, []);

  // ── audio plumbing ──
  const ensureAC = useCallback(() => {
    if (!acRef.current) acRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return acRef.current;
  }, []);

  /** Synthesized sound effects — pure WebAudio, no files, costs nothing. */
  const sfx = useCallback((kind: "boot" | "wake" | "sleep" | "off" | "pixin" | "pixout" | "tick") => {
    try {
      const ac = ensureAC();
      if (ac.state === "suspended") ac.resume().catch(() => { /* */ });
      const t0 = ac.currentTime + 0.02;
      const master = ac.createGain(); master.gain.value = 0.22; master.connect(ac.destination);
      const tone = (type: OscillatorType, f0: number, f1: number, start: number, dur: number, vol: number) => {
        const o = ac.createOscillator(); const g = ac.createGain();
        o.type = type;
        o.frequency.setValueAtTime(Math.max(20, f0), start);
        o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), start + dur);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(vol, start + Math.min(0.09, dur * 0.25));
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g); g.connect(master);
        o.start(start); o.stop(start + dur + 0.05);
      };
      if (kind === "boot") {
        // cinematic ignition: noise riser wind-up → sub heartbeat → harmonic
        // swell → soft chord bloom right when the core ignites → settle tick
        const IGN = t0 + (BOOT_MS * BOOT_IGNITE) / 1000;
        try {
          const dur = IGN - t0 - 0.05;
          const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * (dur + 0.4)), ac.sampleRate);
          const ch = buf.getChannelData(0);
          for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
          const src = ac.createBufferSource(); src.buffer = buf;
          const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.1;
          bp.frequency.setValueAtTime(140, t0);
          bp.frequency.exponentialRampToValueAtTime(2200, IGN);
          const g = ac.createGain();
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.45, IGN - 0.12);
          g.gain.exponentialRampToValueAtTime(0.0001, IGN + 0.25);
          src.connect(bp); bp.connect(g); g.connect(master);
          src.start(t0); src.stop(IGN + 0.3);
        } catch { /* riser optional */ }
        tone("sine", 58, 36, t0 + 0.12, 0.4, 0.8);     // sub heartbeat
        tone("sine", 58, 36, t0 + 0.78, 0.42, 0.9);
        tone("sine", 68, 196, t0 + 0.3, IGN - t0 - 0.3, 0.55);   // rising swell
        tone("sine", 136, 392, t0 + 0.5, IGN - t0 - 0.5, 0.2);
        const bloom = IGN - 0.02;                       // ignition chord
        tone("sine", 110, 110, bloom, 1.2, 0.4);
        tone("sine", 220, 220, bloom, 1.1, 0.3);
        tone("sine", 277, 277, bloom, 1.0, 0.22);
        tone("sine", 330, 330, bloom, 1.0, 0.2);
        tone("sine", 440, 440, bloom + 0.05, 0.9, 0.18);
        tone("triangle", 1760, 2637, bloom + 0.1, 0.55, 0.07);
        tone("sine", 880, 1318, t0 + 3.05, 0.35, 0.1);  // settle tick
      } else if (kind === "pixin" || kind === "pixout") {
        // digital sparkle matched to the pixel-dissolve: a fast run of tiny
        // blips — ascending when a panel materializes, descending when it goes
        const up = kind === "pixin";
        for (let i = 0; i < 12; i++) {
          const p = i / 11;
          const at = t0 + p * 0.34 + Math.random() * 0.012;
          const f = up ? 520 * Math.pow(2, p * 1.3) : 1280 / Math.pow(2, p * 1.3);
          tone("triangle", f, f * (up ? 1.06 : 0.94), at, 0.05, 0.16);
        }
        tone("sine", up ? 300 : 540, up ? 540 : 300, t0, 0.36, 0.16);
      } else if (kind === "tick") {     // tab hover — tiny glass blip
        tone("triangle", 1500, 1900, t0, 0.045, 0.05);
      } else if (kind === "wake") {     // short two-note rise
        tone("sine", 220, 660, t0, 0.5, 0.5);
        tone("sine", 660, 1320, t0 + 0.26, 0.45, 0.22);
      } else if (kind === "sleep") {    // gentle descend
        tone("sine", 540, 130, t0, 1.3, 0.38);
        tone("sine", 270, 65, t0 + 0.2, 1.5, 0.28);
      } else {                          // off: deep spin-down + final thud
        tone("sawtooth", 300, 45, t0, 1.7, 0.2);
        tone("sine", 150, 32, t0 + 0.2, 2.0, 0.55);
        tone("sine", 62, 26, t0 + 1.6, 1.0, 0.42);
      }
    } catch { /* sound is optional */ }
  }, [ensureAC]);

  const stopScramble = useCallback(() => {
    if (scrambleIv.current) { clearInterval(scrambleIv.current); scrambleIv.current = null; }
  }, []);

  const playFx = useCallback((mode: FxMode, dur: number, label: string, labelDelay = 0) => {
    fxRef.current = { mode, t0: performance.now(), dur };
    setFxMode(mode);
    labelTimers.current.forEach(clearTimeout); labelTimers.current = [];
    stopScramble();
    if (label) {
      labelTimers.current.push(setTimeout(() => {
        // decode-in: scrambled glyphs resolve left to right
        const CH = "ABCDEFGHJKLMNPQRSTUVXYZ#$%0123456789";
        let step = 0; const steps = 11;
        stopScramble();
        scrambleIv.current = setInterval(() => {
          step++;
          const reveal = Math.floor((step / steps) * label.length);
          setFxLabel(label.split("").map((c, i) => (i < reveal || c === " " ? c : CH[(Math.random() * CH.length) | 0])).join(""));
          if (step >= steps) { setFxLabel(label); stopScramble(); }
        }, 42);
      }, labelDelay));
      labelTimers.current.push(setTimeout(() => setFxLabel(""), labelDelay + dur + 600));
    }
    labelTimers.current.push(setTimeout(() => setFxMode(""), dur));
  }, [stopScramble]);

  const stopMic = useCallback(() => {
    try { micStream.current?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    micStream.current = null; micAnalyser.current = null; clapEma.current = 0;
  }, []);

  const startMic = useCallback(async () => {
    if (micStream.current || !onlineRef.current) { if (micStream.current) micState.current = "ready"; return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      micStream.current = stream;
      const ac = ensureAC(); if (ac.state === "suspended") await ac.resume();
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser(); an.fftSize = 1024; src.connect(an);
      micAnalyser.current = an; clapEma.current = 0;
      micState.current = "ready";
    } catch {
      micState.current = "off";
      setNote("mikrofon blockerad — tryck på orben för att prata");
    }
  }, [ensureAC]);

  // ── sleep / power ──
  const goSleep = useCallback(() => {
    if (!onlineRef.current || orbRef.current === "asleep") return;
    sfx("sleep");
    playFx("down", 1400, "VILOLÄGE", 200);
    setOrb("asleep"); setSaid(""); setHeard("");
    startMic(); // keep the clap ear open
  }, [sfx, playFx, startMic]);
  goSleepRef.current = goSleep;

  const powerOff = useCallback(() => {
    if (!onlineRef.current) return;
    sfx("off");
    playFx("off", 2000, "STÄNGER AV", 100);
    const sr = srRef.current; if (sr) { sr.onend = null; sr.onresult = null; try { sr.stop(); } catch { /* */ } srRef.current = null; }
    stopMic(); micState.current = "off";
    if (bootTimer.current) clearTimeout(bootTimer.current);
    bootTimer.current = setTimeout(() => {
      onlineRef.current = false; setOnline(false);
      setOrb("idle"); setPanels([]); setSaid(""); setHeard(""); setNote("");
      ringsAt.current = -1e9;
    }, 2000);
  }, [sfx, playFx, stopMic]);

  const wake = useCallback(() => {
    bump(); sfx("wake");
    playFx("wake", 1200, "");
  }, [bump, sfx, playFx]);

  // sleep watcher — power down to standby after 30s idle
  useEffect(() => {
    const iv = setInterval(() => {
      if (onlineRef.current && orbRef.current === "idle" && fxModeRef.current === "" && Date.now() - lastActivity.current > SLEEP_MS) {
        goSleepRef.current();
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // ── clap detector — sharp transient over a quiet floor, idle/asleep only ──
  useEffect(() => {
    const buf = new Uint8Array(1024);
    const iv = setInterval(() => {
      const an = micAnalyser.current;
      if (!an || micState.current !== "ready") return;
      const st = orbRef.current;
      an.getByteTimeDomainData(buf);
      let peak = 0;
      for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i] - 128) / 128; if (v > peak) peak = v; }
      const quiet = clapEma.current;
      clapEma.current = quiet * 0.92 + peak * 0.08;
      if ((st === "idle" || st === "asleep") && peak > 0.5 && quiet < 0.15 && Date.now() - lastClap.current > 1500) {
        lastClap.current = Date.now();
        if (st === "asleep") { bump(); sfx("wake"); playFx("wake", 1200, ""); }
        beginCaptureRef.current();
      }
    }, 30);
    return () => clearInterval(iv);
  }, [bump, sfx, playFx]);

  // ── living background + ripples + cinematic power FX ──
  useEffect(() => {
    const c = bgCanvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const COUNT = 120;
    type P = { x: number; y: number; vx: number; vy: number; s: number; z: number };
    let parts: P[] = []; let w = 0, h = 0, dpr = 1;
    const seed = () => {
      dpr = window.devicePixelRatio || 1; w = c.width = c.clientWidth * dpr; h = c.height = c.clientHeight * dpr;
      parts = Array.from({ length: COUNT }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, s: (Math.random() * 1.6 + 0.4) * dpr, z: 0.35 + Math.random() * 0.65 }));
    };
    seed(); let t = 0; let blastT0 = 0;
    const RIPPLE_MS = 1500;
    const ease3 = (p: number) => 1 - Math.pow(1 - p, 3);
    const rippleColor = (kind: string, a: number) =>
      kind === "cash" ? `rgba(255,228,150,${a})` : kind === "booked" ? `rgba(255,215,120,${a})` : kind === "lead" ? `rgba(201,168,76,${a * 0.9})` : `rgba(170,158,120,${a * 0.55})`;
    const draw = () => {
      if (c.clientWidth * (window.devicePixelRatio || 1) !== w) seed();
      const fx = fxRef.current;
      const fp = fx.mode ? Math.min(1, (performance.now() - fx.t0) / fx.dur) : 0;
      const asleep = orbRef.current === "asleep";
      // how "alive" the world is: offline dark → boot ramps it up → off ramps it down
      let world = onlineRef.current ? (asleep ? 0.4 : 1) : 0.22;
      if (fx.mode === "boot") {
        // slow creep while energy gathers, then the room SNAPS awake at ignition
        world = fp < BOOT_IGNITE
          ? 0.22 + 0.36 * ease3(fp / BOOT_IGNITE)
          : 0.58 + 0.42 * ease3((fp - BOOT_IGNITE) / (1 - BOOT_IGNITE));
      }
      if (fx.mode === "off") world = Math.max(0.12, 1 - ease3(fp) * 0.9);
      let speed = asleep ? 0.25 : 1;
      if (fx.mode === "boot") speed = fp < BOOT_IGNITE ? 1 + 2 * (fp / BOOT_IGNITE) : 1 + (1 - fp) * 8;
      const alpha = world;
      const TH = themeRef.current;
      const thBase = `${TH[0] | 0},${TH[1] | 0},${TH[2] | 0}`;
      const thDk = `${(TH[0] * 0.6) | 0},${(TH[1] * 0.5) | 0},${(TH[2] * 0.35) | 0}`;
      ctx.clearRect(0, 0, w, h);
      for (const b of [
        { x: w * (0.3 + Math.sin(t * 0.0006) * 0.08), y: h * (0.35 + Math.cos(t * 0.0005) * 0.06), r: Math.min(w, h) * 0.5 },
        { x: w * (0.72 + Math.cos(t * 0.0004) * 0.07), y: h * (0.6 + Math.sin(t * 0.0007) * 0.06), r: Math.min(w, h) * 0.42 },
      ]) { const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); g.addColorStop(0, `rgba(${thDk},${0.07 * alpha})`); g.addColorStop(1, "rgba(10,14,26,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
      const cxv = w / 2, cyv = h * 0.54, maxR = Math.hypot(w, h) / 2;
      // ignition wave state — drives the particle blast + constellation glow
      const ignite = fx.mode === "boot" && fp >= BOOT_IGNITE && fp < 1;
      const ip = ignite ? (fp - BOOT_IGNITE) / (1 - BOOT_IGNITE) : 0;
      const waveR = maxR * ease3(ip);
      if (ignite && blastT0 !== fx.t0) {
        // one-time radial impulse: the blast physically shoves the particle field
        blastT0 = fx.t0;
        for (const p of parts) {
          const dx = p.x - cxv, dy = p.y - cyv; const d = Math.hypot(dx, dy) || 1;
          const imp = (1.2 + 5 * Math.max(0, 1 - d / maxR)) * dpr;
          p.vx += (dx / d) * imp; p.vy += (dy / d) * imp;
        }
      }
      for (const p of parts) {
        const ang = Math.sin(p.x * 0.0016 + t * 0.002) + Math.cos(p.y * 0.0016 - t * 0.0017);
        p.vx = (p.vx + Math.cos(ang) * 0.02 * dpr) * 0.94; p.vy = (p.vy + Math.sin(ang) * 0.02 * dpr) * 0.94;
        p.x += p.vx * speed; p.y += p.vy * speed;
        if (p.x < 0) p.x += w; if (p.x > w) p.x -= w; if (p.y < 0) p.y += h; if (p.y > h) p.y -= h;
      }
      // parallax: each particle sits at its own depth and leans with the mouse
      const mpx = mouseRef.current.x * 70 * dpr, mpy = mouseRef.current.y * 44 * dpr;
      const ppx: number[] = [], ppy: number[] = [];
      for (const p of parts) { ppx.push(p.x + mpx * p.z); ppy.push(p.y + mpy * p.z); }
      const LINK = 120 * dpr; ctx.lineWidth = 1 * dpr;
      const band = 150 * dpr;
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
        const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y, d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          let o = (1 - Math.sqrt(d2) / LINK) * 0.16 * alpha;
          if (ignite) {
            // the shockwave lights up the constellation grid as it passes
            const dd = Math.abs(Math.hypot((parts[i].x + parts[j].x) / 2 - cxv, (parts[i].y + parts[j].y) / 2 - cyv) - waveR);
            if (dd < band) o += (1 - dd / band) * (1 - ip) * 0.5;
          }
          ctx.strokeStyle = `rgba(${thBase},${o})`; ctx.beginPath(); ctx.moveTo(ppx[i], ppy[i]); ctx.lineTo(ppx[j], ppy[j]); ctx.stroke();
        }
      }
      for (let i = 0; i < parts.length; i++) { ctx.beginPath(); ctx.arc(ppx[i], ppy[i], parts[i].s, 0, Math.PI * 2); ctx.fillStyle = `rgba(${thBase},${0.5 * alpha})`; ctx.fill(); }

      // full-screen power FX
      if (fx.mode === "boot" && fp < 1) {
        if (fp < BOOT_IGNITE) {
          // GATHER: streaks of energy pulled in from the edges of the room
          const gp = fp / BOOT_IGNITE;
          for (let i = 0; i < 14; i++) {
            const cyc = gp * 2.2 + i * 0.618; const pr = cyc % 1;
            const ang = i * 2.399 + Math.floor(cyc) * 1.713;
            const dist = maxR * (1 - ease3(pr) * 0.92);
            const px = cxv + Math.cos(ang) * dist, py = cyv + Math.sin(ang) * dist;
            const tail = maxR * (0.08 + 0.1 * pr);
            const a = Math.sin(pr * Math.PI) * 0.7;
            ctx.beginPath();
            ctx.moveTo(cxv + Math.cos(ang) * (dist + tail), cyv + Math.sin(ang) * (dist + tail));
            ctx.lineTo(px, py);
            ctx.strokeStyle = `rgba(201,168,76,${a * 0.45})`; ctx.lineWidth = 1.6 * dpr; ctx.stroke();
            ctx.beginPath(); ctx.arc(px, py, 2.2 * dpr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(240,225,170,${a})`; ctx.shadowColor = "rgba(240,225,170,0.9)"; ctx.shadowBlur = 12 * dpr; ctx.fill(); ctx.shadowBlur = 0;
          }
        } else {
          // IGNITION: the big ROUND flash lives HERE on the full-screen canvas
          // (the orb canvas is a square — anything big drawn there clips into
          // a visible box), plus shockwaves + a gold bloom as the room snaps on
          const fl = Math.max(0, 1 - ip * 2.4);
          if (fl > 0) {
            const fg = ctx.createRadialGradient(cxv, cyv, 0, cxv, cyv, maxR * 0.6);
            fg.addColorStop(0, `rgba(245,240,225,${0.8 * fl})`);
            fg.addColorStop(0.3, `rgba(201,168,76,${0.3 * fl})`);
            fg.addColorStop(1, "rgba(201,168,76,0)");
            ctx.fillStyle = fg; ctx.fillRect(0, 0, w, h);
          }
          for (let i = 0; i < 4; i++) {
            const rr = waveR - i * 95 * dpr;
            if (rr > 0) { ctx.beginPath(); ctx.arc(cxv, cyv, rr, 0, Math.PI * 2); ctx.strokeStyle = `rgba(201,168,76,${(1 - ip) * (0.5 - i * 0.1)})`; ctx.lineWidth = (3 - i * 0.6) * dpr; ctx.stroke(); }
          }
          const bloom = ctx.createRadialGradient(cxv, cyv, 0, cxv, cyv, maxR * 0.55);
          bloom.addColorStop(0, `rgba(240,225,170,${(1 - ip) * 0.16})`); bloom.addColorStop(1, "rgba(201,168,76,0)");
          ctx.fillStyle = bloom; ctx.fillRect(0, 0, w, h);
        }
      }
      if (fx.mode === "off" && fp < 1) {
        const rr = maxR * (1 - ease3(fp));
        ctx.beginPath(); ctx.arc(cxv, cyv, Math.max(2, rr), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201,168,76,${0.45})`; ctx.lineWidth = 2 * dpr; ctx.stroke();
        ctx.fillStyle = `rgba(4,6,12,${ease3(fp) * 0.55})`; ctx.fillRect(0, 0, w, h);
      }

      // incoming ripples — sparks flying from the edge into the orb
      const now = performance.now();
      ripplesRef.current = ripplesRef.current.filter((r) => now - r.t0 < RIPPLE_MS && now >= r.t0 - 4000);
      for (const r of ripplesRef.current) {
        if (now < r.t0) continue;
        const p = (now - r.t0) / RIPPLE_MS; const e = p * p * (3 - 2 * p);
        const sx = cxv + Math.cos(r.ang) * maxR, sy = cyv + Math.sin(r.ang) * maxR;
        const curve = Math.sin(p * Math.PI) * maxR * 0.12;
        const px = sx + (cxv - sx) * e + Math.cos(r.ang + Math.PI / 2) * curve;
        const py = sy + (cyv - sy) * e + Math.sin(r.ang + Math.PI / 2) * curve;
        const e2 = Math.max(0, p - 0.1); const eo = e2 * e2 * (3 - 2 * e2);
        const qx = sx + (cxv - sx) * eo + Math.cos(r.ang + Math.PI / 2) * Math.sin(Math.max(0, p - 0.1) * Math.PI) * maxR * 0.12;
        const qy = sy + (cyv - sy) * eo + Math.sin(r.ang + Math.PI / 2) * Math.sin(Math.max(0, p - 0.1) * Math.PI) * maxR * 0.12;
        const a = (1 - p) * 0.9;
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py);
        ctx.strokeStyle = rippleColor(r.kind, a * 0.5); ctx.lineWidth = 1.6 * dpr; ctx.stroke();
        ctx.beginPath(); ctx.arc(px, py, (r.kind === "booked" ? 3 : 2) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = rippleColor(r.kind, a); ctx.shadowColor = rippleColor(r.kind, 0.9); ctx.shadowBlur = 10 * dpr; ctx.fill(); ctx.shadowBlur = 0;
      }
      t += 1; bgRaf.current = requestAnimationFrame(draw);
    };
    bgRaf.current = requestAnimationFrame(draw);
    const onR = () => seed(); window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(bgRaf.current); window.removeEventListener("resize", onR); };
  }, []);

  // ── orb (+ ignition FX, on-demand data rings, cash flash) ──
  // depends on `tab`: the canvases unmount when leaving the AURA tab, so the
  // draw loop must re-bind to the NEW canvas when it comes back (this was the
  // "orb disappeared after switching tabs" bug)
  useEffect(() => {
    if (tab !== "aura") return;
    const c = orbCanvas.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return;
    let t = 0; const freq = new Uint8Array(64);
    const ease3 = (p: number) => 1 - Math.pow(1 - p, 3);
    const draw = () => {
      const dpr = window.devicePixelRatio || 1; const w = (c.width = c.clientWidth * dpr); const h = (c.height = c.clientHeight * dpr);
      ctx.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2, base = Math.min(w, h) * 0.21; const st = orbRef.current;
      const fx = fxRef.current;
      const fp = fx.mode ? Math.min(1, (performance.now() - fx.t0) / fx.dur) : 0;

      let amp = 0;
      const an = st === "speaking" ? ttsAnalyser.current : null;
      if (an) { an.getByteFrequencyData(freq); let s = 0; for (let i = 0; i < freq.length; i++) s += freq[i]; amp = Math.min(1, s / freq.length / 180); }
      else if (st === "listening") amp = 0.26 + Math.sin(t * 0.14) * 0.12 + Math.sin(t * 0.43) * 0.05;
      else if (st === "thinking") amp = 0.3 + Math.sin(t * 0.22) * 0.18;
      else if (st === "asleep") amp = 0.05 + Math.sin(t * 0.013) * 0.03;
      else amp = 0.1 + Math.sin(t * 0.04) * 0.035;

      // theme drives idle/speaking (and a lightened version for listening);
      // thinking stays cool-blue to read as "working" in any palette
      const TH = themeRef.current;
      const thBase = `${TH[0] | 0},${TH[1] | 0},${TH[2] | 0}`;
      const thLt = `${Math.min(255, TH[0] * 0.5 + 150) | 0},${Math.min(255, TH[1] * 0.5 + 150) | 0},${Math.min(255, TH[2] * 0.5 + 140) | 0}`;
      const thDk = `${(TH[0] * 0.6) | 0},${(TH[1] * 0.5) | 0},${(TH[2] * 0.35) | 0}`;
      const tint = st === "thinking" ? "120,170,255" : st === "listening" ? thLt : st === "asleep" ? "90,86,70" : thBase;
      const coreLight = st === "thinking" ? "210,230,255" : st === "asleep" ? "120,116,98" : "245,240,225";
      let dim = st === "asleep" ? 0.5 : 1;
      // feed the WebGL core
      ampRef.current = amp;
      const tparts = tint.split(",");
      tintRef.current = [Number(tparts[0]), Number(tparts[1]), Number(tparts[2])];

      // how powered the orb is: dead ember when offline, ignition ramp on boot, dies on off
      let power = onlineRef.current ? 1 : 0.18;
      if (fx.mode === "boot") {
        // flicker in the dark → glow builds while energy gathers → SNAP to full at ignition
        power = fp < 0.18
          ? 0.08 + (Math.sin(fp * 110) > 0.6 ? 0.25 : 0)
          : fp < BOOT_IGNITE
            ? 0.1 + 0.38 * ease3((fp - 0.18) / (BOOT_IGNITE - 0.18))
            : 0.48 + 0.52 * ease3((fp - BOOT_IGNITE) / (1 - BOOT_IGNITE));
      }
      if (fx.mode === "off") power = Math.max(0.18, 1 - ease3(fp));
      dim *= power;
      powerRef.current = dim;

      // when WebGL carries the volumetric core, the 2D layer skips its own
      // core/glow fills and keeps only the reactive outline + rings + FX
      if (!glOkRef.current) {
        const glow = ctx.createRadialGradient(cx, cy, base * 0.2, cx, cy, base * (1.7 + amp));
        glow.addColorStop(0, `rgba(${tint},${(0.16 + amp * 0.4) * dim})`); glow.addColorStop(0.5, `rgba(${thDk},${0.08 * dim})`); glow.addColorStop(1, "rgba(10,14,26,0)");
        ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      }

      ctx.beginPath(); const N = 110;
      for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2; const fv = an ? freq[i % freq.length] / 255 : 0; const wob = Math.sin(a * 7 + t * 0.07) * (2 + amp * 9); const r = base * (1 + amp * 0.5) + fv * base * 0.55 + wob; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.closePath(); ctx.strokeStyle = `rgba(${tint},${(0.5 + amp * 0.5) * dim})`; ctx.lineWidth = 2 * dpr; ctx.shadowColor = `rgba(${tint},${0.8 * dim})`; ctx.shadowBlur = 18 * dpr * (0.5 + amp); ctx.stroke(); ctx.shadowBlur = 0;

      if (st !== "asleep" && power > 0.5) {
        for (const rg of [{ r: base * 1.34, seg: 18, rot: t * 0.012, len: 0.5 }, { r: base * 1.54, seg: 24, rot: -t * 0.008, len: 0.32 }]) {
          ctx.lineWidth = 2 * dpr;
          for (let i = 0; i < rg.seg; i++) { const a0 = (i / rg.seg) * Math.PI * 2 + rg.rot; const a1 = a0 + (Math.PI * 2 / rg.seg) * rg.len; ctx.beginPath(); ctx.arc(cx, cy, rg.r + amp * 10, a0, a1); ctx.strokeStyle = `rgba(${tint},${(0.22 + amp * 0.3) * power})`; ctx.stroke(); }
        }
        for (let i = 0; i < 5; i++) { const a = t * 0.02 + (i / 5) * Math.PI * 2; const rr = base * (1.7 + Math.sin(t * 0.03 + i) * 0.12); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.92; ctx.beginPath(); ctx.arc(x, y, (1.4 + amp * 2.5) * dpr, 0, Math.PI * 2); ctx.fillStyle = `rgba(${tint},${(0.5 + amp * 0.4) * power})`; ctx.shadowColor = `rgba(${tint},0.9)`; ctx.shadowBlur = 8 * dpr; ctx.fill(); ctx.shadowBlur = 0; }
      }

      if (!glOkRef.current) {
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * (0.92 + amp * 0.3));
        core.addColorStop(0, `rgba(${coreLight},${0.95 * dim})`); core.addColorStop(0.4, `rgba(${tint},${(0.7 + amp * 0.3) * dim})`); core.addColorStop(1, `rgba(${thDk},0.04)`);
        ctx.beginPath(); ctx.arc(cx, cy, base * (0.92 + amp * 0.3), 0, Math.PI * 2); ctx.fillStyle = core; ctx.fill();
      }
      for (let i = 1; i <= 3; i++) { ctx.beginPath(); const rot = t * 0.01 * (i % 2 ? 1 : -1); ctx.ellipse(cx, cy, base * (1.2 + i * 0.2) + amp * 8 * i, base * (1.05 + i * 0.16) + amp * 6 * i, rot, 0, Math.PI * 2); ctx.strokeStyle = `rgba(${tint},${(0.16 / i) * dim})`; ctx.lineWidth = 1 * dpr; ctx.stroke(); }

      // ── on-demand data rings: light up when the convo is about numbers ──
      const ring = ringRef.current;
      const ringEl = performance.now() - ringsAt.current;
      if (ring && st !== "asleep" && onlineRef.current && ringEl >= 0 && ringEl < RING_SHOW_MS) {
        const rA = ringEl < 600 ? ringEl / 600 : ringEl > RING_SHOW_MS - 900 ? (RING_SHOW_MS - ringEl) / 900 : 1;
        const denom = Math.max(1, ring.leads7, ring.engaged, ring.booked7);
        const defs = [
          { frac: Math.min(1, ring.leads7 / denom), r: base * 1.86, a: 0.34, label: `${ring.leads7} LEADS · 7D` },
          { frac: Math.min(1, ring.engaged / denom), r: base * 2.0, a: 0.5, label: `${ring.engaged} ENGAGED` },
          { frac: Math.min(1, ring.booked7 / denom), r: base * 2.14, a: 0.85, label: `${ring.booked7} BOOKED · 7D` },
        ];
        for (const d of defs) {
          ctx.beginPath(); ctx.arc(cx, cy, d.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${thBase},${0.08 * rA})`; ctx.lineWidth = 2.5 * dpr; ctx.stroke();
          const sweep = Math.max(0.05, d.frac) * Math.PI * 2 * Math.min(1, ringEl / 900); // arcs draw themselves in
          ctx.beginPath(); ctx.arc(cx, cy, d.r, -Math.PI / 2, -Math.PI / 2 + sweep);
          ctx.strokeStyle = `rgba(${thBase},${d.a * rA})`; ctx.lineWidth = 2.5 * dpr;
          ctx.shadowColor = `rgba(${thBase},0.6)`; ctx.shadowBlur = 6 * dpr; ctx.stroke(); ctx.shadowBlur = 0;
        }
        ctx.font = `600 ${9 * dpr}px ui-monospace, Menlo, monospace`; ctx.textAlign = "right";
        defs.forEach((d, i) => { ctx.fillStyle = `rgba(225,210,165,${(0.45 + d.a * 0.4) * rA})`; ctx.fillText(d.label, w - 6 * dpr, (14 + i * 13) * dpr); });
        ctx.fillStyle = `rgba(240,220,160,${0.95 * rA})`; ctx.font = `800 ${11 * dpr}px ui-monospace, Menlo, monospace`;
        ctx.fillText(`${ring.cash7} CASH · 7D`, w - 6 * dpr, (14 + 3 * 13 + 3) * dpr);
        ctx.textAlign = "start";
      }

      // gold flash when money/bookings land
      const flp = (performance.now() - flashRef.current) / 1400;
      if (flp >= 0 && flp < 1) {
        ctx.beginPath(); ctx.arc(cx, cy, base * (1.1 + flp * 1.3), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,215,120,${(1 - flp) * 0.8})`; ctx.lineWidth = 3 * dpr * (1 - flp);
        ctx.shadowColor = "rgba(255,215,120,0.9)"; ctx.shadowBlur = 24 * dpr * (1 - flp); ctx.stroke(); ctx.shadowBlur = 0;
      }

      // ── ignition / power-down overlays on the orb itself ──
      if (fx.mode && fp < 1) {
        const ease = ease3(fp);
        if (fx.mode === "boot") {
          if (fp < BOOT_IGNITE) {
            // ENERGY GATHER: arc rings draw themselves in, a radar beam sweeps,
            // sparks converge on the core, a tick reticle charges up clockwise
            const gp = Math.max(0, (fp - 0.16) / (BOOT_IGNITE - 0.16));
            const ge = ease3(Math.min(1, gp));
            for (let i = 0; i < 3; i++) {
              const rr = base * (1.5 + i * 0.26);
              const rot = t * (0.014 - i * 0.004) * (i % 2 ? -1 : 1);
              ctx.beginPath(); ctx.arc(cx, cy, rr, rot, rot + ge * Math.PI * (1.1 + i * 0.25));
              ctx.strokeStyle = `rgba(201,168,76,${0.18 + ge * 0.4 - i * 0.08})`; ctx.lineWidth = (2.2 - i * 0.5) * dpr;
              ctx.shadowColor = "rgba(201,168,76,0.7)"; ctx.shadowBlur = 8 * dpr; ctx.stroke(); ctx.shadowBlur = 0;
            }
            const sa = t * 0.09;
            for (let i = 0; i < 16; i++) {
              const a = sa - i * 0.05;
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(a) * base * 0.5, cy + Math.sin(a) * base * 0.5);
              ctx.lineTo(cx + Math.cos(a) * base * 1.9 * ge, cy + Math.sin(a) * base * 1.9 * ge);
              ctx.strokeStyle = `rgba(240,225,170,${0.3 * (1 - i / 16) * ge})`; ctx.lineWidth = 1.2 * dpr; ctx.stroke();
            }
            for (let i = 0; i < 10; i++) {
              const cyc = gp * 2.6 + i * 0.618; const pr = cyc % 1;
              const ang = i * 2.399 + Math.floor(cyc) * 1.713;
              const dist = base * 2.2 * (1 - pr * pr);
              const px = cx + Math.cos(ang) * dist, py = cy + Math.sin(ang) * dist;
              const a2 = Math.sin(pr * Math.PI) * 0.9 * ge;
              ctx.beginPath(); ctx.moveTo(px, py);
              ctx.lineTo(cx + Math.cos(ang) * (dist + base * 0.25), cy + Math.sin(ang) * (dist + base * 0.25));
              ctx.strokeStyle = `rgba(201,168,76,${a2 * 0.5})`; ctx.lineWidth = 1.4 * dpr; ctx.stroke();
              ctx.beginPath(); ctx.arc(px, py, 1.8 * dpr, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(240,225,170,${a2})`; ctx.shadowColor = "rgba(240,225,170,0.9)"; ctx.shadowBlur = 9 * dpr; ctx.fill(); ctx.shadowBlur = 0;
            }
            const N2 = 24; const lit = Math.floor(ge * N2);
            for (let i = 0; i < N2; i++) {
              const ha = (i / N2) * Math.PI * 2 - Math.PI / 2;
              const on = i <= lit;
              const r0 = base * 2.0, r1 = r0 + base * (on ? 0.12 : 0.07);
              ctx.beginPath(); ctx.moveTo(cx + Math.cos(ha) * r0, cy + Math.sin(ha) * r0); ctx.lineTo(cx + Math.cos(ha) * r1, cy + Math.sin(ha) * r1);
              ctx.strokeStyle = on ? `rgba(240,225,170,${0.65 * ge})` : `rgba(201,168,76,${0.15 * ge})`;
              ctx.lineWidth = 2 * dpr; ctx.stroke();
            }
            // core charge readout
            ctx.font = `700 ${11 * dpr}px ui-monospace, Menlo, monospace`; ctx.textAlign = "center";
            ctx.fillStyle = `rgba(225,210,165,${0.75 * ge})`;
            ctx.fillText(`CORE ${String(Math.floor(ge * 100)).padStart(3, "0")}%`, cx, cy - base * 2.22);
            ctx.textAlign = "start";
          } else {
            // IGNITION on the orb canvas stays INSIDE the square: small rings
            // + the reticle flaring as it lets go. The big round flash and the
            // room-wide shockwaves are drawn on the full-screen bg canvas.
            const ip = (fp - BOOT_IGNITE) / (1 - BOOT_IGNITE); const ie = ease3(ip);
            for (let i = 0; i < 4; i++) {
              const rr = base * (0.4 + ie * (1.0 + i * 0.35));
              ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(201,168,76,${(1 - ip) * (0.65 - i * 0.13)})`; ctx.lineWidth = (2.6 - i * 0.5) * dpr; ctx.stroke();
            }
            for (let i = 0; i < 24; i++) {
              const ha = (i / 24) * Math.PI * 2 - Math.PI / 2;
              const r0 = base * (2.0 + ie * 0.18), r1 = r0 + base * 0.1;
              ctx.beginPath(); ctx.moveTo(cx + Math.cos(ha) * r0, cy + Math.sin(ha) * r0); ctx.lineTo(cx + Math.cos(ha) * r1, cy + Math.sin(ha) * r1);
              ctx.strokeStyle = `rgba(240,225,170,${(1 - ip) * 0.6})`; ctx.lineWidth = 2 * dpr; ctx.stroke();
            }
            if (ip < 0.25) {
              ctx.font = `700 ${11 * dpr}px ui-monospace, Menlo, monospace`; ctx.textAlign = "center";
              ctx.fillStyle = `rgba(240,225,170,${(1 - ip * 4) * 0.95})`;
              ctx.fillText("CORE 100%", cx, cy - base * 2.22);
              ctx.textAlign = "start";
            }
          }
        } else if (fx.mode === "wake") {
          const ie = ease3(fp);
          for (let i = 0; i < 4; i++) {
            const rr = base * (0.3 + ie * (1.3 + i * 0.5)) * 0.8;
            ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(201,168,76,${(1 - fp) * (0.6 - i * 0.12)})`; ctx.lineWidth = (2.6 - i * 0.5) * dpr; ctx.stroke();
          }
          const sa = fp * Math.PI * 6;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(sa) * base * 1.84 * ie, cy + Math.sin(sa) * base * 1.84 * ie);
          ctx.strokeStyle = `rgba(240,225,170,${(1 - fp) * 0.7})`; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
          for (let i = 0; i < 8; i++) {
            const ha = (i / 8) * Math.PI * 2 + Math.PI / 8;
            const r0 = base * 1.92 * ie, r1 = r0 + base * 0.18;
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(ha) * r0, cy + Math.sin(ha) * r0); ctx.lineTo(cx + Math.cos(ha) * r1, cy + Math.sin(ha) * r1);
            ctx.strokeStyle = `rgba(201,168,76,${(1 - fp) * 0.55})`; ctx.lineWidth = 2 * dpr; ctx.stroke();
          }
        } else {
          const rr = base * (2.0 * (1 - ease) + 0.15);
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(201,168,76,${0.5 * (1 - fp * 0.5)})`; ctx.lineWidth = 2 * dpr; ctx.stroke();
          // CRT-style collapse line
          ctx.beginPath(); ctx.moveTo(cx - base * 2.3 * (1 - ease), cy); ctx.lineTo(cx + base * 2.3 * (1 - ease), cy);
          ctx.strokeStyle = `rgba(240,225,170,${fp * 0.4})`; ctx.lineWidth = 1.4 * dpr; ctx.stroke();
        }
      }
      if (fx.mode && fp >= 1) fxRef.current = { mode: "", t0: 0, dur: 0 };

      t += 1; raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [tab]);

  // ── TRUE 3D ORB: WebGL volumetric core (swirling plasma inside a fake-lit
  // sphere, fresnel rim, breathing glow) driven by the same amp/tint/power
  // the 2D layer computes. The 2D canvas keeps rings/reticle/FX on top. ──
  useEffect(() => {
    if (tab !== "aura") return; // re-bind to the fresh canvas on tab return
    const c = glCanvas.current; if (!c) return;
    const gl = c.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const FS = `precision highp float;
uniform vec2 u_res;uniform float u_t;uniform float u_amp;uniform vec3 u_tint;uniform float u_pow;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p=p*2.13+17.7;a*=.5;}return v;}
void main(){
vec2 uv=(gl_FragCoord.xy-.5*u_res)/min(u_res.x,u_res.y);
float r=length(uv);
float R=.205*(1.+u_amp*.3);
vec2 sp=uv*(2.6+u_amp*1.4);
float sw=fbm(sp+vec2(u_t*.16,-u_t*.12)+fbm(sp*1.6+u_t*.07));
float depth=sqrt(max(0.,1.-(r/R)*(r/R)));
float plasma=sw*depth;
float rim=pow(smoothstep(R*1.06,R*.96,r)*smoothstep(R*.66,R*.96,r),1.4);
float glow=r>R?exp(-(r-R)*8.5):0.;
vec3 tint=u_tint/255.;
vec3 col=tint*.6*plasma*1.7+vec3(.98,.95,.86)*pow(plasma,3.)*1.35;
col+=tint*rim*(.85+u_amp*.7);
col+=tint*glow*(.32+u_amp*.5);
col*=u_pow;
float a=clamp(depth*(.25+plasma)+rim+glow*.55,0.,1.)*u_pow;
gl_FragColor=vec4(col,a);}`;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res"), uT = gl.getUniformLocation(prog, "u_t"),
      uAmp = gl.getUniformLocation(prog, "u_amp"), uTint = gl.getUniformLocation(prog, "u_tint"), uPow = gl.getUniformLocation(prog, "u_pow");
    glOkRef.current = true;
    let raf2 = 0; const gt0 = performance.now();
    const drawGl = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth * dpr, hgt = c.clientHeight * dpr;
      if (c.width !== w || c.height !== hgt) { c.width = w; c.height = hgt; gl.viewport(0, 0, w, hgt); }
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, w, hgt);
      gl.uniform1f(uT, (performance.now() - gt0) / 1000);
      gl.uniform1f(uAmp, ampRef.current);
      const tn = tintRef.current; gl.uniform3f(uTint, tn[0], tn[1], tn[2]);
      gl.uniform1f(uPow, powerRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf2 = requestAnimationFrame(drawGl);
    };
    raf2 = requestAnimationFrame(drawGl);
    return () => { cancelAnimationFrame(raf2); glOkRef.current = false; };
  }, [tab]);

  // ── speak ──
  const playTts = useCallback(async (url: string, after: () => void, onFail?: () => void) => {
    let a = audioRef.current; if (!a) { a = new Audio(); audioRef.current = a; }
    try {
      const ac = ensureAC(); if (ac.state === "suspended") await ac.resume();
      if (!ttsSrcRef.current) { ttsSrcRef.current = ac.createMediaElementSource(a); const an = ac.createAnalyser(); an.fftSize = 128; ttsSrcRef.current.connect(an); an.connect(ac.destination); ttsAnalyser.current = an; }
    } catch { /* analyser optional */ }
    speakingLock.current = true;
    a.src = url; setOrb("speaking");
    const done = () => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      speakingLock.current = false;
      after();
    };
    const fail = () => { speakingLock.current = false; (onFail ?? after)(); };
    a.onended = done;
    a.onerror = fail;
    await a.play().catch(() => fail());
  }, [ensureAC]);

  const speak = useCallback(async (text: string, onDone?: () => void) => {
    const key = keyRef.current; if (!key || !text) return;
    const after = onDone ?? (() => { bump(); beginCaptureRef.current(); });
    // stream straight from the GET endpoint: he starts TALKING as soon as the
    // first audio chunks arrive instead of waiting for the full mp3
    const url = `${apiBase}/speak?k=${encodeURIComponent(key)}&text=${encodeURIComponent(text.slice(0, 1900))}`;
    await playTts(url, after, () => { setNote("röst ej ansluten ännu"); setOrb("idle"); startMic(); });
  }, [bump, playTts, startMic]);

  // ── panels: ADDITIVE — new cards pixel-in alongside the old ones; only an
  // explicit clear (or hitting the 6-slot cap, oldest-first) dissolves cards ──
  const replacePanels = useCallback((fresh: Panel[], clear: boolean, big = false) => {
    const slots = big ? CINE_SLOTS : PANEL_SLOTS;
    const cap = slots.length;
    if (panelSwap.current) { clearTimeout(panelSwap.current); panelSwap.current = null; }
    if (clear) {
      const placeAll = () => {
        if (fresh.length) sfx("pixin");
        setPanels(fresh.slice(0, cap).map((p, i) => ({ ...p, id: panelId.current++, x: slots[i].x, y: slots[i].y })));
      };
      if (!panelsLive.current.length) { placeAll(); return; }
      sfx("pixout");
      setPanels((ps) => ps.map((p) => ({ ...p, leaving: true })));
      panelSwap.current = setTimeout(placeAll, 520);
      return;
    }
    if (!fresh.length) return; // additive + nothing new → the screen stays as is
    const keep = panelsLive.current.filter((p) => !p.leaving);
    const overflow = Math.max(0, keep.length + Math.min(fresh.length, cap) - cap);
    const evict = new Set(keep.slice(0, overflow).map((p) => p.id));
    const used = new Set(keep.filter((p) => !evict.has(p.id)).map((p) => `${p.x},${p.y}`));
    const free = slots.filter((s) => !used.has(`${s.x},${s.y}`));
    const placed = fresh.slice(0, cap).map((p, i) => {
      const slot = free[i] ?? slots[i % slots.length];
      return { ...p, id: panelId.current++, x: slot.x, y: slot.y };
    });
    if (evict.size) sfx("pixout");
    sfx("pixin");
    setPanels((ps) => [...ps.map((p) => (evict.has(p.id) ? { ...p, leaving: true } : p)), ...placed]);
    if (evict.size) panelSwap.current = setTimeout(() => setPanels((ps) => ps.filter((p) => !p.leaving)), 540);
  }, [sfx]);

  /** Tiny pre-fetched ack that plays if the brain is taking a moment — the
   *  line FITS what was asked (lookup vs action); control/small-talk skip it. */
  const playAck = useCallback((cat: "ask" | "act") => {
    const urls = ackUrls.current[cat]; if (!urls.length) return;
    let a = ackAudioRef.current; if (!a) { a = new Audio(); ackAudioRef.current = a; }
    a.src = urls[(Math.random() * urls.length) | 0];
    a.play().catch(() => { /* ack is a bonus */ });
  }, []);

  // ── PITCH MODE: a ~75s self-running showcase reel. Aura speaks + materializes
  //    the panels + cinematics on its own, beat by beat, using showcase data only.
  //    Forced into demo mode by the caller so it can never run on real numbers. ──
  const pitchRef = useRef(false);

  const runAutoConv = useCallback(async (script: { role: "lead" | "setter"; text: string }[]): Promise<void> => {
    autoConvRef.current = true;
    setAutoConvMsgs([]);
    setDemoChatOpen(true);
    for (const msg of script) {
      if (!autoConvRef.current) break;
      // lead types faster, setter "thinks" a bit longer
      const delay = msg.role === "lead" ? 1800 : 2400;
      await new Promise<void>((r) => setTimeout(r, delay));
      if (!autoConvRef.current) break;
      setAutoConvMsgs((prev) => [...prev, msg]);
    }
    // linger on last message so viewer can read it
    await new Promise<void>((r) => setTimeout(r, 1800));
  }, []);

  const runPitch = useCallback(async (kickoff: string) => {
    pitchRef.current = true;
    autoConvRef.current = false;
    setAutoConvMsgs([]);
    setDemoChatOpen(false);
    setCinema(true);

    const CONV: { role: "lead" | "setter"; text: string }[] = [
      { role: "lead",   text: "Hej! Såg era reels, gör ni lip fillers?" },
      { role: "setter", text: "Hej! Ja det gör vi 😊 Har du gjort det förut?" },
      { role: "lead",   text: "Nej första gången, lite nervös att det ska se konstigt ut..." },
      { role: "setter", text: "Den oron hör vi ofta! Målet är alltid att det ska se naturligt ut — ingen ska kunna se att du gjort något, bara att du ser bra ut." },
      { role: "lead",   text: "Gör det ont?" },
      { role: "setter", text: "Vi använder bedövningskräm så det är väldigt lite. De flesta tycker det går bra 🙏" },
      { role: "setter", text: "Passar det dig denna vecka eller nästa?" },
      { role: "lead",   text: "Nästa vecka, gärna eftermiddag" },
      { role: "setter", text: "Perfekt — jag bokar in dig tisdag 14.00 ✅" },
      { role: "setter", text: "Du får en SMS-bekräftelse med all info. Vi ses!" },
      { role: "lead",   text: "Toppen, tack!" },
    ];

    type Beat = { say: string; panels?: Panel[]; rings?: boolean; autoConv?: boolean; conv?: { role: "lead" | "setter"; text: string }[]; closeConv?: boolean; hold?: number; switchTab?: Tab };
    const beats: Beat[] = config?.pitchBeats ? (typeof config.pitchBeats === "function" ? (config.pitchBeats(kickoff) as Beat[]) : (config.pitchBeats as Beat[])) : [
      {
        say: kickoff || "Okej — låt mig visa dig exakt vad som händer i din klinik varje dag medan du är mitt i en behandling.",
        rings: true,
        panels: [{ kind: "metric", title: "INTÄKT · 30 DAGAR", value: "149 200 kr", sub: "47 behandlingar bokade automatiskt", accent: true }],
        hold: 800,
      },
      {
        say: "Varje kväll, varje helg, varje gång du har handskar på — trillar det in DMs. Någon undrar om botox. Någon vill boka. Du ser dem inte förrän tre timmar senare. Och då är de redan bokade hos konkurrenten. Det händer varje dag.",
        panels: [{ kind: "stats", title: "MEDAN DU BEHANDLAR", items: [{ label: "Svarstid utan AI", value: "3–5 tim" }, { label: "Förlorade kunder/mån", value: "~35" }, { label: "Intäkt du missar", value: "~68 000 kr" }, { label: "Jag svarar på", value: "9 sek" }] }],
        hold: 800,
      },
      {
        say: "Jag svarar inom nio sekunder. Oavsett om det är tisdag eftermiddag eller lördag klockan elva på kvällen. Ställer rätt frågor, bygger förtroende, och stänger bokningen — medan du sover.",
        panels: [{ kind: "funnel", title: "SENASTE 30 DAGARNA", rows: [{ label: "DMs in", value: 312 }, { label: "Engagerade", value: 214 }, { label: "Intresserade av behandling", value: 94 }, { label: "Bokade möten", value: 47 }] }],
        hold: 800,
      },
      {
        say: "Så här ser det ut i praktiken. En kund som undrade om lip fillers. Elva meddelanden senare — bokat möte, bekräftelse skickad. Noll manuellt arbete.",
        autoConv: true,
        hold: 400,
      },
      {
        say: "Och de som inte svarade direkt? Dem följer jag upp automatiskt — dag tre, dag sju, dag fjorton. Mjukt och naturligt. Mer än hälften bokar till slut. Leads du annars hade tappat för alltid.",
        closeConv: true,
        panels: [{ kind: "list", title: "AUTOMATISKA UPPFÖLJNINGAR", rows: [{ primary: "Leads återaktiverade denna vecka", secondary: "11" }, { primary: "Ombokade efter no-show", secondary: "5" }, { primary: "Påminnelser skickade idag", secondary: "28" }, { primary: "Kunder räddade denna månad", secondary: "19" }] }],
        hold: 800,
      },
      {
        say: "Bokar någon men dyker inte upp? Jag skickar påminnelse dagen innan — och om de ändå missar, bokar jag om dem automatiskt. Du förlorar inte intäkten, du förlorar inte tiden.",
        panels: [{ kind: "list", title: "NO-SHOW HANTERAS AUTO", rows: [{ primary: "Påminnelse 24h innan", secondary: "✓ auto" }, { primary: "Påminnelse 2h innan", secondary: "✓ auto" }, { primary: "Ombokning vid avhopp", secondary: "✓ auto" }, { primary: "No-show rate", secondary: "↓ 67%" }] }],
        hold: 800,
      },
      {
        say: "Och det stannar inte vid första bokningen. En kund som gjort botox får ett meddelande tre månader senare när det är dags att förnya. Någon som gjort ansiktsbehandling erbjuds microneedling. Återkommande kunder — helt automatiskt.",
        panels: [{ kind: "list", title: "AUTOMATISK MERFÖRSÄLJNING", rows: [{ primary: "Botox → förnyelsepåminnelse", secondary: "efter 4 mån" }, { primary: "Fillers → uppgradering", secondary: "efter 6 mån" }, { primary: "Ansiktsbehandling → microneedling", secondary: "erbjudande" }, { primary: "Återkommande kunder", secondary: "61%" }] }],
        hold: 800,
      },
      {
        say: "Du ser allt i realtid. Förra månaden: 312 inkommande kontakter. 214 svarade. 47 bokade besök. 149 000 kronor i intäkt — genererat av systemet. Titta här.",
        rings: true,
        switchTab: "dashboard",
        panels: [
          { kind: "bars", title: "BOKNINGAR VIA DM · 30 DAGAR", rows: [{ label: "Botox", value: 94 }, { label: "Fillers", value: 81 }, { label: "Laser", value: 47 }, { label: "Microneedling", value: 25 }] },
          { kind: "stats", title: "NYCKELTAL", items: [{ label: "Svarstid", value: "9s" }, { label: "Konvertering", value: "34%" }, { label: "Intäkt / bokning", value: "3 800 kr" }, { label: "ROI", value: "14x" }] },
        ],
        hold: 3000,
      },
      {
        say: "Kliniken som har det här vaknar till ett fullt schema. Utan att ha skrivit ett enda DM kvällen innan.",
        switchTab: "aura",
        panels: [{ kind: "metric", title: "SKILLNADEN", value: "+149 000 kr", sub: "per månad · automatiskt · utan extra personal", accent: true }],
        hold: 1000,
      },
      {
        say: "Kliniken som har det här behöver aldrig mer jaga leads manuellt. Systemet sköter det — dygnet runt.",
        rings: true,
        panels: [{ kind: "stats", title: "GRATIS I 7 DAGAR", items: [{ label: "Uppsättningstid", value: "24h" }, { label: "Bindningstid", value: "Ingen" }, { label: "Installation av dig", value: "Noll" }, { label: "Garanterat resultat", value: "Ja" }] }],
        hold: 1000,
      },
    ] as Beat[];

    const sayAndWait = (text: string) =>
      Promise.race([
        new Promise<void>((res) => speak(text, res)),
        new Promise<void>((res) => setTimeout(res, 18000)),
      ]);

    for (const b of beats) {
      if (!pitchRef.current) return;
      if (b.closeConv) { autoConvRef.current = false; setDemoChatOpen(false); }
      if (b.switchTab) setTab(b.switchTab);
      if (b.panels) replacePanels(b.panels, true, true);
      if (b.rings) ringsAt.current = performance.now();
      setSaid(b.say);

      // 1. speak the line and wait until it's done
      await sayAndWait(b.say);
      if (!pitchRef.current) return;

      // 2. if this beat triggers an auto-conversation, play it AFTER speech finishes
      if (b.autoConv) {
        await new Promise<void>((res) => setTimeout(res, 600));
        await runAutoConv(b.conv ?? CONV);
        if (!pitchRef.current) return;
      }

      // 3. optional extra pause between beats
      const pause = b.hold ?? 1200;
      await new Promise<void>((res) => setTimeout(res, pause));
    }
    pitchRef.current = false;
    autoConvRef.current = false;
    setCinema(false);
    setDemoChatOpen(false);
    setAutoConvMsgs([]);
    setSaid("Det var demot. Säg 'avsluta demo' för att gå tillbaka till riktiga siffror.");
    startMic();
  }, [speak, replacePanels, startMic, runAutoConv]);

  // ── send ──
  const send = useCallback(async (text: string) => {
    const msg = text.trim(); const key = keyRef.current; if (!msg || !key) return;
    pitchRef.current = false; // any new command cancels a running pitch reel
    bump(); setHeard(msg); setOrb("thinking");
    if (ackTimer.current) clearTimeout(ackTimer.current);
    const ackCat = ackCategory(msg); // null → no ack (control / small talk)
    if (ackCat) ackTimer.current = setTimeout(() => playAck(ackCat), ACK_AFTER_MS);
    histRef.current.push({ role: "user", content: msg });
    try {
      const res = await fetch(`${apiBase}/chat?k=${encodeURIComponent(key)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: msg, history: histRef.current.slice(-8), demo: demoRef.current }) });
      const data = (await res.json()) as { speech?: string; panels?: Panel[]; clear?: boolean; rings?: boolean; power?: "sleep" | "off" | null; demo?: boolean | null; theme?: string | null; demoChat?: boolean; pitch?: boolean };
      if (ackTimer.current) clearTimeout(ackTimer.current);
      try { ackAudioRef.current?.pause(); } catch { /* */ }
      // runtime control signals from the brain
      if (data.theme) { const t = resolveTheme(data.theme); if (t) applyTheme(t); }
      if (data.demo === true || data.demo === false) applyDemo(data.demo);
      // PITCH: kick off the self-running showcase reel (always forced into demo).
      if (data.pitch) { applyDemo(true); histRef.current.push({ role: "assistant", content: data.speech || "(pitch)" }); runPitch(data.speech || ""); return; }
      if (data.demoChat) setDemoChatOpen(true);
      const speech = data.speech || "Klart.";
      histRef.current.push({ role: "assistant", content: speech }); setSaid(speech);
      // CINEMA: a numbers-heavy answer takes over the room — orb pulls up,
      // the data materializes large front and center (and is still draggable)
      const cine = Boolean(data.rings) && (data.panels ?? []).length >= 2;
      setCinema(cine);
      // panels are ADDITIVE — the screen wipes only via clear:true (or a cinema takeover)
      replacePanels(data.panels ?? [], data.clear === true || cine, cine);
      if (data.rings) ringsAt.current = performance.now();
      if (data.power === "off") { speak(speech, () => powerOff()); return; }
      if (data.power === "sleep") { speak(speech, () => goSleep()); return; }
      speak(speech);
    } catch {
      if (ackTimer.current) clearTimeout(ackTimer.current);
      setSaid("Tappade anslutningen — försök igen?"); setOrb("idle"); startMic();
    }
  }, [speak, bump, startMic, powerOff, goSleep, replacePanels, playAck, applyTheme, applyDemo, runPitch]);

  // ── capture window (speech recognition; mic stream is OFF during this) ──
  const teardownSR = useCallback(() => {
    const sr = srRef.current;
    if (sr) { sr.onend = null; sr.onresult = null; try { sr.stop(); } catch { /* */ } srRef.current = null; }
    if (silence.current) { clearTimeout(silence.current); silence.current = null; }
    if (maxWin.current) { clearTimeout(maxWin.current); maxWin.current = null; }
  }, []);

  const fireCommand = useCallback((cmd: string) => {
    teardownSR(); micState.current = "off"; captureBuf.current = "";
    convoUntil.current = Date.now() + CONVO_HOLD_MS; // we're in a conversation — keep the ear hot
    send(cmd);
  }, [teardownSR, send]);

  const endCapture = useCallback(() => {
    teardownSR(); micState.current = "off"; captureBuf.current = "";
    // mid-conversation the ear stays HOT: nothing heard in the window, but we
    // re-open the mic instead of demanding a clap — convo dies down naturally
    if (onlineRef.current && Date.now() < convoUntil.current) {
      setTimeout(() => { if (micState.current === "off" && orbRef.current !== "speaking" && orbRef.current !== "thinking") beginCaptureRef.current(); }, 60);
      return;
    }
    if (orbRef.current === "listening") setOrb("idle");
    bump(); startMic();
  }, [teardownSR, bump, startMic]);

  const armSilence = useCallback(() => {
    if (silence.current) clearTimeout(silence.current);
    silence.current = setTimeout(() => {
      const cmd = captureBuf.current.trim();
      if (cmd.length >= 2 && micState.current === "capturing") fireCommand(cmd);
    }, endpointDelay(captureBuf.current, lastFinalRef.current));
  }, [fireCommand]);

  const beginCapture = useCallback(() => {
    if (!onlineRef.current || micState.current === "capturing") return;
    stopMic(); teardownSR();
    micState.current = "capturing"; captureBuf.current = "";
    setOrb("listening"); setHeard(""); bump();
    const sr = getSR();
    if (!sr) { setSrSupported(false); micState.current = "off"; setOrb("idle"); startMic(); return; }
    sr.continuous = true; sr.interimResults = true; sr.lang = "sv-SE";
    sr.onresult = (e) => {
      let full = ""; let lastFinal = false;
      for (let i = 0; i < e.results.length; i++) { full += e.results[i][0].transcript + " "; lastFinal = e.results[i].isFinal; }
      full = full.trim(); if (!full) return;
      captureBuf.current = full; lastFinalRef.current = lastFinal; setHeard(full); bump(); armSilence();
    };
    sr.onerror = (ev) => { if (ev.error === "not-allowed" || ev.error === "service-not-allowed") setNote("mikrofon blockerad — tillåt åtkomst"); };
    sr.onend = () => { if (micState.current === "capturing" && srRef.current === sr) { try { sr.start(); } catch { /* */ } } };
    srRef.current = sr;
    try { sr.start(); } catch { /* */ }
    maxWin.current = setTimeout(() => {
      if (micState.current !== "capturing") return;
      const cmd = captureBuf.current.trim();
      if (cmd.length >= 2) fireCommand(cmd); else endCapture();
    }, LISTEN_WINDOW_MS);
  }, [stopMic, teardownSR, bump, startMic, armSilence, fireCommand, endCapture]);
  beginCaptureRef.current = beginCapture;

  // ── boot ──
  // the greeting TTS is fetched DURING the cinematic (the fetch is the slow
  // part) so the line lands the moment the ignition settles
  const prefetchGreeting = useCallback(() => {
    const key = keyRef.current; if (!key) { greetUrl.current = null; return; }
    greetUrl.current = (async () => {
      try {
        const res = await fetch(`${apiBase}/speak?k=${encodeURIComponent(key)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: nextGreeting() }) });
        if (!res.ok) return null;
        return URL.createObjectURL(await res.blob());
      } catch { return null; }
    })();
  }, []);

  const playGreeting = useCallback(async () => {
    const pending = greetUrl.current; greetUrl.current = null;
    if (!pending) return;
    const url = await pending; if (!url) return;
    const fx = fxModeRef.current;
    if (!onlineRef.current || orbRef.current !== "idle" || micState.current === "capturing" || speakingLock.current || fx === "off" || fx === "down") { URL.revokeObjectURL(url); return; }
    // after the hello: back to idle with the clap ear open — no auto-listen
    playTts(url, () => { if (orbRef.current === "speaking") setOrb("idle"); bump(); });
  }, [playTts, bump]);

  const bootUp = useCallback(() => {
    if (onlineRef.current) return;
    onlineRef.current = true; setOnline(true); setNote("");
    try { const ac = ensureAC(); if (ac.state === "suspended") ac.resume().catch(() => { /* */ }); } catch { /* */ }
    sfx("boot");
    playFx("boot", BOOT_MS, "SYSTEM ONLINE", Math.round(BOOT_MS * BOOT_IGNITE));
    startMic();
    prefetchGreeting();
    // pre-fetch both ack sets once — instant, context-fitting ack later
    if (!ackUrls.current.ask.length && keyRef.current) {
      (["ask", "act"] as const).forEach((cat) => ACK_SETS[cat].forEach(async (line) => {
        try {
          const res = await fetch(`${apiBase}/speak?k=${encodeURIComponent(keyRef.current)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: line }) });
          if (res.ok) ackUrls.current[cat].push(URL.createObjectURL(await res.blob()));
        } catch { /* acks are a bonus */ }
      }));
    }
    if (bootTimer.current) clearTimeout(bootTimer.current);
    bootTimer.current = setTimeout(() => { bump(); playGreeting(); }, BOOT_MS);
  }, [ensureAC, sfx, playFx, startMic, bump, prefetchGreeting, playGreeting]);
  bootUpRef.current = bootUp;

  const skipBoot = useCallback(() => {
    if (fxModeRef.current !== "boot") return;
    if (bootTimer.current) clearTimeout(bootTimer.current);
    labelTimers.current.forEach(clearTimeout); labelTimers.current = [];
    stopScramble();
    fxRef.current = { mode: "", t0: 0, dur: 0 };
    setFxMode(""); setFxLabel(""); bump();
    playGreeting(); // skipping the cinematic doesn't skip the hello — it's one second
  }, [bump, playGreeting, stopScramble]);

  // auto-boot on load when the mic permission is already granted (returning visits)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perms = navigator.permissions;
        if (!perms?.query) return;
        const st = await perms.query({ name: "microphone" as PermissionName });
        if (!cancelled && st.state === "granted") bootUpRef.current();
      } catch { /* no auto-boot — tap gate stays */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const tapOrb = useCallback(async () => {
    if (fxModeRef.current === "boot") { skipBoot(); return; }
    if (fxModeRef.current === "off" || fxModeRef.current === "down") return;
    if (!onlineRef.current) { bootUp(); return; }
    bump();
    if (orbRef.current === "speaking" || speakingLock.current) {
      try { audioRef.current?.pause(); } catch { /* */ }
      speakingLock.current = false;
      beginCapture(); return;
    }
    if (orbRef.current === "thinking") return;
    if (micState.current === "capturing") return;
    if (orbRef.current === "asleep") { sfx("wake"); playFx("wake", 1200, ""); }
    beginCapture();
  }, [skipBoot, bootUp, beginCapture, bump, sfx, playFx]);

  // ── live pulse → ring data + ripples ──
  useEffect(() => {
    if (!online) return;
    lastPulseRef.current = new Date().toISOString();
    const tick = async () => {
      const key = keyRef.current; if (!key || demoRef.current) return; // demo: never poll real data
      try {
        const res = await fetch(`${apiBase}/pulse?k=${encodeURIComponent(key)}&since=${encodeURIComponent(lastPulseRef.current)}`);
        if (!res.ok) return;
        const d = (await res.json()) as { now?: string; ring?: Ring; recent?: { t: string; at: string; amount?: number }[] };
        if (d.now) lastPulseRef.current = d.now;
        if (d.ring) ringRef.current = d.ring;
        const rec = (d.recent ?? []).slice(0, 8);
        rec.forEach((ev, i) => ripplesRef.current.push({ ang: Math.random() * Math.PI * 2, t0: performance.now() + i * 350, kind: ev.t }));
        if (ripplesRef.current.length > 40) ripplesRef.current = ripplesRef.current.slice(-40);
        if (rec.some((e) => e.t === "booked")) { flashRef.current = performance.now() + 400; ringsAt.current = performance.now() + 400; }
        // CASH LANDS → the whole room reacts: gold flare, rings light, a rising
        // chime, and the cinematic deal-closed takeover with the real amount.
        const cash = rec.filter((e) => e.t === "cash" && (e.amount ?? 0) > 0);
        if (cash.length) {
          const top = cash.reduce((m, e) => ((e.amount ?? 0) > (m.amount ?? 0) ? e : m), cash[0]);
          flashRef.current = performance.now() + 500;
          ringsAt.current = performance.now() + 500;
          sfx("wake");
          setDealClose({ amount: top.amount ?? 0, at: Date.now() });
        }
      } catch { /* */ }
    };
    tick();
    const iv = setInterval(tick, PULSE_EVERY_MS);
    return () => clearInterval(iv);
  }, [online]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    teardownSR(); stopMic();
    if (bootTimer.current) clearTimeout(bootTimer.current);
    if (panelSwap.current) clearTimeout(panelSwap.current);
    if (scrambleIv.current) clearInterval(scrambleIv.current);
    labelTimers.current.forEach(clearTimeout);
  }, [teardownSR, stopMic]);

  // Deal-closed takeover: announce it out loud if Aura is idle, then auto-clear.
  useEffect(() => {
    if (!dealClose) return;
    if (orbRef.current === "idle") {
      const m = Math.round(dealClose.amount).toLocaleString("sv-SE") + " kr";
      speak(`Boom. ${m} just landed. Keep it coming, boss.`);
    }
    const t = setTimeout(() => setDealClose(null), 6500);
    return () => clearTimeout(t);
  }, [dealClose, speak]);

  const dismiss = (id: number) => {
    sfx("pixout");
    setPanels((ps) => ps.map((p) => (p.id === id ? { ...p, leaving: true } : p)));
    setTimeout(() => setPanels((ps) => ps.filter((p) => p.id !== id)), 520);
  };
  const asleep = orb === "asleep";
  const dcAmount = dealClose ? Math.round(dealClose.amount).toLocaleString("sv-SE") + " kr" : "";

  return (
    <div className={`hq-root tab-${tab} ${asleep ? "asleep" : ""} ${!online ? "off" : ""} ${cinema ? "cinema" : ""}`} onPointerDown={fxMode === "boot" ? skipBoot : undefined}>
      <canvas ref={bgCanvas} className="hq-bg" />
      <div className="hq-veil" data-on={asleep && tab === "aura"} />
      {fxMode === "boot" && <div className="hq-flash" />}
      <span className="hq-corner tl" /><span className="hq-corner tr" /><span className="hq-corner bl" /><span className="hq-corner br" />
      <style>{themeCss(themeRgb)}</style>
      {demo && <div className="hq-demobadge">DEMO-LÄGE — demodata, inga riktiga siffror</div>}
      {dealClose && (
        <div className="hq-dealclose" onClick={() => setDealClose(null)} key={dealClose.at}>
          <div className="hq-dc-ring" />
          <div className="hq-dc-inner">
            <div className="hq-dc-label">INBETALNING</div>
            <div className="hq-dc-amount">{dcAmount}</div>
            <div className="hq-dc-sub">just inkommit · tryck för att stänga</div>
          </div>
        </div>
      )}
      {demoChatOpen && <DemoDM accessKey={keyRef.current} apiBase={apiBase} onClose={() => { setDemoChatOpen(false); autoConvRef.current = false; setAutoConvMsgs([]); }} onTick={() => sfx("tick")} autoMsgs={autoConvMsgs} />}
      <HudStatus online={online} asleep={asleep} ringRef={ringRef} />

      <header className="hq-top">
        <span className="hq-wm">
          <img src="/logo.svg" alt="Rekvo" style={{ height: 56, display: "block" }} />
        </span>
        <nav className="hq-tabs">
          <button className={`hq-tab ${tab === "aura" ? "on" : ""}`} onMouseEnter={() => sfx("tick")} onClick={() => setTab("aura")}>AURA</button>
          <button className={`hq-tab ${tab === "dashboard" ? "on" : ""}`} onMouseEnter={() => sfx("tick")} onClick={() => setTab("dashboard")}>{BRAND_NAME}</button>
          {!hideTabs.has("crm") && <button className={`hq-tab ${tab === "crm" ? "on" : ""}`} onMouseEnter={() => sfx("tick")} onClick={() => setTab("crm")}>CRM</button>}
          {!hideTabs.has("kalender") && <button className={`hq-tab ${tab === "kalender" ? "on" : ""}`} onMouseEnter={() => sfx("tick")} onClick={() => setTab("kalender")}>KALENDER</button>}
          <a className="hq-tab" href="/test-chat" target="_blank" rel="noopener noreferrer" onMouseEnter={() => sfx("tick")} style={{ textDecoration: "none" }}>TEST AI</a>
        </nav>
        <span className={`hq-state s-${orb}`}>{online ? `● ${orb === "idle" ? "väntar" : orb === "listening" ? "lyssnar" : orb === "thinking" ? "tänker" : orb === "speaking" ? "talar" : "viloläge"}` : "○ offline"}</span>
      </header>

      {tab === "aura" && (
        <div className={`hq-stage ${fxMode === "boot" ? "shake" : ""}`}>
          {fxMode === "boot" && <BootChecks />}
          {fxLabel && <div className={`hq-fxlabel ${fxMode === "boot" || fxLabel === "SYSTEMS ONLINE" ? "big" : ""}`}>{fxLabel}</div>}
          {panels.map((p, i) => (
            <PanelCard key={p.id} panel={p} index={i} cine={cinema} onHover={() => sfx("tick")} onDismiss={() => dismiss(p.id)} onMove={(x, y) => setPanels((ps) => ps.map((q) => q.id === p.id ? { ...q, x, y } : q))} />
          ))}

          <div className="hq-orbwrap" onClick={tapOrb} role="button" title={online ? "klappa eller tryck för att prata" : "tryck för att starta"}>
            <canvas ref={glCanvas} className="hq-orb gl" />
            <canvas ref={orbCanvas} className="hq-orb top" />
            {!online && fxMode !== "off" && <div className="hq-wake">tryck för att starta</div>}
            {online && fxMode === "boot" && <div className="hq-wake dim">tryck för att hoppa över</div>}
            {online && fxMode !== "boot" && orb === "asleep" && <div className="hq-wake sleep">viloläge — klappa eller tryck för att väcka</div>}
            {online && fxMode !== "boot" && orb === "idle" && <div className="hq-wake dim">{srSupported ? "klappa eller tryck för att prata" : "röstinput kräver Chrome"}</div>}
            {online && orb === "listening" && <div className="hq-wake live">{heard ? heard : "lyssnar…"}</div>}
            {online && orb === "thinking" && <div className="hq-wake live">…</div>}
          </div>

          {said && orb !== "listening" && !asleep && <div className="hq-said">{said}</div>}
          {note && !asleep && <div className="hq-note">{note}</div>}

          {online && !asleep && (
            <form className="hq-textinput" onSubmit={(e) => { e.preventDefault(); const msg = textInput.trim(); if (!msg || orb === "thinking") return; setTextInput(""); send(msg); }}>
              <input
                className="hq-textinput-field"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="skriv ett meddelande…"
                disabled={orb === "thinking"}
                autoComplete="off"
              />
              <button type="submit" className="hq-textinput-btn" disabled={!textInput.trim() || orb === "thinking"}>Skicka</button>
            </form>
          )}
        </div>
      )}

      {tab === "dashboard" && (
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div className="hq-frame" style={{ flex: 1 }}>
            <iframe src={dashboardPath} title={`${BRAND_NAME} Dashboard`} className="hq-iframe" />
          </div>
        </div>
      )}
      {tab === "crm" && (
        <div style={{ position: "absolute", inset: "60px 14px 14px 14px", display: "flex", gap: 12, zIndex: 3 }}>
          <div style={{ flex: 1, border: "1px solid rgba(201,168,76,0.25)", borderRadius: 12, overflow: "hidden", boxShadow: "0 0 40px rgba(201,168,76,0.08)" }}>
            <iframe src={`/crm?k=${KEY()}`} title="CRM" className="hq-iframe" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
          </div>
          <TodoWidget />
        </div>
      )}
      {tab === "kalender" && <div className="hq-frame"><iframe src={`/kalender?k=${KEY()}`} title="Kalender" className="hq-iframe" /></div>}
    </div>
  );
}

interface ListItem { id: string; text: string; booked: boolean }

function MiniList({ label, lsKey, placeholder, showBooked, onItemsChange }: { label: string; lsKey: string; placeholder: string; showBooked?: boolean; onItemsChange?: (items: ListItem[]) => void }) {
  const [items, setItems] = React.useState<ListItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) ?? "[]"); } catch { return []; }
  });
  const [input, setInput] = React.useState("");
  const dragIdx = React.useRef<number | null>(null);
  const [dragOver, setDragOver] = React.useState<number | null>(null);

  function save(next: ListItem[]) {
    setItems(next);
    try { localStorage.setItem(lsKey, JSON.stringify(next)); } catch { /**/ }
    onItemsChange?.(next);
  }
  function add() { const t = input.trim(); if (!t) return; save([{ id: Date.now().toString(), text: t, booked: false }, ...items]); setInput(""); }
  function toggle(id: string) { save(items.map((i) => i.id === id ? { ...i, booked: !i.booked } : i)); }
  function remove(id: string) { save(items.filter((i) => i.id !== id)); }

  const active = items.filter((i) => !i.booked);
  const booked = items.filter((i) => i.booked);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.14em", fontWeight: 700 }}>{label}</span>
      <div style={{ display: "flex", gap: 5 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder={placeholder}
          style={{ flex: 1, background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, color: "#e8e0cc", fontSize: 12, padding: "7px 10px", outline: "none", fontFamily: "ui-sans-serif,system-ui,sans-serif" }} />
        <button onClick={add} style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 6, color: "#c9a84c", fontSize: 18, padding: "2px 11px", cursor: "pointer", lineHeight: 1 }}>+</button>
      </div>
      {active.length === 0 && booked.length === 0 && <span style={{ color: "rgba(201,168,76,0.25)", fontSize: 11 }}>Tom</span>}
      {active.map((item, idx) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => { dragIdx.current = idx; }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
          onDrop={() => {
            if (dragIdx.current === null || dragIdx.current === idx) { setDragOver(null); return; }
            const next = [...active];
            const [moved] = next.splice(dragIdx.current, 1);
            next.splice(idx, 0, moved);
            dragIdx.current = null; setDragOver(null);
            save([...next, ...booked]);
          }}
          onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
            background: dragOver === idx ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.05)",
            borderRadius: 6, border: `1px solid ${dragOver === idx ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.12)"}`,
            transition: "background 0.15s, border-color 0.15s",
          }}
        >
          {/* drag handle */}
          <span style={{ color: "#c9a84c", fontSize: 14, flexShrink: 0, cursor: "grab", userSelect: "none", opacity: 0.7 }}>☰</span>
          {showBooked && (
            <button onClick={() => toggle(item.id)} title="Markera som bokad" style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: "1.5px solid rgba(201,168,76,0.5)", background: "transparent", cursor: "pointer", padding: 0,
            }} />
          )}
          <span style={{ flex: 1, color: "#e8e0cc", fontSize: 12, lineHeight: 1.4, wordBreak: "break-word" }}>{item.text}</span>
          <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: "rgba(201,168,76,0.3)", cursor: "pointer", fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
        </div>
      ))}
      {showBooked && booked.length > 0 && (
        <>
          <span style={{ color: "rgba(201,168,76,0.25)", fontSize: 9, letterSpacing: "0.1em", marginTop: 4 }}>✓ BOKADE IN</span>
          {booked.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(201,168,76,0.06)", opacity: 0.5 }}>
              <button onClick={() => toggle(item.id)} style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: "1.5px solid #c9a84c", background: "#c9a84c", cursor: "pointer", padding: 0 }} />
              <span style={{ flex: 1, color: "rgba(232,224,204,0.4)", fontSize: 12, textDecoration: "line-through", wordBreak: "break-word" }}>{item.text}</span>
              <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: "rgba(201,168,76,0.2)", cursor: "pointer", fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function TodoWidget() {
  const [todos, setTodos] = React.useState<ListItem[]>([]);
  const [ideas, setIdeas] = React.useState<ListItem[]>([]);
  const [context, setContext] = React.useState(() => { try { return localStorage.getItem("rekvo-aura-context") ?? ""; } catch { return ""; } });
  const [advice, setAdvice] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function saveContext(v: string) {
    setContext(v);
    try { localStorage.setItem("rekvo-aura-context", v); } catch { /**/ }
  }

  async function askAura() {
    setLoading(true);
    setAdvice("");
    try {
      const res = await fetch(`/api/hq/advise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          k: KEY(),
          todos: todos.filter((i) => !i.booked).map((i) => i.text),
          ideas: ideas.map((i) => i.text),
          context,
        }),
      });
      const d = await res.json() as { advice?: string };
      setAdvice(d.advice ?? "Kunde inte hämta råd.");
    } catch { setAdvice("Något gick fel."); }
    setLoading(false);
  }

  return (
    <div style={{
      width: 290, minWidth: 260, display: "flex", flexDirection: "column",
      border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12,
      background: "rgba(10,18,30,0.92)", boxShadow: "0 0 30px rgba(201,168,76,0.07)",
    }}>
      {/* AURA-sektion — fast längst upp, alltid synlig */}
      <div style={{ padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: 8, borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
        <span style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.14em", fontWeight: 700 }}>✦ FRÅGA AURA</span>
        <textarea
          value={context}
          onChange={(e) => saveContext(e.target.value)}
          placeholder="Berätta vad som händer, vad du kämpar med eller vad du vill ha råd om..."
          rows={3}
          style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, color: "#e8e0cc", fontSize: 12, padding: "9px 11px", outline: "none", resize: "none", fontFamily: "ui-sans-serif,system-ui,sans-serif", lineHeight: 1.5, width: "100%", boxSizing: "border-box" }}
        />
        <button onClick={askAura} disabled={loading} style={{
          background: loading ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.18)",
          border: "1.5px solid rgba(201,168,76,0.5)", borderRadius: 7, color: "#c9a84c",
          fontSize: 12, letterSpacing: "0.08em", fontWeight: 700, padding: "10px 14px",
          cursor: loading ? "default" : "pointer", width: "100%",
        }}>
          {loading ? "AURA TÄNKER…" : "FRÅGA AURA"}
        </button>
        {advice && (
          <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 7, padding: "11px 13px", color: "#e8e0cc", fontSize: 12, lineHeight: 1.7 }}>
            {advice}
          </div>
        )}
      </div>
      {/* Listor — scrollbar under Aura-sektionen */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <MiniList label="ATT GÖRA" lsKey="rekvo-todo-v2" placeholder="Lägg till uppgift..." showBooked onItemsChange={setTodos} />
        <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }} />
        <MiniList label="IDÉER" lsKey="rekvo-ideas-v1" placeholder="Skriv en idé..." onItemsChange={setIdeas} />
      </div>
    </div>
  );
}

/** Subsystem checklist that types itself out down the left edge during boot. */
const BOOT_CHECKS: [number, string][] = [
  [0.10, "KÄRNKRAFT"],
  [0.24, "NEURALLÄNK"],
  [0.36, "LEAD-INTEL"],
  [0.48, "GHL-LÄNK"],
  [0.56, "RÖSTSYSTEM"],
];
function BootChecks() {
  const [frac, setFrac] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const iv = setInterval(() => setFrac((performance.now() - t0) / BOOT_MS), 80);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="hq-checks" aria-hidden>
      {BOOT_CHECKS.filter(([at]) => frac >= at).map(([at, label]) => (
        <div key={label} className="hq-check">
          <span>{label}</span>
          <span className={frac >= at + 0.08 ? "ok" : "wait"}>{frac >= at + 0.08 ? "OK" : "…"}</span>
        </div>
      ))}
      {frac >= BOOT_IGNITE && <div className="hq-check go">ALLA SYSTEM REDO</div>}
    </div>
  );
}

/** Corner status readout — live clock, system state, headline numbers. */
function HudStatus({ online, asleep, ringRef }: { online: boolean; asleep: boolean; ringRef: React.MutableRefObject<Ring | null> }) {
  const [, force] = useState(0);
  useEffect(() => { const iv = setInterval(() => force((t) => t + 1), 1000); return () => clearInterval(iv); }, []);
  const now = new Date();
  const t = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
  const ring = ringRef.current;
  return (
    <div className="hq-hud" aria-hidden>
      <span>{t}</span>
      <span className={online && !asleep ? "ok" : ""}>{!online ? "OFFLINE" : asleep ? "VILOLÄGE" : "ALLA SYSTEM NOMINELLA"}</span>
      {online && ring && <span>{ring.leads7} LEADS · {ring.booked7} BOKADE · {ring.cash7}</span>}
    </div>
  );
}

/** LIVE DEMO SETTER — a draggable IG-style chat. Jack (or a prospect) types
 *  as the lead; the real AI setter persona replies. Pure showcase. */
function DemoDM({ accessKey, apiBase, onClose, onTick, autoMsgs }: { accessKey: string; apiBase: string; onClose: () => void; onTick?: () => void; autoMsgs?: { role: "lead" | "setter"; text: string }[] }) {
  const [msgs, setMsgs] = useState<{ role: "lead" | "setter"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const isAuto = autoMsgs && autoMsgs.length > 0;
  const displayMsgs = isAuto ? autoMsgs : msgs;
  const [pos, setPos] = useState({ x: 34, y: 15 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [msgs, busy, autoMsgs]);

  const onDown = (e: React.PointerEvent) => {
    const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* */ }
  };
  const onMoveP = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: Math.max(0, Math.min(78, ((e.clientX - drag.current.dx) / window.innerWidth) * 100)), y: Math.max(9, Math.min(80, ((e.clientY - drag.current.dy) / window.innerHeight) * 100)) });
  };
  const onUp = (e: React.PointerEvent) => { drag.current = null; try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ } };

  const send = async () => {
    const text = input.trim(); if (!text || busy) return;
    const next = [...msgs, { role: "lead" as const, text }];
    setMsgs(next); setInput(""); setBusy(true); onTick?.();
    try {
      const res = await fetch(`${apiBase}/demo-dm?k=${encodeURIComponent(accessKey)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ history: next.map((m) => ({ role: m.role, content: m.text })) }) });
      const data = (await res.json()) as { messages?: string[] };
      const bubbles = (data.messages ?? []).filter(Boolean);
      for (let i = 0; i < bubbles.length; i++) {
        await new Promise((r) => setTimeout(r, i ? 950 : 350));
        setMsgs((m) => [...m, { role: "setter", text: bubbles[i] }]); onTick?.();
      }
    } catch { setMsgs((m) => [...m, { role: "setter", text: "ett ögonblick — säg det igen?" }]); }
    setBusy(false);
  };

  return (
    <div className="hq-panel hq-dm" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
      <div className="hq-panel-bar" onPointerDown={onDown} onPointerMove={onMoveP} onPointerUp={onUp} onPointerCancel={onUp}>
        <span className="hq-panel-title">● LIVE · AI SETTER DEMO (SV)</span>
        <button className="hq-panel-x" onPointerDown={(e) => e.stopPropagation()} onClick={onClose}>✕</button>
      </div>
      <div className="hq-dm-body" ref={bodyRef}>
        {displayMsgs.length === 0 && <div className="hq-dm-hint">{isAuto ? "Konversation laddar…" : "Skriv som leaden — se settern stänga."}</div>}
        {displayMsgs.map((m, i) => (<div key={i} className={`hq-bub ${m.role === "lead" ? "us" : "lead"}`}>{m.text}</div>))}
        {busy && !isAuto && <div className="hq-bub lead hq-dm-typing">typing…</div>}
      </div>
      {!isAuto && <form className="hq-dm-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="skriv som leaden…" autoFocus />
        <button type="submit" className="hq-dm-send" disabled={busy}>Skicka</button>
      </form>}
    </div>
  );
}

/** Count-up: numbers roll from 0 to their value like a reactor charging. */
function Roll({ v }: { v: number | string | undefined }) {
  const str = v == null ? "" : String(v);
  const m = str.match(/-?[\d,]+(\.\d+)?/);
  const target = m ? parseFloat(m[0].replace(/,/g, "")) : NaN;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!isFinite(target)) return;
    const t0 = performance.now(); const dur = 750; let raf = 0;
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      setShown(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  if (!m || !isFinite(target)) return <>{str}</>;
  const num = shown.toLocaleString("en-US", { maximumFractionDigits: m[0].includes(".") ? 1 : 0 });
  return <>{str.slice(0, m.index)}{num}{str.slice((m.index ?? 0) + m[0].length)}</>;
}

/**
 * Pixel materialize/dematerialize: a grid of "pixels" covers the panel and
 * burns off cell-by-cell in random order (each flashes gold as it goes).
 * When the panel leaves, the pixels stack back in and the panel fades.
 */
function PixelVeil({ leaving }: { leaving: boolean }) {
  const cells = useMemo(() => Array.from({ length: 14 * 10 }, () => Math.random()), []);
  const [spent, setSpent] = useState(false);
  useEffect(() => {
    if (leaving) { setSpent(false); return; }
    const tm = setTimeout(() => setSpent(true), 700);
    return () => clearTimeout(tm);
  }, [leaving]);
  if (spent && !leaving) return null;
  return (
    <div className="hq-pix" aria-hidden>
      {cells.map((d, i) => (
        <span key={i} className={leaving ? "in" : "out"} style={{ animationDelay: `${(d * (leaving ? 0.32 : 0.42)).toFixed(3)}s` }} />
      ))}
    </div>
  );
}

function PanelCard({ panel, index, onDismiss, onMove, onHover, cine }: { panel: LivePanel; index: number; onDismiss: () => void; onMove: (x: number, y: number) => void; onHover?: () => void; cine?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null); const drag = useRef<{ dx: number; dy: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    // capture on the BAR (the element with these handlers) so move/up keep
    // firing here and the drag can't get stuck following the mouse
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* */ }
  };
  const onMoveP = (e: React.PointerEvent) => { if (!drag.current) return; const x = ((e.clientX - drag.current.dx) / window.innerWidth) * 100; const y = ((e.clientY - drag.current.dy) / window.innerHeight) * 100; onMove(Math.max(0, Math.min(80, x)), Math.max(9, Math.min(80, y))); };
  const onUp = (e: React.PointerEvent) => {
    drag.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };
  const max = (rows?: PanelRow[]) => Math.max(1, ...(rows ?? []).map((r) => Number(r.value) || 0));
  return (
    <div ref={ref} className={`hq-panel ${panel.kind === "report" ? "hq-panel--report" : ""} ${cine ? "cine" : ""} ${panel.leaving ? "leaving" : ""}`} onMouseEnter={onHover} style={{ left: `${panel.x}%`, top: `${panel.y}%`, animationDelay: panel.leaving ? "0ms" : `${index * 90}ms` }}>
      <PixelVeil leaving={!!panel.leaving} />
      <div className="hq-panel-bar" onPointerDown={onDown} onPointerMove={onMoveP} onPointerUp={onUp} onPointerCancel={onUp}>
        <span className="hq-panel-title">{panel.title || "DATA"}</span>
        <button className="hq-panel-x" onPointerDown={(e) => e.stopPropagation()} onClick={onDismiss}>✕</button>
      </div>
      <div className="hq-panel-body">
        {(panel.kind === "funnel" || panel.kind === "bars") && (
          <div className="hq-bars">{(panel.rows ?? []).map((r, i) => (
            <div key={i} className="hq-barrow"><span className="hq-barlabel">{r.label}</span><span className="hq-bartrack"><span className="hq-barfill" style={{ width: `${(Number(r.value) / max(panel.rows)) * 100}%` }} /></span><span className="hq-barval"><Roll v={r.value} /></span></div>
          ))}</div>
        )}
        {panel.kind === "metric" && <div className="hq-metric"><div className={`hq-metric-val ${panel.accent ? "acc" : ""}`}><Roll v={panel.value} /></div>{panel.sub && <div className="hq-metric-sub">{panel.sub}</div>}</div>}
        {panel.kind === "stats" && <div className="hq-statgrid">{(panel.items ?? []).map((it, i) => (<div key={i} className="hq-statitem"><div className="hq-statitem-v"><Roll v={it.value} /></div><div className="hq-statitem-l">{it.label}</div></div>))}</div>}
        {panel.kind === "list" && <div className="hq-list">{(panel.rows ?? []).map((r, i) => (<div key={i} className="hq-listrow"><span>{r.primary}</span><span className="dim">{r.secondary}</span><span className="dim">{r.tertiary}</span></div>))}</div>}
        {panel.kind === "convo" && (
          <div className="hq-convo">{(panel.rows ?? []).map((r, i) => (
            <div key={i} className={`hq-bub ${r.from === "lead" ? "lead" : "us"}`}>
              <div>{r.text}</div>
              {r.time && <div className="hq-bub-time">{r.time}</div>}
            </div>
          ))}</div>
        )}
        {panel.kind === "draft" && (
          <div className="hq-draft">
            <div className="hq-draft-text">&ldquo;{panel.value}&rdquo;</div>
            {panel.sub && <div className="hq-draft-hint">{panel.sub}</div>}
          </div>
        )}
        {panel.kind === "report" && (
          <div className="hq-report">
            {panel.summary && <div className="hq-rep-summary">{panel.summary}</div>}
            {(panel.sections ?? []).map((s, i) => (
              <div key={i} className="hq-rep-sec">
                <div className="hq-rep-h">{s.h}</div>
                <div className="hq-rep-body">{s.body}</div>
              </div>
            ))}
            {(panel.fixes ?? []).length > 0 && (
              <div className="hq-rep-sec">
                <div className="hq-rep-h">TOP FIXES — nothing applied until you say so</div>
                {(panel.fixes ?? []).map((f, i) => (
                  <div key={i} className="hq-fix">
                    <div className="hq-fix-top">
                      <span className="hq-fix-n">{f.n ?? i + 1}</span>
                      <span className="hq-fix-title">{f.title}</span>
                      {f.confidence && <span className={`hq-fix-chip c-${(f.confidence || "").toLowerCase()}`}>{f.confidence}</span>}
                    </div>
                    {f.body && <div className="hq-fix-line"><b>Change:</b> {f.body}</div>}
                    {f.why && <div className="hq-fix-line"><b>Why this one:</b> {f.why}</div>}
                    {f.impact && <div className="hq-fix-line"><b>Expected:</b> {f.impact}</div>}
                    {f.target && <div className="hq-fix-target">{f.target}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HqStyles() {
  return (
    <style>{`
      .hq-root { position: fixed; inset: 0; overflow: hidden; color: #f5f0e1; background: radial-gradient(1300px 700px at 50% -8%, #0f2040 0%, #091830 45%, #060e1c 100%); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; transition: filter 1.2s ease; }
      /* Sleep / power-down dimming is scoped to the Aura tab only — the
         Dashboard tab stays in full light even while Aura is asleep or shut
         down, so you can showcase it with Aura powered off. */
      .hq-root.tab-aura.asleep { filter: brightness(0.55) saturate(0.7); }
      .hq-root.tab-aura.off { filter: brightness(0.42) saturate(0.5); }
      .hq-center { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #060e1c; color: #f5f0e1; text-align: center; }
      .hq-bg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 0; }
      .hq-veil { position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0; background: radial-gradient(circle at 50% 45%, rgba(6,9,18,0) 30%, rgba(4,6,12,0.78) 100%); transition: opacity 1.2s ease; }
      .hq-veil[data-on="true"] { opacity: 1; }
      .hq-flash { position: absolute; inset: 0; z-index: 9; pointer-events: none; opacity: 0;
        background: radial-gradient(circle at 50% 54%, rgba(220,235,255,0.95) 0%, rgba(126,184,212,0.35) 26%, rgba(126,184,212,0) 62%);
        animation: hqIgnite 3.6s linear both; }
      .hq-corner { position: absolute; width: 26px; height: 26px; border: 1px solid rgba(126,184,212,0.45); pointer-events: none; z-index: 4; }
      .hq-corner.tl { top: 14px; left: 14px; border-right: 0; border-bottom: 0; } .hq-corner.tr { top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
      .hq-corner.bl { bottom: 14px; left: 14px; border-right: 0; border-top: 0; } .hq-corner.br { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }
      .hq-top { position: relative; z-index: 5; display: flex; align-items: center; gap: 16px; padding: 18px 30px; }
      .hq-wm { font-size: 16px; letter-spacing: 0.32em; font-weight: 800; text-shadow: 0 0 18px rgba(201,168,76,0.4); } .hq-wm .g { color: #7eb8d4; }
      .hq-tabs { display: flex; gap: 8px; margin: 0 auto; }
      .hq-tab { background: rgba(9,24,48,0.5); border: 1px solid rgba(126,184,212,0.22); color: #7ea8c8; letter-spacing: 0.16em; font-size: 11px; padding: 9px 18px; border-radius: 999px; cursor: pointer; transition: .25s; backdrop-filter: blur(10px); position: relative; overflow: hidden; }
      .hq-tab::after { content: ""; position: absolute; top: 0; left: -80%; width: 60%; height: 100%; background: linear-gradient(90deg, transparent, rgba(126,184,212,0.22), transparent); transform: skewX(-20deg); transition: left .45s ease; }
      .hq-tab:hover { border-color: rgba(201,168,76,0.6); color: #f5f0e1; box-shadow: 0 0 18px rgba(126,184,212,0.18), inset 0 0 12px rgba(126,184,212,0.06); transform: translateY(-1px); }
      .hq-tab:hover::after { left: 120%; }
      .hq-tab.on { color: #fff; background: linear-gradient(90deg,#c9a84c,#7eb8d4); border-color: transparent; font-weight: 800; box-shadow: 0 0 22px rgba(126,184,212,0.3); }
      .hq-state { font-size: 11px; letter-spacing: 0.1em; color: #4a90b8; text-transform: uppercase; min-width: 92px; text-align: right; }
      .hq-state.s-listening { color: #f0e1aa; } .hq-state.s-thinking { color: #8ab0ff; } .hq-state.s-speaking { color: #7eb8d4; } .hq-state.s-asleep { color: #5a5646; }
      .hq-stage { position: absolute; inset: 64px 0 0 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center;
        transform: perspective(1200px) rotateY(calc(var(--mx, 0) * 4deg)) rotateX(calc(var(--my, 0) * -3deg)); transition: transform .18s linear; }
      .hq-stage.shake { animation: hqShake 3.6s linear both; }
      .hq-checks { position: absolute; left: 26px; bottom: 26px; z-index: 6; display: flex; flex-direction: column; gap: 5px; font-family: ui-monospace, Menlo, monospace; font-size: 10px; letter-spacing: 0.18em; color: #4a90b8; pointer-events: none; }
      .hq-check { display: flex; gap: 14px; justify-content: space-between; min-width: 172px; animation: hqCheckIn .25s ease both; }
      .hq-check .ok { color: #7eb8d4; } .hq-check .wait { color: #5a5646; }
      .hq-check.go { color: #f0e1aa; text-shadow: 0 0 12px rgba(201,168,76,0.8); }
      .hq-orbwrap { position: relative; width: min(500px, 70vh); height: min(500px, 70vh); cursor: pointer; transition: transform .8s cubic-bezier(.16,1,.3,1); }
      .hq-root.cinema .hq-orbwrap { transform: scale(.5) translateY(-46%); }
      .hq-orb { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
      .hq-orb.gl { z-index: 0; } .hq-orb.top { z-index: 1; }
      .hq-panel.cine { width: min(31vw, 460px); max-width: none; max-height: 66vh; }
      .hq-panel.cine .hq-metric-val { font-size: 60px; }
      .hq-hud { position: absolute; right: 26px; bottom: 22px; z-index: 6; display: flex; flex-direction: column; gap: 4px; align-items: flex-end; font-family: ui-monospace, Menlo, monospace; font-size: 10px; letter-spacing: 0.18em; color: #6b6750; pointer-events: none; }
      .hq-hud .ok { color: #7eb8d4; text-shadow: 0 0 10px rgba(201,168,76,0.5); }
      .hq-demobadge { position: absolute; top: 64px; left: 50%; transform: translateX(-50%); z-index: 7; font-size: 10px; letter-spacing: 0.3em; color: #0d0d0d; background: linear-gradient(90deg,#7eb8d4,#4a90b8); padding: 4px 14px; border-radius: 999px; font-weight: 800; }
      .hq-dealclose { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; background: radial-gradient(circle at 50% 50%, rgba(201,168,76,0.20), rgba(6,9,18,0.88) 70%); animation: hqDcFade 6.5s ease forwards; }
      .hq-dc-ring { position: absolute; width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(255,215,120,0.9); box-shadow: 0 0 40px rgba(255,215,120,0.6); animation: hqDcRing 1.5s cubic-bezier(.16,1,.3,1) forwards; }
      .hq-dc-inner { position: relative; text-align: center; animation: hqDcPop .75s cubic-bezier(.16,1,.3,1) both; }
      .hq-dc-label { font-size: 14px; letter-spacing: 0.42em; color: #7eb8d4; font-weight: 800; }
      .hq-dc-amount { font-size: clamp(64px, 13vw, 190px); font-weight: 900; color: #ffe7a8; text-shadow: 0 0 50px rgba(255,215,120,0.75), 0 0 120px rgba(201,168,76,0.45); font-variant-numeric: tabular-nums; line-height: 1; margin: 10px 0; }
      .hq-dc-sub { font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; color: #9a9483; }
      @keyframes hqDcPop { 0% { opacity: 0; transform: scale(.4); filter: blur(10px); } 55% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); filter: none; } }
      @keyframes hqDcRing { 0% { width: 40px; height: 40px; opacity: .9; } 100% { width: 150vw; height: 150vw; opacity: 0; } }
      @keyframes hqDcFade { 0%, 80% { opacity: 1; } 100% { opacity: 0; } }
      .hq-wake { position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%); white-space: nowrap; font-size: 13px; letter-spacing: 0.06em; color: #7eb8d4; text-shadow: 0 0 12px rgba(201,168,76,0.5); max-width: 80vw; overflow: hidden; text-overflow: ellipsis; }
      .hq-wake.dim { color: #4a90b8; } .hq-wake.live { color: #f0e1aa; } .hq-wake.sleep { color: #6b6750; letter-spacing: 0.12em; }
      .hq-fxlabel { position: absolute; top: 16%; left: 50%; transform: translateX(-50%); z-index: 6; font-size: 13px; letter-spacing: 0.5em; color: #7eb8d4; text-shadow: 0 0 18px rgba(201,168,76,0.7); text-transform: uppercase; pointer-events: none; animation: hqFx 2.4s ease both; }
      .hq-fxlabel.big { font-size: 22px; letter-spacing: 0.7em; font-weight: 800; text-shadow: 0 0 30px rgba(201,168,76,0.9), 0 0 60px rgba(201,168,76,0.5); }
      .hq-said { max-width: 600px; text-align: center; margin-top: 30px; font-size: 19px; line-height: 1.5; color: #f5f0e1; text-shadow: 0 0 20px rgba(0,0,0,0.6); animation: hqFade .4s ease; z-index: 3; padding: 0 24px; }
      .hq-note { margin-top: 10px; font-size: 12px; color: #4a90b8; }
      .hq-textinput { display: flex; gap: 8px; margin-top: 18px; z-index: 4; width: min(500px, 90vw); }
      .hq-textinput-field { flex: 1; background: rgba(9,24,48,0.6); border: 1px solid rgba(126,184,212,0.28); border-radius: 10px; padding: 10px 14px; color: #f5f0e1; font-size: 14px; outline: none; backdrop-filter: blur(10px); transition: border-color .2s; }
      .hq-textinput-field::placeholder { color: #4a6080; }
      .hq-textinput-field:focus { border-color: rgba(126,184,212,0.65); }
      .hq-textinput-field:disabled { opacity: 0.5; }
      .hq-textinput-btn { background: linear-gradient(90deg,#7eb8d4,#4a90b8); color: #0d0d0d; font-weight: 800; border: none; border-radius: 10px; padding: 0 18px; cursor: pointer; font-size: 13px; letter-spacing: 0.06em; transition: opacity .2s; }
      .hq-textinput-btn:disabled { opacity: 0.45; cursor: default; }
      .hq-panel { position: absolute; z-index: 8; width: 320px; max-width: 34vw; max-height: 74vh; display: flex; flex-direction: column;
        background: linear-gradient(160deg, rgba(15,32,64,0.75), rgba(6,14,28,0.72)); border: 1px solid rgba(126,184,212,0.35); border-radius: 12px; backdrop-filter: blur(18px) saturate(1.25);
        box-shadow: 0 0 0 1px rgba(126,184,212,0.08), 0 18px 60px rgba(0,0,0,0.5), 0 0 40px rgba(126,184,212,0.10); overflow: hidden; animation: hqMaterial .38s cubic-bezier(.16,1,.3,1) backwards;
        transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
      .hq-panel:hover { transform: translateY(-3px); border-color: rgba(201,168,76,0.75);
        box-shadow: 0 0 0 1px rgba(201,168,76,0.15), 0 24px 70px rgba(0,0,0,0.55), 0 0 56px rgba(201,168,76,0.22); }
      .hq-panel.leaving { animation: hqGone .54s ease both; }
      .hq-pix { position: absolute; inset: 0; z-index: 5; pointer-events: none; display: grid; grid-template-columns: repeat(14, 1fr); grid-template-rows: repeat(10, 1fr); }
      .hq-pix span { background: #07101f; }
      .hq-pix span.out { animation: hqPixOut .09s steps(1, end) both; }
      .hq-pix span.in { opacity: 0; animation: hqPixIn .09s steps(1, end) both; }
      .hq-panel::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px; z-index: 2; pointer-events: none;
        background: linear-gradient(90deg, transparent, #c9a84c 40%, #7eb8d4 60%, transparent); box-shadow: 0 0 14px rgba(126,184,212,0.7);
        animation: hqScanDown .8s ease .08s 1 both; }
      .hq-panel::after { content: ""; position: absolute; top: 0; left: -60%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(201,168,76,0.18), transparent); transform: skewX(-18deg); animation: hqSweep 1.1s ease .25s 1; pointer-events: none; }
      .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub) { animation: hqRowIn .45s ease both; }
      .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub):nth-child(1) { animation-delay: .28s } .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub):nth-child(2) { animation-delay: .34s }
      .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub):nth-child(3) { animation-delay: .40s } .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub):nth-child(4) { animation-delay: .46s }
      .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub):nth-child(5) { animation-delay: .52s } .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub):nth-child(6) { animation-delay: .58s }
      .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub):nth-child(7) { animation-delay: .64s } .hq-panel-body :is(.hq-barrow, .hq-listrow, .hq-statitem, .hq-bub):nth-child(n+8) { animation-delay: .70s }
      .hq-panel-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: grab; border-bottom: 1px solid rgba(126,184,212,0.18); background: rgba(9,24,48,0.6); flex: 0 0 auto; touch-action: none; }
      .hq-panel-bar:active { cursor: grabbing; }
      .hq-panel-title { font-size: 11px; letter-spacing: 0.16em; color: #7eb8d4; font-weight: 700; text-transform: uppercase; }
      .hq-panel-x { background: transparent; border: none; color: #4a90b8; cursor: pointer; font-size: 14px; padding: 2px 6px; } .hq-panel-x:hover { color: #f0e1aa; }
      .hq-panel-body { padding: 14px; overflow-y: auto; }
      .hq-bars { display: flex; flex-direction: column; gap: 10px; }
      .hq-barrow { display: grid; grid-template-columns: 90px 1fr 54px; align-items: center; gap: 8px; font-size: 13px; }
      .hq-barlabel { color: #cfc8b4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .hq-bartrack { height: 8px; background: rgba(255,255,255,0.06); border-radius: 6px; overflow: hidden; }
      .hq-barfill { display: block; height: 100%; background: linear-gradient(90deg,#4a90b8,#7eb8d4); box-shadow: 0 0 12px rgba(201,168,76,0.6); animation: hqGrow .7s ease both; }
      .hq-barval { text-align: right; color: #f5f0e1; font-variant-numeric: tabular-nums; font-weight: 700; }
      .hq-metric { text-align: center; padding: 8px 0; } .hq-metric-val { font-size: 42px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .hq-metric-val.acc { color: #7eb8d4; text-shadow: 0 0 24px rgba(201,168,76,0.5); } .hq-metric-sub { font-size: 12px; color: #8a8576; margin-top: 4px; letter-spacing: 0.06em; }
      .hq-statgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .hq-statitem { text-align: center; background: rgba(9,24,48,0.5); border: 1px solid rgba(126,184,212,0.16); border-radius: 10px; padding: 12px 6px; }
      .hq-statitem-v { font-size: 22px; font-weight: 800; color: #f5f0e1; } .hq-statitem-l { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #8a8576; margin-top: 3px; }
      .hq-list { display: flex; flex-direction: column; }
      .hq-listrow { display: flex; justify-content: space-between; gap: 8px; padding: 9px 2px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; } .hq-listrow .dim { color: #8a8576; }
      .hq-convo { display: flex; flex-direction: column; gap: 8px; }
      .hq-bub { max-width: 86%; padding: 8px 11px; border-radius: 12px; font-size: 13px; line-height: 1.35; }
      .hq-bub.lead { align-self: flex-start; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08); color: #e9e4d2; border-bottom-left-radius: 4px; }
      .hq-bub.us { align-self: flex-end; background: rgba(201,168,76,0.16); border: 1px solid rgba(201,168,76,0.3); color: #f5edd6; border-bottom-right-radius: 4px; }
      .hq-bub-time { font-size: 9px; color: #8a8576; margin-top: 3px; letter-spacing: 0.06em; }
      .hq-draft { text-align: center; padding: 6px 2px; }
      .hq-draft-text { font-size: 15px; line-height: 1.45; color: #f5f0e1; }
      .hq-draft-hint { margin-top: 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #7eb8d4; animation: hqPulseTxt 1.6s ease infinite; }
      .hq-panel--report { width: 440px; max-width: 42vw; max-height: 78vh; }
      .hq-report { display: flex; flex-direction: column; gap: 14px; }
      .hq-rep-summary { font-size: 14px; line-height: 1.5; color: #f5f0e1; border-left: 2px solid rgba(201,168,76,0.6); padding-left: 11px; }
      .hq-rep-sec { display: flex; flex-direction: column; gap: 5px; }
      .hq-rep-h { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #7eb8d4; font-weight: 800; }
      .hq-rep-body { font-size: 12.5px; line-height: 1.5; color: #d9d3c0; white-space: pre-line; }
      .hq-fix { background: rgba(255,255,255,0.03); border: 1px solid rgba(201,168,76,0.16); border-radius: 10px; padding: 11px 12px; margin-top: 8px; }
      .hq-fix-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .hq-fix-n { flex: 0 0 auto; width: 19px; height: 19px; border-radius: 50%; background: linear-gradient(135deg,#7eb8d4,#4a90b8); color: #0d0d0d; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
      .hq-fix-title { flex: 1; font-size: 13px; font-weight: 700; color: #f5f0e1; }
      .hq-fix-chip { flex: 0 0 auto; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; border: 1px solid rgba(201,168,76,0.3); color: #7eb8d4; }
      .hq-fix-chip.c-high { color: #8fe3a0; border-color: rgba(143,227,160,0.4); } .hq-fix-chip.c-low { color: #d8a07a; border-color: rgba(216,160,122,0.4); }
      .hq-fix-line { font-size: 12px; line-height: 1.45; color: #d9d3c0; margin-top: 3px; } .hq-fix-line b { color: #b9b3a3; font-weight: 700; }
      .hq-fix-target { margin-top: 6px; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #8a8576; }
      .hq-dm { width: 380px; max-width: 90vw; height: 460px; max-height: 76vh; z-index: 9; }
      .hq-dm-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
      .hq-dm-hint { margin: auto; text-align: center; font-size: 12px; color: #8a8576; letter-spacing: 0.04em; }
      .hq-dm-typing { opacity: 0.7; font-style: italic; }
      .hq-dm-input { display: flex; gap: 8px; padding: 10px; border-top: 1px solid rgba(201,168,76,0.18); flex: 0 0 auto; }
      .hq-dm-input input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(201,168,76,0.22); border-radius: 9px; padding: 9px 12px; color: #f5f0e1; font-size: 13px; outline: none; }
      .hq-dm-input input:focus { border-color: rgba(201,168,76,0.6); }
      .hq-dm-send { background: linear-gradient(90deg,#7eb8d4,#4a90b8); color: #0d0d0d; font-weight: 800; border: none; border-radius: 9px; padding: 0 16px; cursor: pointer; font-size: 12px; letter-spacing: 0.06em; }
      .hq-dm-send:disabled { opacity: 0.5; cursor: default; }
      .hq-frame { position: absolute; inset: 60px 14px 14px 14px; z-index: 3; border: 1px solid rgba(201,168,76,0.25); border-radius: 12px; overflow: hidden; box-shadow: 0 0 40px rgba(201,168,76,0.08); }
      .hq-iframe { width: 100%; height: 100%; border: 0; background: #0d0d0d; }
      .hq-content { position: absolute; inset: 64px 0 0 0; z-index: 3; display: flex; align-items: center; justify-content: center; } .hq-launch { text-align: center; }
      .hq-launch-title { font-size: 22px; letter-spacing: 0.3em; font-weight: 800; color: #7eb8d4; text-shadow: 0 0 20px rgba(201,168,76,0.4); } .hq-launch p { color: #8a8576; margin-top: 10px; }
      .hq-go { background: linear-gradient(90deg,#7eb8d4,#4a90b8); color: #0d0d0d; font-weight: 800; border: none; border-radius: 12px; padding: 0 16px; cursor: pointer; }
      .hq-go.big { display: inline-block; padding: 14px 28px; text-decoration: none; margin-top: 18px; }
      @keyframes hqMaterial { from { opacity: 0; transform: translateY(16px) scale(.95); } to { opacity: 1; transform: none; } }
      @keyframes hqGone { 0%, 74% { opacity: 1; transform: none; } 100% { opacity: 0; transform: scale(.97); } }
      @keyframes hqPixOut { 0% { opacity: 1; background: #0a0a0a; } 60% { opacity: 1; background: rgba(201,168,76,0.85); } 100% { opacity: 0; } }
      @keyframes hqPixIn { 0% { opacity: 0; } 50% { opacity: 1; background: rgba(201,168,76,0.7); } 100% { opacity: 1; background: #0a0a0a; } }
      @keyframes hqScanDown { 0% { top: 0; opacity: 1; } 85% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      @keyframes hqRowIn { from { opacity: 0; transform: translateX(-10px); filter: blur(4px); } to { opacity: 1; transform: none; filter: none; } }
      @keyframes hqSweep { to { left: 130%; } } @keyframes hqGrow { from { width: 0 !important; } } @keyframes hqFade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes hqFx { 0% { opacity: 0; letter-spacing: 0.9em; } 18% { opacity: 1; } 78% { opacity: 1; } 100% { opacity: 0; } }
      @keyframes hqPulseTxt { 50% { opacity: 0.45; } }
      @keyframes hqIgnite { 0%, 58% { opacity: 0; } 64% { opacity: 0.9; } 80% { opacity: 0.12; } 100% { opacity: 0; } }
      @keyframes hqShake { 0%, 61.5% { transform: none; } 63% { transform: translate(4px,-3px); } 64.5% { transform: translate(-4px,2px); } 66% { transform: translate(3px,2px); } 67.5% { transform: translate(-2px,-2px); } 69% { transform: translate(1px,1px); } 70.5%, 100% { transform: none; } }
      @keyframes hqCheckIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
    `}</style>
  );
}
