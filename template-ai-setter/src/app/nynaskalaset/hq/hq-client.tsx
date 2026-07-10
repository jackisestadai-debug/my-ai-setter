"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const KEY = (): string =>
  typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("k") || "";

type Tab = "rekvo" | "stats" | "test";
type OrbState = "idle" | "thinking" | "speaking" | "asleep";

interface TicketBreakdown { type: string; count: number }
interface Stats {
  totalLeads: number;
  leadsToday: number;
  activeConvs: number;
  dmsSentTotal: number;
  dmsSentToday: number;
  ticketsSold: number;
  ticketsByType: TicketBreakdown[];
  estimatedRevenue: number;
  linkSentCount: number;
  stageCount: Record<string, number>;
  fbFollowers: number;
  fbFollowersYesterday: number;
}
interface Countdown { daysLeft: number; hoursLeft: number }
interface ChatMsg { role: "user" | "assistant"; content: string }
interface TestMsg { role: "lead" | "ai"; content: string }

// Festival orange theme
const O = { r: 232, g: 93, b: 26 };   // #E85D1A
const OL = { r: 255, g: 160, b: 90 }; // lighter orange
const rgbO = `${O.r},${O.g},${O.b}`;
const rgbOL = `${OL.r},${OL.g},${OL.b}`;

