"use client";

export default function GlowDashboard() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e8e0ff; }
        .page { padding: 24px 28px; min-height: 100vh; }
        h2 { font-size: 11px; color: rgba(200,190,220,0.4); letter-spacing: 0.1em; text-transform: uppercase; margin: 28px 0 14px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        h2:first-child { margin-top: 0; }

        /* Stat grids */
        .grid { display: grid; gap: 12px; margin-bottom: 4px; }
        .g2 { grid-template-columns: repeat(2, 1fr); }
        .g3 { grid-template-columns: repeat(3, 1fr); }
        .g4 { grid-template-columns: repeat(4, 1fr); }
        .g5 { grid-template-columns: repeat(5, 1fr); }
        .g6 { grid-template-columns: repeat(6, 1fr); }

        .stat {
          background: rgba(180,140,220,0.07);
          border: 1px solid rgba(180,140,220,0.15);
          border-radius: 10px;
          padding: 14px 16px;
        }
        .stat-label { font-size: 11px; color: rgba(200,190,220,0.4); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
        .stat-value { font-size: 22px; font-weight: 700; color: #f0eaff; }
        .stat-sub { font-size: 11px; color: rgba(180,140,220,0.55); margin-top: 4px; }
        .stat.accent .stat-value { color: #c9a8d4; }
        .stat.green .stat-value { color: #5de87a; }

        /* Funnel bars */
        .funnel { display: flex; flex-direction: column; gap: 10px; }
        .frow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .flabel { font-size: 13px; color: rgba(200,190,220,0.7); min-width: 160px; }
        .fright { display: flex; align-items: center; gap: 10px; }
        .fbar { width: 100px; height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
        .fbar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #8b5cf6, #c9a8d4); }
        .fval { font-size: 13px; font-weight: 600; color: #f0eaff; min-width: 40px; text-align: right; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; font-size: 11px; color: rgba(200,190,220,0.35); letter-spacing: 0.06em; text-transform: uppercase; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: 500; }
        td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(200,190,220,0.8); }
        tr:last-child td { border-bottom: none; }
        td.num { font-weight: 600; color: #f0eaff; }
        td.green { color: #5de87a; }

        /* Stuck leads */
        .stuck-item { background: rgba(180,140,220,0.07); border: 1px solid rgba(180,140,220,0.15); border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .stuck-name { font-size: 13px; color: #f0eaff; }
        .stuck-step { font-size: 11px; color: rgba(200,190,220,0.45); margin-top: 3px; }
        .stuck-hours { font-size: 12px; color: rgba(180,140,220,0.7); }

        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 8px; background: rgba(93,232,122,0.12); border: 1px solid rgba(93,232,122,0.2); color: #5de87a; letter-spacing: 0.04em; margin-left: 6px; vertical-align: middle; }
      `}</style>

      <div className="page">

        {/* ── PENGAFLÖDE ── */}
        <h2>Pengaflöde — DMs → intäkt</h2>
        <div className="grid g5">
          <div className="stat"><div className="stat-label">Kontakter</div><div className="stat-value">312</div><div className="stat-sub">senaste 30d</div></div>
          <div className="stat"><div className="stat-label">Svar</div><div className="stat-value">214</div><div className="stat-sub">69% svarsfrekvens</div></div>
          <div className="stat"><div className="stat-label">Bokade</div><div className="stat-value">47</div><div className="stat-sub">22% bokningsfrekvens</div></div>
          <div className="stat"><div className="stat-label">Stängda</div><div className="stat-value">38</div><div className="stat-sub">81% stängningsfrekvens</div></div>
          <div className="stat accent"><div className="stat-label">Intäkt insamlad</div><div className="stat-value">149 200 kr</div><div className="stat-sub">↑ 18% vs förra månaden</div></div>
        </div>

        {/* ── UPPFÖLJNINGAR ── */}
        <h2>Uppföljningar — återaktivera tysta leads</h2>
        <div className="grid g3">
          <div className="stat"><div className="stat-label">Skickade · 7d</div><div className="stat-value">28</div></div>
          <div className="stat"><div className="stat-label">Leads återaktiverade</div><div className="stat-value">11</div><div className="stat-sub">39% återaktivering</div></div>
          <div className="stat"><div className="stat-label">Ombokade via uppföljning</div><div className="stat-value">7</div></div>
        </div>
        <div className="grid g3" style={{marginTop:12}}>
          <div className="stat"><div className="stat-label">Uppföljningar · 7d</div><div className="stat-value">28</div></div>
          <div className="stat"><div className="stat-label">Uppföljningar · 30d</div><div className="stat-value">94</div></div>
          <div className="stat"><div className="stat-label">Återaktiverade · 7d</div><div className="stat-value">11</div></div>
        </div>

        {/* ── FASTNADE LEADS ── */}
        <h2>Var leads fastnar (24h+ utan aktivitet per steg)</h2>
        {[
          { name: "Maja Karlsson", step: "Prisförfrågan — inväntar svar", hours: "31h" },
          { name: "Hanna Persson", step: "Bokningsförslag skickat", hours: "27h" },
          { name: "Ingela Strand", step: "Behandlingsinfo skickad", hours: "48h" },
        ].map((l) => (
          <div key={l.name} className="stuck-item">
            <div><div className="stuck-name">{l.name}</div><div className="stuck-step">{l.step}</div></div>
            <div className="stuck-hours">{l.hours} sedan senaste aktivitet</div>
          </div>
        ))}

        {/* ── FÖRSÄLJNING ── */}
        <h2>Försäljning — alla funnlar</h2>
        <div className="grid g4">
          <div className="stat accent"><div className="stat-label">Intäkt insamlad</div><div className="stat-value">149 200 kr</div></div>
          <div className="stat accent"><div className="stat-label">Kontrakterat värde</div><div className="stat-value">187 400 kr</div></div>
          <div className="stat"><div className="stat-label">Snitt per affär</div><div className="stat-value">3 926 kr</div></div>
          <div className="stat"><div className="stat-label">Snitt första betalning</div><div className="stat-value">2 800 kr</div></div>
        </div>
        <div className="grid g4" style={{marginTop:12}}>
          <div className="stat"><div className="stat-label">Intäkt / bokat möte</div><div className="stat-value">3 174 kr</div></div>
          <div className="stat"><div className="stat-label">Intäkt / kontakt</div><div className="stat-value">478 kr</div></div>
          <div className="stat"><div className="stat-label">Snitt LTV / kund (kontrakt)</div><div className="stat-value">4 935 kr</div></div>
          <div className="stat"><div className="stat-label">Utestående</div><div className="stat-value">38 200 kr</div><div className="stat-sub">kontrakt − insamlat</div></div>
        </div>

        {/* ── BOKADE AV AURA ── */}
        <h2>Bokade av Ella <span className="badge">AI</span></h2>
        <div className="grid g4">
          <div className="stat"><div className="stat-label">Bokade</div><div className="stat-value">34</div><div className="stat-sub">72% av alla bokningar</div></div>
          <div className="stat"><div className="stat-label">Dök upp</div><div className="stat-value">29</div><div className="stat-sub">85% närvaro</div></div>
          <div className="stat"><div className="stat-label">Stängda</div><div className="stat-value">26</div><div className="stat-sub">90% stängningsfrekvens</div></div>
          <div className="stat accent"><div className="stat-label">Ella → intäkt</div><div className="stat-value">107 400 kr</div><div className="stat-sub">insamlat</div></div>
        </div>
        <div className="grid g4" style={{marginTop:12}}>
          <div className="stat"><div className="stat-label">No-shows</div><div className="stat-value">5</div><div className="stat-sub">15%</div></div>
          <div className="stat"><div className="stat-label">Pitchade</div><div className="stat-value">28</div></div>
          <div className="stat"><div className="stat-label">Ej pitchade</div><div className="stat-value">6</div></div>
          <div className="stat"><div className="stat-label">Förlorade</div><div className="stat-value">3</div></div>
        </div>

        {/* ── HASTIGHET ── */}
        <h2>Hastighet — hur snabbt leads rör sig</h2>
        <div className="grid g4">
          <div className="stat"><div className="stat-label">Tid till första svar</div><div className="stat-value">1 min 48 s</div><div className="stat-sub">median</div></div>
          <div className="stat"><div className="stat-label">Lead → bokad</div><div className="stat-value">4h 12m</div><div className="stat-sub">median</div></div>
          <div className="stat"><div className="stat-label">Bokad → möte</div><div className="stat-value">3.2 dagar</div><div className="stat-sub">median</div></div>
          <div className="stat"><div className="stat-label">Säljcykel (kontakt → stängd)</div><div className="stat-value">5.8 dagar</div><div className="stat-sub">median</div></div>
        </div>

        {/* ── PER KÄLLA ── */}
        <h2>Per källa</h2>
        <div className="row2">
          <div>
            <table>
              <thead><tr><th>Källa</th><th>Leads</th><th>Bokade</th><th>Vunna</th></tr></thead>
              <tbody>
                <tr><td>Instagram</td><td className="num">224</td><td className="num">38</td><td className="num">31</td></tr>
                <tr><td>Google</td><td className="num">64</td><td className="num">7</td><td className="num">5</td></tr>
                <tr><td>Rekommendation</td><td className="num">24</td><td className="num">2</td><td className="num">2</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <table>
              <thead><tr><th>Källa</th><th>Kunder</th><th>Signerat</th><th>Insamlat</th></tr></thead>
              <tbody>
                <tr><td>Instagram</td><td className="num">29</td><td className="num">142 600 kr</td><td className="num green">112 400 kr</td></tr>
                <tr><td>Google</td><td className="num">6</td><td className="num">31 200 kr</td><td className="num green">24 800 kr</td></tr>
                <tr><td>Rekommendation</td><td className="num">3</td><td className="num">13 600 kr</td><td className="num green">12 000 kr</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PER BEHANDLING ── */}
        <h2>Per behandling</h2>
        <table>
          <thead><tr><th>Behandling</th><th>Leads</th><th>Bokade</th><th>Stängda</th><th>Signerat</th></tr></thead>
          <tbody>
            {[
              ["Botox", 98, 22, 19, "74 100 kr"],
              ["Fillers", 64, 14, 12, "52 800 kr"],
              ["Laser / IPL", 44, 6, 5, "27 000 kr"],
              ["Microneedling", 28, 3, 2, "13 200 kr"],
              ["Ansiktsbehandling", 38, 2, 2, "9 600 kr"],
              ["Övrigt", 40, 0, 0, "0 kr"],
            ].map(([t, l, b, s, kr]) => (
              <tr key={t as string}><td>{t}</td><td className="num">{l}</td><td className="num">{b}</td><td className="num">{s}</td><td className="num green">{kr}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={{height: 32}} />
      </div>
    </>
  );
}
