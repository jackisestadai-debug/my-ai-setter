"use client";

/**
 * Glow Studio — Ella live demo-chatt.
 * Används på säljsamtal: prospektet skriver som en patient, Ella svarar.
 * Ingen inloggning krävs — öppen URL att dela på mötet.
 */

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function EllaDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function startChat() {
    setStarted(true);
    setBusy(true);
    const res = await fetch("/api/klinik-demo/receptionist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ history: [] }),
    });
    const data = (await res.json()) as { reply?: string };
    setMsgs([{ role: "assistant", content: data.reply ?? "Hej! Välkommen till Glow Studio 🌸" }]);
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");

    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setBusy(true);

    const res = await fetch("/api/klinik-demo/receptionist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ history: next }),
    });
    const data = (await res.json()) as { reply?: string };
    setMsgs([...next, { role: "assistant", content: data.reply ?? "..." }]);
    setBusy(false);
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        .page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: radial-gradient(ellipse at 30% 20%, rgba(180,140,220,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 80%, rgba(120,180,220,0.06) 0%, transparent 60%),
                      #0d0d0d;
        }

        .header {
          width: 100%;
          max-width: 520px;
          padding: 28px 20px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar {
          width: 46px; height: 46px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c9a8d4, #7eb8d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(180,140,220,0.3);
        }

        .header-info {}
        .header-name {
          font-size: 15px; font-weight: 700; color: #f0eaff;
          letter-spacing: 0.02em;
        }
        .header-sub {
          font-size: 12px; color: rgba(200,190,220,0.55);
          margin-top: 2px;
        }
        .online-dot {
          display: inline-block;
          width: 7px; height: 7px; border-radius: 50%;
          background: #5de87a;
          margin-right: 5px;
          box-shadow: 0 0 6px rgba(93,232,122,0.7);
        }

        .divider {
          width: 100%; max-width: 520px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(180,140,220,0.2), transparent);
          margin-bottom: 8px;
        }

        .feed {
          flex: 1;
          width: 100%; max-width: 520px;
          padding: 16px 20px 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
        }

        .bubble-wrap {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .bubble-wrap.user { flex-direction: row-reverse; }

        .bubble-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c9a8d4, #7eb8d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .bubble-wrap.user .bubble-avatar {
          background: rgba(255,255,255,0.1);
        }

        .bubble {
          max-width: 78%;
          padding: 11px 15px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          color: #f0ecff;
        }
        .bubble.ella {
          background: rgba(180,140,220,0.14);
          border: 1px solid rgba(180,140,220,0.22);
          border-bottom-left-radius: 4px;
        }
        .bubble.user-b {
          background: rgba(126,184,212,0.18);
          border: 1px solid rgba(126,184,212,0.26);
          border-bottom-right-radius: 4px;
          text-align: right;
        }

        .typing {
          display: flex; gap: 4px; align-items: center;
          padding: 13px 16px;
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(180,140,220,0.6);
          animation: bop 1.2s infinite ease-in-out;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bop {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        .composer {
          width: 100%; max-width: 520px;
          padding: 12px 20px 28px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .composer input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(180,140,220,0.2);
          border-radius: 24px;
          padding: 12px 18px;
          font-size: 14px;
          color: #f0ecff;
          outline: none;
          transition: border-color 0.2s;
        }
        .composer input::placeholder { color: rgba(200,190,220,0.35); }
        .composer input:focus { border-color: rgba(180,140,220,0.5); }

        .send-btn {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c9a8d4, #7eb8d4);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          transition: opacity 0.2s, transform 0.1s;
          flex-shrink: 0;
        }
        .send-btn:hover { opacity: 0.9; }
        .send-btn:active { transform: scale(0.94); }
        .send-btn:disabled { opacity: 0.35; cursor: default; }

        /* Start gate */
        .gate {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 40px 20px;
          text-align: center;
        }
        .gate-logo {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #c9a8d4, #7eb8d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 34px;
          box-shadow: 0 0 40px rgba(180,140,220,0.25);
        }
        .gate-title {
          font-size: 22px; font-weight: 700;
          color: #f0eaff; letter-spacing: 0.02em;
        }
        .gate-sub {
          font-size: 14px; color: rgba(200,190,220,0.55);
          max-width: 280px; line-height: 1.6;
        }
        .gate-btn {
          padding: 14px 36px;
          border-radius: 50px;
          background: linear-gradient(135deg, #c9a8d4, #7eb8d4);
          border: none;
          font-size: 15px; font-weight: 600;
          color: #0d0d0d;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 0 24px rgba(180,140,220,0.3);
        }
        .gate-btn:hover { opacity: 0.9; }
        .gate-btn:active { transform: scale(0.97); }

        .label {
          font-size: 11px;
          color: rgba(200,190,220,0.3);
          text-align: center;
          padding: 0 20px 6px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="avatar">🌸</div>
          <div className="header-info">
            <div className="header-name">Ella · Glow Studio</div>
            <div className="header-sub">
              <span className="online-dot" />
              AI-receptionist · svarar direkt
            </div>
          </div>
        </div>

        <div className="divider" />

        {!started ? (
          <div className="gate">
            <div className="gate-logo">🌸</div>
            <div>
              <div className="gate-title">Glow Studio</div>
              <div className="gate-sub" style={{ marginTop: 8 }}>Din skönhet, vårt hantverk</div>
            </div>
            <div className="gate-sub">
              Skriv ett meddelande så svarar Ella — precis som en riktig patient skulle göra.
            </div>
            <button className="gate-btn" onClick={startChat}>
              Starta konversation
            </button>
          </div>
        ) : (
          <>
            <div className="feed">
              {msgs.map((m, i) => (
                <div key={i} className={`bubble-wrap ${m.role === "user" ? "user" : ""}`}>
                  <div className="bubble-avatar">
                    {m.role === "assistant" ? "🌸" : "👤"}
                  </div>
                  <div className={`bubble ${m.role === "assistant" ? "ella" : "user-b"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="bubble-wrap">
                  <div className="bubble-avatar">🌸</div>
                  <div className="bubble ella typing">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="label">Skriv som en patient · tryck enter för att skicka</div>

            <div className="composer">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Skriv ett meddelande..."
                disabled={busy}
              />
              <button className="send-btn" onClick={send} disabled={busy || !input.trim()}>
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