export default function HqClient() {
  const [tab, setTab] = useState<Tab>("rekvo");
  const [orb, setOrb] = useState<OrbState>("idle");
  const [stats, setStats] = useState<Stats | null>(null);
  const [countdown, setCountdown] = useState<Countdown>({ daysLeft: 0, hoursLeft: 0 });
  const [isActive, setIsActive] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testMsgs, setTestMsgs] = useState<TestMsg[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [note, setNote] = useState("");
  const [booting, setBooting] = useState(true);

  const orbCanvas = useRef<HTMLCanvasElement>(null);
  const bgCanvas = useRef<HTMLCanvasElement>(null);
  const glCanvas = useRef<HTMLCanvasElement>(null);
  const glOkRef = useRef(false);
  const ampRef = useRef(0);
  const powerRef = useRef(1);
  const tintRef = useRef<[number, number, number]>([O.r, O.g, O.b]);
  const orbRef = useRef<OrbState>("idle");
  orbRef.current = orb;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const testEndRef = useRef<HTMLDivElement>(null);
  const lastPulse = useRef(new Date().toISOString());
  const keyRef = useRef("");
  const mouseRef = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const bgRaf = useRef(0);

  useEffect(() => {
    keyRef.current = KEY();
    setTimeout(() => setBooting(false), 1800);
  }, []);

  // Mouse parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
      document.documentElement.style.setProperty("--mx", String(mouseRef.current.x));
      document.documentElement.style.setProperty("--my", String(mouseRef.current.y));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Pulse — fetch live stats every 30s
  useEffect(() => {
    const fetchPulse = async () => {
      const k = keyRef.current; if (!k) return;
      try {
        const res = await fetch(`/api/nynaskalaset/pulse?k=${encodeURIComponent(k)}&since=${encodeURIComponent(lastPulse.current)}`);
        if (!res.ok) return;
        const data = await res.json();
        lastPulse.current = data.now;
        setStats(data.stats);
        setCountdown(data.countdown);
        setIsActive(data.isActive);
      } catch { /* */ }
    };
    fetchPulse();
    const iv = setInterval(fetchPulse, 30_000);
    return () => clearInterval(iv);
  }, []);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);
  useEffect(() => { testEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [testMsgs]);

  // Orb amp animation
  useEffect(() => {
    const iv = setInterval(() => {
      const st = orbRef.current;
      const t = performance.now() / 1000;
      if (st === "thinking") ampRef.current = 0.35 + Math.sin(t * 3.1) * 0.2;
      else if (st === "speaking") ampRef.current = 0.4 + Math.sin(t * 7) * 0.3;
      else if (st === "asleep") ampRef.current = 0.04 + Math.sin(t * 0.5) * 0.02;
      else ampRef.current = 0.12 + Math.sin(t * 0.8) * 0.04;
    }, 30);
    return () => clearInterval(iv);
  }, []);

  // Star field background
  useEffect(() => {
    const c = bgCanvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const COUNT = 90;
    type P = { x: number; y: number; vx: number; vy: number; s: number; z: number };
    let parts: P[] = []; let w = 0, h = 0, dpr = 1;
    const seed = () => {
      dpr = window.devicePixelRatio || 1; w = c.width = c.clientWidth * dpr; h = c.height = c.clientHeight * dpr;
      parts = Array.from({ length: COUNT }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, s: (Math.random() * 1.4 + 0.3) * dpr, z: 0.35 + Math.random() * 0.65 }));
    };
    seed(); let t = 0;
    const draw = () => {
      if (c.clientWidth * (window.devicePixelRatio || 1) !== w) seed();
      ctx.clearRect(0, 0, w, h);
      // Deep orange ambient
      for (const b of [
        { x: w * (0.3 + Math.sin(t * 0.0005) * 0.08), y: h * (0.35 + Math.cos(t * 0.0004) * 0.06), r: Math.min(w, h) * 0.5 },
        { x: w * (0.72 + Math.cos(t * 0.0003) * 0.07), y: h * (0.6 + Math.sin(t * 0.0006) * 0.06), r: Math.min(w, h) * 0.42 },
      ]) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(${Math.floor(O.r * 0.4)},${Math.floor(O.g * 0.2)},0,0.10)`);
        g.addColorStop(1, "rgba(8,5,2,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      const mpx = mouseRef.current.x * 70 * dpr, mpy = mouseRef.current.y * 44 * dpr;
      const LINK = 110 * dpr; ctx.lineWidth = 1 * dpr;
      for (let i = 0; i < parts.length; i++) {
        const ang = Math.sin(parts[i].x * 0.0015 + t * 0.0018) + Math.cos(parts[i].y * 0.0015 - t * 0.0016);
        parts[i].vx = (parts[i].vx + Math.cos(ang) * 0.015 * dpr) * 0.94;
        parts[i].vy = (parts[i].vy + Math.sin(ang) * 0.015 * dpr) * 0.94;
        parts[i].x += parts[i].vx; parts[i].y += parts[i].vy;
        if (parts[i].x < 0) parts[i].x += w; if (parts[i].x > w) parts[i].x -= w;
        if (parts[i].y < 0) parts[i].y += h; if (parts[i].y > h) parts[i].y -= h;
      }
      const ppx = parts.map((p) => p.x + mpx * p.z);
      const ppy = parts.map((p) => p.y + mpy * p.z);
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
        const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y, d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          ctx.strokeStyle = `rgba(${rgbO},${(1 - Math.sqrt(d2) / LINK) * 0.12})`;
          ctx.beginPath(); ctx.moveTo(ppx[i], ppy[i]); ctx.lineTo(ppx[j], ppy[j]); ctx.stroke();
        }
      }
      for (let i = 0; i < parts.length; i++) {
        ctx.beginPath(); ctx.arc(ppx[i], ppy[i], parts[i].s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbOL},0.45)`; ctx.fill();
      }
      t += 1; bgRaf.current = requestAnimationFrame(draw);
    };
    bgRaf.current = requestAnimationFrame(draw);
    const onR = () => seed(); window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(bgRaf.current); window.removeEventListener("resize", onR); };
  }, []);

  // 2D orb canvas
  useEffect(() => {
    if (tab !== "rekvo") return;
    const c = orbCanvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let t = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1; const w = (c.width = c.clientWidth * dpr); const h = (c.height = c.clientHeight * dpr);
      ctx.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2, base = Math.min(w, h) * 0.21;
      const amp = ampRef.current;
      const tint = orbRef.current === "thinking" ? "255,180,60" : orbRef.current === "asleep" ? "100,70,40" : rgbO;
      const tintLt = orbRef.current === "thinking" ? "255,220,140" : orbRef.current === "asleep" ? "140,100,70" : rgbOL;
      if (!glOkRef.current) {
        const glow = ctx.createRadialGradient(cx, cy, base * 0.2, cx, cy, base * (1.7 + amp));
        glow.addColorStop(0, `rgba(${tint},${0.18 + amp * 0.38})`);
        glow.addColorStop(0.5, `rgba(${Math.floor(O.r * 0.5)},${Math.floor(O.g * 0.2)},0,0.06)`);
        glow.addColorStop(1, "rgba(8,5,2,0)");
        ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      }
      // Reactive outline
      ctx.beginPath(); const N = 110;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const wob = Math.sin(a * 7 + t * 0.07) * (2 + amp * 9);
        const r = base * (1 + amp * 0.5) + wob;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.strokeStyle = `rgba(${tint},${0.55 + amp * 0.45})`; ctx.lineWidth = 2 * dpr;
      ctx.shadowColor = `rgba(${tint},0.8)`; ctx.shadowBlur = 18 * dpr * (0.5 + amp); ctx.stroke(); ctx.shadowBlur = 0;
      // Arc rings
      if (powerRef.current > 0.5) {
        for (const rg of [{ r: base * 1.34, seg: 18, rot: t * 0.012, len: 0.5 }, { r: base * 1.54, seg: 24, rot: -t * 0.008, len: 0.32 }]) {
          ctx.lineWidth = 2 * dpr;
          for (let i = 0; i < rg.seg; i++) {
            const a0 = (i / rg.seg) * Math.PI * 2 + rg.rot, a1 = a0 + (Math.PI * 2 / rg.seg) * rg.len;
            ctx.beginPath(); ctx.arc(cx, cy, rg.r + amp * 10, a0, a1);
            ctx.strokeStyle = `rgba(${tint},${0.20 + amp * 0.28})`; ctx.stroke();
          }
        }
        for (let i = 0; i < 5; i++) {
          const a = t * 0.02 + (i / 5) * Math.PI * 2;
          const rr = base * (1.7 + Math.sin(t * 0.03 + i) * 0.12);
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.92;
          ctx.beginPath(); ctx.arc(x, y, (1.4 + amp * 2.5) * dpr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${tintLt},${0.5 + amp * 0.4})`; ctx.shadowColor = `rgba(${tint},0.9)`; ctx.shadowBlur = 8 * dpr; ctx.fill(); ctx.shadowBlur = 0;
        }
      }
      if (!glOkRef.current) {
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * (0.92 + amp * 0.3));
        core.addColorStop(0, `rgba(255,240,210,0.95)`); core.addColorStop(0.4, `rgba(${tint},${0.7 + amp * 0.3})`); core.addColorStop(1, `rgba(80,30,0,0.04)`);
        ctx.beginPath(); ctx.arc(cx, cy, base * (0.92 + amp * 0.3), 0, Math.PI * 2); ctx.fillStyle = core; ctx.fill();
      }
      for (let i = 1; i <= 3; i++) {
        const rot = t * 0.01 * (i % 2 ? 1 : -1);
        ctx.beginPath(); ctx.ellipse(cx, cy, base * (1.2 + i * 0.2) + amp * 8 * i, base * (1.05 + i * 0.16) + amp * 6 * i, rot, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${tint},${(0.14 / i)})`; ctx.lineWidth = 1 * dpr; ctx.stroke();
      }
      t += 1; raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [tab]);

  // WebGL volumetric core — festival orange plasma
  useEffect(() => {
    if (tab !== "rekvo") return;
    const c = glCanvas.current; if (!c) return;
    const gl = c.getContext("webgl", { alpha: true, premultipliedAlpha: false }); if (!gl) return;
    const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const FS = `precision highp float;
uniform vec2 u_res;uniform float u_t;uniform float u_amp;uniform vec3 u_tint;uniform float u_pow;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p=p*2.13+17.7;a*=.5;}return v;}
void main(){
vec2 uv=(gl_FragCoord.xy-.5*u_res)/min(u_res.x,u_res.y);
float r=length(uv);float R=.205*(1.+u_amp*.3);
vec2 sp=uv*(2.6+u_amp*1.4);
float sw=fbm(sp+vec2(u_t*.16,-u_t*.12)+fbm(sp*1.6+u_t*.07));
float depth=sqrt(max(0.,1.-(r/R)*(r/R)));
float plasma=sw*depth;
float rim=pow(smoothstep(R*1.06,R*.96,r)*smoothstep(R*.66,R*.96,r),1.4);
float glow=r>R?exp(-(r-R)*8.5):0.;
vec3 tint=u_tint/255.;
vec3 col=tint*.6*plasma*1.7+vec3(.99,.92,.78)*pow(plasma,3.)*1.35;
col+=tint*rim*(.85+u_amp*.7);col+=tint*glow*(.32+u_amp*.5);col*=u_pow;
float a=clamp(depth*(.25+plasma)+rim+glow*.55,0.,1.)*u_pow;
gl_FragColor=vec4(col,a);}`;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res"), uT = gl.getUniformLocation(prog, "u_t"),
      uAmp = gl.getUniformLocation(prog, "u_amp"), uTint = gl.getUniformLocation(prog, "u_tint"), uPow = gl.getUniformLocation(prog, "u_pow");
    glOkRef.current = true; let raf2 = 0; const gt0 = performance.now();
    const drawGl = () => {
      const dpr = window.devicePixelRatio || 1, cw = c.clientWidth * dpr, ch = c.clientHeight * dpr;
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; gl.viewport(0, 0, cw, ch); }
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, cw, ch); gl.uniform1f(uT, (performance.now() - gt0) / 1000);
      gl.uniform1f(uAmp, ampRef.current);
      const tn = tintRef.current; gl.uniform3f(uTint, tn[0], tn[1], tn[2]);
      gl.uniform1f(uPow, powerRef.current); gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf2 = requestAnimationFrame(drawGl);
    };
    raf2 = requestAnimationFrame(drawGl);
    return () => { cancelAnimationFrame(raf2); glOkRef.current = false; };
  }, [tab]);

  const sendChat = useCallback(async () => {
    const msg = chatInput.trim(); if (!msg || chatLoading) return;
    const k = keyRef.current; if (!k) return;
    setChatInput(""); setOrb("thinking");
    const newHistory: ChatMsg[] = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory); setChatLoading(true);
    try {
      const res = await fetch(`/api/nynaskalaset/chat?k=${encodeURIComponent(k)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: chatHistory }),
      });
      const data = await res.json();
      setChatHistory([...newHistory, { role: "assistant", content: data.reply ?? "Fel — kunde inte svara." }]);
      setOrb("speaking"); setTimeout(() => setOrb("idle"), 2000);
    } catch {
      setChatHistory([...newHistory, { role: "assistant", content: "Fel — kunde inte nå Rekvo." }]);
      setOrb("idle");
    } finally { setChatLoading(false); }
  }, [chatInput, chatHistory, chatLoading]);

  const sendTest = useCallback(async () => {
    const msg = testInput.trim(); if (!msg || testLoading) return;
    const k = keyRef.current; if (!k) { setNote("Ingen nyckel i URL:en"); return; }
    setTestInput("");
    const newMsgs: TestMsg[] = [...testMsgs, { role: "lead", content: msg }];
    setTestMsgs(newMsgs); setTestLoading(true);
    try {
      const res = await fetch(`/api/test?client_slug=nynaskalaset`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, client_slug: "nynaskalaset", session_id: "hq-test" }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.message ?? JSON.stringify(data);
      setTestMsgs([...newMsgs, { role: "ai", content: reply }]);
    } catch (e) {
      setTestMsgs([...newMsgs, { role: "ai", content: `Fel: ${e}` }]);
    } finally { setTestLoading(false); }
  }, [testInput, testMsgs, testLoading]);

  const toggleAI = useCallback(async () => {
    const k = keyRef.current; if (!k) return;
    // Toggle via Supabase directly through a simple API — for now just show note
    setNote(isActive ? "Pausa AI:n via Supabase → clients → nynaskalaset → is_active = false" : "Starta AI:n via Supabase → clients → nynaskalaset → is_active = true");
    setTimeout(() => setNote(""), 5000);
  }, [isActive]);

  const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div style={{ background: `rgba(${rgbO},0.10)`, border: `1px solid rgba(${rgbO},0.35)`, borderRadius: 14, padding: "20px 24px", minWidth: 155 }}>
      <div style={{ fontSize: 10, color: `rgba(255,210,160,0.85)`, letterSpacing: 2, fontFamily: "monospace", marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: `0 0 20px rgba(${rgbO},0.8)` }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: `rgba(255,200,140,0.65)`, marginTop: 6 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#080502", color: "#f0e8d8", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>
      {/* Starfield */}
      <canvas ref={bgCanvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />

      {/* Boot overlay */}
      {booting && (
        <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "#080502", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, letterSpacing: 4, color: `rgba(${rgbO},0.8)`, fontFamily: "monospace" }}>NYNÄSKALASET · FESTIVAL HQ</div>
          <div style={{ width: 200, height: 2, background: `rgba(${rgbO},0.15)`, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: `rgb(${rgbO})`, borderRadius: 2, animation: "boot-bar 1.8s ease-out forwards" }} />
          </div>
          <style>{`@keyframes boot-bar{from{width:0}to{width:100%}}`}</style>
        </div>
      )}

      {/* Header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: `1px solid rgba(${rgbO},0.1)` }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, color: "#f0e8d8" }}>NYNÄSKALASET</div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: `rgba(${rgbO},0.7)`, fontFamily: "monospace" }}>FESTIVAL HQ · 2026</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["rekvo", "stats", "test"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 18px", borderRadius: 20, fontSize: 11, letterSpacing: 2, fontFamily: "monospace", fontWeight: 700, cursor: "pointer",
              border: `1px solid rgba(${rgbO},${tab === t ? 0.9 : 0.25})`,
              background: tab === t ? `linear-gradient(90deg,rgb(${rgbO}),rgb(${Math.floor(O.r * 0.7)},${Math.floor(O.g * 0.5)},0))` : `rgba(${rgbO},0.05)`,
              color: tab === t ? "#fff" : `rgba(${rgbOL},0.8)`,
              boxShadow: tab === t ? `0 0 20px rgba(${rgbO},0.4)` : "none",
              transition: "all .2s",
            }}>
              {t === "rekvo" ? "REKVO" : t === "stats" ? "STATISTIK" : "TESTA AI"}
            </button>
          ))}
        </div>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? "#4ade80" : "#f87171", boxShadow: `0 0 8px ${isActive ? "#4ade80" : "#f87171"}` }} />
          <div style={{ fontSize: 11, letterSpacing: 2, fontFamily: "monospace", color: isActive ? "#4ade80" : "#f87171" }}>{isActive ? "AKTIV" : "PAUSAD"}</div>
        </div>
      </div>

      {/* Bottom left — system status */}
      <div style={{ position: "absolute", bottom: 24, left: 28, zIndex: 10, fontFamily: "monospace", fontSize: 10, letterSpacing: 2, lineHeight: 2 }}>
        {[["FB-LÄNK", "OK"], ["AI-KÄRNA", "OK"], ["MESSENGER", stats ? "OK" : "–"], ["DATABAS", stats ? "OK" : "–"]].map(([l, v]) => (
          <div key={l} style={{ display: "flex", gap: 16 }}>
            <span style={{ color: `rgba(${rgbO},0.5)`, width: 90 }}>{l}</span>
            <span style={{ color: v === "OK" ? `rgb(${rgbO})` : "#666" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Bottom right — countdown */}
      <div style={{ position: "absolute", bottom: 24, right: 28, zIndex: 10, textAlign: "right", fontFamily: "monospace" }}>
        {note && <div style={{ fontSize: 11, color: `rgb(${rgbOL})`, marginBottom: 8, maxWidth: 300, textAlign: "right" }}>{note}</div>}
        <div style={{ fontSize: 10, letterSpacing: 2, color: `rgba(${rgbO},0.6)`, marginBottom: 4 }}>TILL EVENTET</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: `rgb(${rgbOL})` }}>
          {countdown.daysLeft}d {countdown.hoursLeft}h
        </div>
        <div style={{ fontSize: 10, color: `rgba(${rgbO},0.5)`, letterSpacing: 1 }}>7 – 8 AUG · NYNÄSHAMN</div>
      </div>

      {/* Main content */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>

        {/* REKVO TAB — orb + chat */}
        {tab === "rekvo" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 800, gap: 24 }}>
            {/* Orb */}
            <div style={{ position: "relative", width: 260, height: 260, cursor: "pointer" }} onClick={() => {}}>
              <canvas ref={glCanvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
              <canvas ref={orbCanvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, pointerEvents: "none" }}>
                <div style={{ fontSize: 12, letterSpacing: 4, fontFamily: "monospace", color: `rgba(${rgbOL},0.9)`, textShadow: `0 0 14px rgba(${rgbO},0.8)` }}>
                  {orb === "thinking" ? "TÄNKER" : orb === "speaking" ? "SVARAR" : orb === "asleep" ? "VILOLÄGE" : "REKVO"}
                </div>
              </div>
            </div>

            {/* Chat */}
            <div style={{ width: "100%", background: `rgba(${rgbO},0.04)`, border: `1px solid rgba(${rgbO},0.15)`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(${rgbO},0.1)`, fontSize: 10, letterSpacing: 2, fontFamily: "monospace", color: `rgba(${rgbO},0.6)` }}>
                REKVO · FESTIVAL AI-ASSISTENT
              </div>
              <div style={{ height: 200, overflowY: "auto", padding: "16px" }}>
                {chatHistory.length === 0 && (
                  <div style={{ color: `rgba(${rgbO},0.4)`, fontSize: 13, fontStyle: "italic" }}>
                    Fråga Rekvo om konversationer, statistik eller vad som händer just nu...
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{
                      maxWidth: "80%", padding: "8px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                      background: m.role === "user" ? `linear-gradient(90deg,rgb(${rgbO}),rgb(${Math.floor(O.r * 0.7)},${Math.floor(O.g * 0.5)},0))` : `rgba(${rgbO},0.1)`,
                      border: m.role === "assistant" ? `1px solid rgba(${rgbO},0.2)` : "none",
                      color: m.role === "user" ? "#fff" : "#f0e8d8",
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ color: `rgba(${rgbO},0.6)`, fontSize: 13 }}>Rekvo tänker...</div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: "12px 16px", borderTop: `1px solid rgba(${rgbO},0.1)`, display: "flex", gap: 8 }}>
                <input
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Fråga Rekvo något..."
                  style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid rgba(${rgbO},0.2)`, borderRadius: 8, padding: "8px 14px", color: "#f0e8d8", fontSize: 13, outline: "none" }}
                />
                <button onClick={sendChat} disabled={chatLoading} style={{
                  padding: "8px 18px", borderRadius: 8, background: `linear-gradient(90deg,rgb(${rgbO}),rgb(${Math.floor(O.r * 0.7)},${Math.floor(O.g * 0.5)},0))`,
                  border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
                }}>
                  SKICKA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {tab === "stats" && (
          <div style={{ width: "100%", maxWidth: 1100, padding: "0 24px", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, fontFamily: "monospace", color: `rgba(${rgbO},0.5)`, marginBottom: 20, textAlign: "center" }}>
              LIVE STATISTIK · NYNÄSKALASET · {new Date().toLocaleDateString("sv-SE")}
            </div>

            {/* FUNNEL FLOW */}
            <div style={{ marginBottom: 20, padding: "18px 24px", background: `rgba(${rgbO},0.06)`, border: `1px solid rgba(${rgbO},0.2)`, borderRadius: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, fontFamily: "monospace", color: `rgba(${rgbO},0.6)`, marginBottom: 16 }}>FESTIVALFUNNEL — DM → BILJETT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
                {[
                  { label: "DMs MOTTAGNA", value: stats?.totalLeads ?? 0, sub: "totalt" },
                  { label: "ENGAGERADE", value: stats?.activeConvs ?? 0, sub: "senaste 24h" },
                  { label: "LÄNK SKICKAD", value: stats?.linkSentCount ?? 0, sub: "rekommenderade" },
                  { label: "BILJETTER SÅLDA", value: stats?.ticketsSold ?? 0, sub: "bekräftade" },
                  { label: "INTÄKT (EST.)", value: stats ? `${(stats.estimatedRevenue ?? 0).toLocaleString("sv-SE")} kr` : "0 kr", sub: "via AI" },
                ].map((s, i, arr) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 120 }}>
                    <div style={{ flex: 1, textAlign: "center", padding: "12px 8px", background: `rgba(${rgbO},${0.06 + i * 0.04})`, borderRadius: 10, border: `1px solid rgba(${rgbO},0.25)` }}>
                      <div style={{ fontSize: 9, letterSpacing: 2, fontFamily: "monospace", color: `rgba(255,210,160,0.7)`, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: `0 0 16px rgba(${rgbO},0.7)` }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: `rgba(${rgbO},0.6)`, marginTop: 4 }}>{s.sub}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ color: `rgba(${rgbO},0.4)`, fontSize: 18, padding: "0 4px", flexShrink: 0 }}>→</div>
                    )}
                  </div>
                ))}
              </div>
              {stats && stats.totalLeads > 0 && (
                <div style={{ display: "flex", gap: 32, marginTop: 14, paddingTop: 14, borderTop: `1px solid rgba(${rgbO},0.12)` }}>
                  <div style={{ fontSize: 11, color: `rgba(255,200,140,0.7)` }}>
                    Konverteringsgrad: <strong style={{ color: "#fff" }}>{stats.ticketsSold > 0 ? ((stats.ticketsSold / stats.totalLeads) * 100).toFixed(1) : "0"}%</strong>
                  </div>
                  <div style={{ fontSize: 11, color: `rgba(255,200,140,0.7)` }}>
                    AI-svar skickade: <strong style={{ color: "#fff" }}>{stats.dmsSentTotal}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: `rgba(255,200,140,0.7)` }}>
                    Nya idag: <strong style={{ color: "#fff" }}>{stats.leadsToday}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: `rgba(255,200,140,0.7)` }}>
                    AI-svar idag: <strong style={{ color: "#fff" }}>{stats.dmsSentToday}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* ROW: BILJETTER + FACEBOOK */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Ticket breakdown */}
              <div style={{ padding: "18px 20px", background: `rgba(${rgbO},0.06)`, border: `1px solid rgba(${rgbO},0.2)`, borderRadius: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, fontFamily: "monospace", color: `rgba(${rgbO},0.6)`, marginBottom: 14 }}>BILJETTER PER TYP</div>
                {(!stats?.ticketsByType?.length) ? (
                  <div style={{ fontSize: 13, color: `rgba(${rgbO},0.4)`, fontStyle: "italic" }}>inga sålda via AI ännu</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {stats.ticketsByType.map((t) => {
                      const pct = stats.ticketsSold > 0 ? (t.count / stats.ticketsSold) * 100 : 0;
                      return (
                        <div key={t.type}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "rgba(255,210,160,0.9)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "monospace" }}>{t.type}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.count}</span>
                          </div>
                          <div style={{ height: 4, background: `rgba(${rgbO},0.15)`, borderRadius: 2 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `rgb(${rgbO})`, borderRadius: 2, boxShadow: `0 0 8px rgba(${rgbO},0.6)` }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid rgba(${rgbO},0.12)`, fontSize: 12, color: "rgba(255,200,140,0.7)" }}>
                      Estimerad intäkt: <strong style={{ color: "#fff" }}>{(stats.estimatedRevenue ?? 0).toLocaleString("sv-SE")} kr</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Facebook followers */}
              <div style={{ padding: "18px 20px", background: `rgba(${rgbO},0.06)`, border: `1px solid rgba(${rgbO},0.2)`, borderRadius: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, fontFamily: "monospace", color: `rgba(${rgbO},0.6)`, marginBottom: 14 }}>FACEBOOK · FÖLJARE</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: `0 0 20px rgba(${rgbO},0.7)` }}>
                  {(stats?.fbFollowers ?? 0).toLocaleString("sv-SE")}
                </div>
                <div style={{ fontSize: 11, color: `rgba(${rgbO},0.6)`, marginTop: 6, marginBottom: 16 }}>totalt antal följare</div>
                {stats && stats.fbFollowersYesterday > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: stats.fbFollowers >= stats.fbFollowersYesterday ? "#4ade80" : "#f87171" }}>
                      {stats.fbFollowers >= stats.fbFollowersYesterday ? "▲" : "▼"} {Math.abs(stats.fbFollowers - stats.fbFollowersYesterday).toLocaleString("sv-SE")}
                    </div>
                    <div style={{ fontSize: 11, color: `rgba(${rgbO},0.6)` }}>sedan igår</div>
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 10, color: `rgba(${rgbO},0.35)`, fontFamily: "monospace" }}>uppdateras manuellt · FB API kommer</div>
              </div>
            </div>

            {/* ROW: Stage breakdown + AI toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, marginBottom: 20 }}>
              <div style={{ padding: "18px 20px", background: `rgba(${rgbO},0.06)`, border: `1px solid rgba(${rgbO},0.2)`, borderRadius: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, fontFamily: "monospace", color: `rgba(${rgbO},0.6)`, marginBottom: 14 }}>VAR LEADS BEFINNER SIG</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { key: "opener", label: "OPENER" },
                    { key: "qualify_day", label: "VILKEN DAG" },
                    { key: "recommend", label: "REKOMMENDERAT" },
                    { key: "handle_question", label: "FRÅGOR" },
                    { key: "close", label: "AVSLUT" },
                    { key: "nurture", label: "NURTURE" },
                  ].map(({ key, label }) => {
                    const count = stats?.stageCount?.[key] ?? 0;
                    return (
                      <div key={key} style={{ background: `rgba(${rgbO},${count > 0 ? 0.15 : 0.05})`, border: `1px solid rgba(${rgbO},${count > 0 ? 0.4 : 0.15})`, borderRadius: 8, padding: "8px 14px", textAlign: "center", minWidth: 90 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: count > 0 ? "#fff" : `rgba(${rgbO},0.4)` }}>{count}</div>
                        <div style={{ fontSize: 9, letterSpacing: 1, fontFamily: "monospace", color: `rgba(255,200,140,0.6)`, marginTop: 3 }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                <button onClick={toggleAI} style={{
                  padding: "14px 28px", borderRadius: 12, border: `1px solid rgba(${isActive ? "248,113,113" : "74,222,128"},0.5)`,
                  background: `rgba(${isActive ? "248,113,113" : "74,222,128"},0.1)`, color: isActive ? "#f87171" : "#4ade80",
                  fontSize: 12, letterSpacing: 2, fontFamily: "monospace", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  {isActive ? "⏸ PAUSA AI" : "▶ STARTA AI"}
                </button>
                <div style={{ textAlign: "center", fontSize: 10, fontFamily: "monospace", color: `rgba(${rgbO},0.5)` }}>
                  {countdown.daysLeft}d {countdown.hoursLeft}h kvar
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST TAB */}
        {tab === "test" && (
          <div style={{ width: "100%", maxWidth: 520, padding: "0 16px" }}>
            {/* Facebook Messenger style header */}
            <div style={{ background: "#1877F2", borderRadius: "16px 16px 0 0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎪</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Nynäskalaset</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>Svarar vanligtvis direkt</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", letterSpacing: 1 }}>SIMULERING</div>
            </div>

            {/* Chat area */}
            <div style={{ background: "#fff", height: 420, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {testMsgs.length === 0 && (
                <div style={{ color: "#8a8a8a", fontSize: 13, textAlign: "center", marginTop: 80, lineHeight: 1.6 }}>
                  Skriv precis som en festivalbesökare skulle på Facebook<br/>
                  <span style={{ fontSize: 12, color: "#bbb" }}>t.ex. "BILJETT" eller "vad kostar fredag?"</span>
                </div>
              )}
              {testMsgs.map((m, i) => {
                const isLead = m.role === "lead";
                const parts = m.content.split("[[SPLIT]]").map(s => s.trim()).filter(Boolean);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: isLead ? "row-reverse" : "row", alignItems: "flex-end", gap: 6 }}>
                    {!isLead && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🎪</div>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: isLead ? "flex-end" : "flex-start", maxWidth: "72%" }}>
                      {parts.map((p, pi) => (
                        <div key={pi} style={{
                          padding: "10px 14px", borderRadius: isLead ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          background: isLead ? "#1877F2" : "#f0f0f0",
                          color: isLead ? "#fff" : "#050505",
                          fontSize: 14, lineHeight: 1.5,
                        }}>{p}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {testLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎪</div>
                  <div style={{ background: "#f0f0f0", borderRadius: "18px 18px 18px 4px", padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#999", animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={testEndRef} />
              <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
            </div>

            {/* Input bar */}
            <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", borderRadius: "0 0 16px 16px", padding: "10px 12px", display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={testInput} onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendTest()}
                placeholder="Aa"
                style={{ flex: 1, background: "#f0f0f0", border: "none", borderRadius: 20, padding: "9px 16px", color: "#050505", fontSize: 14, outline: "none" }}
              />
              <button onClick={sendTest} disabled={testLoading} style={{
                width: 36, height: 36, borderRadius: "50%", background: "#1877F2",
                border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>➤</button>
            </div>

            <div style={{ marginTop: 8, textAlign: "center" }}>
              <button onClick={() => setTestMsgs([])} style={{ background: "none", border: "none", color: `rgba(${rgbO},0.5)`, fontSize: 11, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>
                RENSA KONVERSATION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
