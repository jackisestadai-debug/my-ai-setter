"use client";

/**
 * Rekvo AI Setter — test-chatt.
 * Du skriver som en klinik, AI:n svarar som Jack.
 * Använder exakt samma motor och prompt som i produktion.
 */

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "lead" | "ai";
  content: string;
}

const ACCESS_KEY = "svea-hq-2024";

export default function TestChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [sessionId] = useState(() => `test-${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function startChat() {
    setStarted(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);

    const leadMsg: Msg = { role: "lead", content: text };
    const next = [...msgs, leadMsg];
    setMsgs(next);

    try {
      const res = await fetch("/api/test-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history: next, sessionId, k: ACCESS_KEY }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const reply = data.reply ?? "…";
      setMsgs([...next, { role: "ai", content: reply }]);
    } catch {
      setMsgs([...next, { role: "ai", content: "(fel — försök igen)" }]);
    }
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .page {
          min-height: 100dvh;
          display: flex; flex-direction: column; align-items: center;
          background: radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 80%, rgba(126,184,212,0.05) 0%, transparent 60%), #0d0d0d;
        }
        .header {
          width: 100%; max-width: 520px;
          padding: 28px 20px 16px;
          display: flex; align-items: center; gap: 14px;
        }
        .avatar {
          width: 46px; height: 46px; border-radius: 50%;
          background: linear-gradient(135deg, #c9a84c, #7eb8d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: #0d0d0d;
          flex-shrink: 0; box-shadow: 0 0 20px rgba(201,168,76,0.35);
        }
        .header-name { font-size: 15px; font-weight: 700; color: #f5f0e1; letter-spacing: 0.02em; }
        .header-sub { font-size: 12px; color: rgba(200,190,150,0.5); margin-top: 2px; }
        .online-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: #5de87a; margin-right: 5px; box-shadow: 0 0 6px rgba(93,232,122,0.7);
        }
        .badge {
          margin-left: auto;
          font-size: 10px; letter-spacing: 0.1em; color: rgba(201,168,76,0.5);
          border: 1px solid rgba(201,168,76,0.2); border-radius: 20px;
          padding: 4px 10px;
        }
        .divider {
          width: 100%; max-width: 520px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent);
          margin-bottom: 8px;
        }
        .feed {
          flex: 1; width: 100%; max-width: 520px;
          padding: 16px 20px 8px;
          display: flex; flex-direction: column; gap: 10px; overflow-y: auto;
        }
        .bubble-wrap { display: flex; align-items: flex-end; gap: 8px; }
        .bubble-wrap.lead { flex-direction: row-reverse; }
        .bubble-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #c9a84c, #7eb8d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #0d0d0d; flex-shrink: 0;
        }
        .bubble-wrap.lead .bubble-avatar { background: rgba(255,255,255,0.08); font-size: 15px; font-weight: 400; color: #fff; }
        .bubble {
          max-width: 78%; padding: 11px 15px; border-radius: 18px;
          font-size: 14px; line-height: 1.55; color: #f0ecff;
          white-space: pre-wrap;
        }
        .bubble.jack {
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2);
          border-bottom-left-radius: 4px; color: #f5f0e1;
        }
        .bubble.clinic {
          background: rgba(126,184,212,0.12); border: 1px solid rgba(126,184,212,0.2);
          border-bottom-right-radius: 4px; text-align: right;
        }
        .typing { display: flex; gap: 4px; align-items: center; padding: 13px 16px; }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(201,168,76,0.6); animation: bop 1.2s infinite ease-in-out;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bop {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .composer {
          width: 100%; max-width: 520px;
          padding: 12px 20px 28px; display: flex; gap: 10px; align-items: center;
        }
        .composer input {
          flex: 1; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.18); border-radius: 24px;
          padding: 12px 18px; font-size: 14px; color: #f5f0e1; outline: none; transition: border-color 0.2s;
        }
        .composer input::placeholder { color: rgba(200,190,150,0.3); }
        .composer input:focus { border-color: rgba(201,168,76,0.45); }
        .send-btn {
          width: 42px; height: 42px; border-radius: 50%;
          background: linear-gradient(135deg, #c9a84c, #7eb8d4);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; transition: opacity 0.2s, transform 0.1s; flex-shrink: 0;
        }
        .send-btn:hover { opacity: 0.9; }
        .send-btn:active { transform: scale(0.94); }
        .send-btn:disabled { opacity: 0.3; cursor: default; }
        .gate {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 20px; padding: 40px 20px; text-align: center;
        }
        .gate-logo {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #c9a84c, #7eb8d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; font-weight: 800; color: #0d0d0d;
          box-shadow: 0 0 40px rgba(201,168,76,0.25);
        }
        .gate-title { font-size: 22px; font-weight: 700; color: #f5f0e1; }
        .gate-sub { font-size: 14px; color: rgba(200,190,150,0.5); max-width: 300px; line-height: 1.7; }
        .gate-btn {
          padding: 14px 36px; border-radius: 50px;
          background: linear-gradient(135deg, #c9a84c, #7eb8d4);
          border: none; font-size: 15px; font-weight: 600; color: #0d0d0d;
          cursor: pointer; letter-spacing: 0.02em;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 0 24px rgba(201,168,76,0.25);
        }
        .gate-btn:hover { opacity: 0.9; }
        .gate-btn:active { transform: scale(0.97); }
        .label {
          font-size: 11px; color: rgba(200,190,150,0.25); text-align: center;
          padding: 0 20px 6px; letter-spacing: 0.06em; text-transform: uppercase;
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="avatar">R</div>
          <div>
            <div className="header-name">Jack · Rekvo</div>
            <div className="header-sub">
              <span className="online-dot" />
              AI Setter · live test
            </div>
          </div>
          <div className="badge">REKVO TEST</div>
        </div>

        <div className="divider" />

        {!started ? (
          <div className="gate">
            <div className="gate-logo">R</div>
            <div className="gate-title">Testa Rekvo AI Setter</div>
            <div className="gate-sub">
              Du spelar en skönhetsklinik. AI:n svarar som Jack med den riktiga motorn och prompten.
            </div>
            <div className="gate-sub" style={{ fontSize: 13 }}>
              Börja med att svara på Jacks opener:<br />
              <em style={{ color: "rgba(201,168,76,0.7)" }}>"Hej, har ni några lediga tider nångån kommande 1-2 veckor?"</em>
            </div>
            <button className="gate-btn" onClick={startChat}>Starta test</button>
          </div>
        ) : (
          <>
            <div className="feed">
              <div className="bubble-wrap">
                <div className="bubble-avatar">R</div>
                <div className="bubble jack">
                  Hej, har ni några lediga tider nångån kommande 1-2 veckor?
                </div>
              </div>
              {msgs.map((m, i) => (
                <div key={i} className={`bubble-wrap ${m.role === "lead" ? "lead" : ""}`}>
                  <div className="bubble-avatar">{m.role === "ai" ? "R" : "🏥"}</div>
                  <div className={`bubble ${m.role === "ai" ? "jack" : "clinic"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="bubble-wrap">
                  <div className="bubble-avatar">R</div>
                  <div className="bubble jack typing">
                    <div className="dot" /><div className="dot" /><div className="dot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="label">Du är kliniken · tryck enter för att skicka</div>

            <div className="composer">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Svara som kliniken..."
                disabled={busy}
              />
              <button className="send-btn" onClick={send} disabled={busy || !input.trim()}>➤</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
