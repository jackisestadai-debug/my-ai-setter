"use client";

/**
 * Nordic Solar — Nova live demo-chatt.
 * Används på säljsamtal: prospektet skriver som en lead, Nova svarar.
 * Ingen inloggning krävs — öppen URL att dela på mötet.
 */

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function NovaDemo() {
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
    const res = await fetch("/api/nordic-solar-demo/receptionist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ history: [] }),
    });
    const data = (await res.json()) as { reply?: string };
    setMsgs([{ role: "assistant", content: data.reply ?? "Hej! Välkommen till Nordic Solar ☀️" }]);
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

    const res = await fetch("/api/nordic-solar-demo/receptionist", {
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
        body { background: #080d14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        .page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: radial-gradient(ellipse at 20% 10%, rgba(210,155,30,0.07) 0%, transparent 55%),
                      radial-gradient(ellipse at 80% 90%, rgba(30,80,160,0.08) 0%, transparent 55%),
                      radial-gradient(ellipse at 50% 50%, rgba(210,155,30,0.03) 0%, transparent 70%),
                      #080d14;
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
          background: linear-gradient(135deg, #d4961e, #1a4fa0);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(210,150,30,0.3);
        }

        .header-info {}
        .header-name {
          font-size: 15px; font-weight: 700; color: #f0f4ff;
          letter-spacing: 0.02em;
        }
        .header-sub {
          font-size: 12px; color: rgba(180,195,230,0.5);
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
          background: linear-gradient(90deg, transparent, rgba(210,150,30,0.2), transparent);
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
          background: linear-gradient(135deg, #d4961e, #1a4fa0);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .bubble-wrap.user .bubble-avatar {
          background: rgba(255,255,255,0.08);
        }

        .bubble {
          max-width: 78%;
          padding: 11px 15px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          color: #eef2ff;
        }
        .bubble.nova {
          background: rgba(210,150,30,0.1);
          border: 1px solid rgba(210,150,30,0.2);
          border-bottom-left-radius: 4px;
        }
        .bubble.user-b {
          background: rgba(30,80,160,0.18);
          border: 1px solid rgba(30,80,160,0.28);
          border-bottom-right-radius: 4px;
          text-align: right;
        }

        .typing {
          display: flex; gap: 4px; align-items: center;
          padding: 13px 16px;
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(210,150,30,0.6);
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
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(210,150,30,0.18);
          border-radius: 24px;
          padding: 12px 18px;
          font-size: 14px;
          color: #eef2ff;
          outline: none;
          transition: border-color 0.2s;
        }
        .composer input::placeholder { color: rgba(180,195,230,0.3); }
        .composer input:focus { border-color: rgba(210,150,30,0.45); }

        .send-btn {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4961e, #1a4fa0);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          transition: opacity 0.2s, transform 0.1s;
          flex-shrink: 0;
          box-shadow: 0 0 16px rgba(210,150,30,0.25);
        }
        .send-btn:hover { opacity: 0.9; }
        .send-btn:active { transform: scale(0.94); }
        .send-btn:disabled { opacity: 0.3; cursor: default; }

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
          width: 80px; height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d4961e, #1a4fa0);
          display: flex; align-items: center; justify-content: center;
          font-size: 38px;
          box-shadow: 0 0 48px rgba(210,150,30,0.25);
        }
        .gate-title {
          font-size: 22px; font-weight: 700;
          color: #f0f4ff; letter-spacing: 0.04em;
        }
        .gate-tagline {
          font-size: 13px; color: rgba(210,150,30,0.7);
          letter-spacing: 0.06em; text-transform: uppercase;
          margin-top: 4px;
        }
        .gate-sub {
          font-size: 14px; color: rgba(180,195,230,0.5);
          max-width: 280px; line-height: 1.6;
        }
        .gate-btn {
          padding: 14px 36px;
          border-radius: 50px;
          background: linear-gradient(135deg, #d4961e, #1a5fc0);
          border: none;
          font-size: 15px; font-weight: 600;
          color: #fff;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 0 28px rgba(210,150,30,0.3);
        }
        .gate-btn:hover { opacity: 0.9; }
        .gate-btn:active { transform: scale(0.97); }

        .label {
          font-size: 11px;
          color: rgba(180,195,230,0.25);
          text-align: center;
          padding: 0 20px 6px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="avatar">☀️</div>
          <div className="header-info">
            <div className="header-name">Nova · Nordic Solar</div>
            <div className="header-sub">
              <span className="online-dot" />
              AI-energirådgivare · svarar direkt
            </div>
          </div>
        </div>

        <div className="divider" />

        {!started ? (
          <div className="gate">
            <div className="gate-logo">☀️</div>
            <div>
              <div className="gate-title">Nordic Solar</div>
              <div className="gate-tagline">Mer energi. Lägre räkning.</div>
            </div>
            <div className="gate-sub">
              Skriv ett meddelande så svarar Nova — precis som en riktig lead skulle göra.
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
                    {m.role === "assistant" ? "☀️" : "👤"}
                  </div>
                  <div className={`bubble ${m.role === "assistant" ? "nova" : "user-b"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="bubble-wrap">
                  <div className="bubble-avatar">☀️</div>
                  <div className="bubble nova typing">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="label">Skriv som en lead · tryck enter för att skicka</div>

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
