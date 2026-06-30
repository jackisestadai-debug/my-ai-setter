"use client";

export default function GlowDashboard() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0c0a0e;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #f0e8e0;
          min-height: 100vh;
        }

        .page {
          padding: 28px 32px;
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 40% at 10% 0%, rgba(180,120,100,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 100%, rgba(160,100,120,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(200,160,140,0.04) 0%, transparent 70%),
            #0c0a0e;
        }

        /* Top header */
        .dash-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(200,160,140,0.12);
        }
        .dash-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px; font-weight: 300; letter-spacing: 0.15em;
          color: #f0e8e0; text-transform: uppercase;
        }
        .dash-sub { font-size: 11px; color: rgba(200,160,140,0.5); letter-spacing: 0.08em; margin-top: 4px; text-transform: uppercase; }
        .dash-period {
          font-size: 11px; color: rgba(200,160,140,0.5); letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid rgba(200,160,140,0.2);
          padding: 6px 16px; border-radius: 20px;
        }

        /* Section headers */
        h2 {
          font-size: 10px; font-weight: 500;
          color: rgba(200,160,140,0.45);
          letter-spacing: 0.14em; text-transform: uppercase;
          margin: 32px 0 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(200,160,140,0.1);
          display: flex; align-items: center; gap: 10px;
        }
        h2::before {
          content: '';
          display: inline-block;
          width: 18px; height: 1px;
          background: linear-gradient(90deg, #c8a080, transparent);
        }
        h2:first-of-type { margin-top: 0; }

        /* Stat grids */
        .grid { display: grid; gap: 10px; margin-bottom: 4px; }
        .g3 { grid-template-columns: repeat(3, 1fr); }
        .g4 { grid-template-columns: repeat(4, 1fr); }
        .g5 { grid-template-columns: repeat(5, 1fr); }

        .stat {
          background: rgba(200,160,140,0.05);
          border: 1px solid rgba(200,160,140,0.12);
          border-radius: 12px;
          padding: 16px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .stat::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(200,160,140,0.2), transparent);
        }
        .stat-label {
          font-size: 10px; font-weight: 500;
          color: rgba(200,160,140,0.45);
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 10px;
        }
        .stat-value { font-size: 22px; font-weight: 600; color: #f0e8e0; letter-spacing: -0.01em; }
        .stat-sub { font-size: 11px; color: rgba(200,160,140,0.45); margin-top: 5px; }
        .stat.accent { background: rgba(200,140,100,0.07); border-color: rgba(200,140,100,0.2); }
        .stat.accent .stat-value { color: #d4a882; }
        .stat.gold { background: rgba(210,170,100,0.07); border-color: rgba(210,170,100,0.2); }
        .stat.gold .stat-value { color: #d4b87a; }
        .stat.green .stat-value { color: #7ec99a; }

        /* Tables */
        .table-wrap {
          background: rgba(200,160,140,0.04);
          border: 1px solid rgba(200,160,140,0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th {
          text-align: left; font-size: 10px; font-weight: 500;
          color: rgba(200,160,140,0.4); letter-spacing: 0.08em; text-transform: uppercase;
          padding: 12px 16px; background: rgba(200,160,140,0.04);
          border-bottom: 1px solid rgba(200,160,140,0.08);
        }
        td { padding: 11px 16px; border-bottom: 1px solid rgba(200,160,140,0.06); color: rgba(240,232,224,0.7); }
        tr:last-child td { border-bottom: none; }
        td.num { font-weight: 600; color: #f0e8e0; }
        td.gold { color: #d4b87a; font-weight: 600; }
        td.green { color: #7ec99a; font-weight: 600; }

        /* Stuck leads */
        .stuck-item {
          background: rgba(200,160,140,0.05);
          border: 1px solid rgba(200,160,140,0.1);
          border-left: 3px solid rgba(200,140,100,0.4);
          border-radius: 10px;
          padding: 13px 16px; margin-bottom: 8px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .stuck-name { font-size: 13px; font-weight: 500; color: #f0e8e0; }
        .stuck-step { font-size: 11px; color: rgba(200,160,140,0.45); margin-top: 3px; }
        .stuck-hours { font-size: 12px; color: rgba(200,140,100,0.7); font-weight: 500; }

        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .badge {
          display: inline-block; font-size: 9px; padding: 2px 8px; border-radius: 6px;
          background: rgba(126,201,154,0.12); border: 1px solid rgba(126,201,154,0.22);
          color: #7ec99a; letter-spacing: 0.06em; margin-left: 6px; vertical-align: middle;
          font-weight: 500;
        }

        /* Divider between sections */
        .section-gap { height: 4px; }
      `}</style>

      <div className="page">

        <div className="dash-header">
          <div>
            <div className="dash-title">Glow Studio</div>
            <div className="dash-sub">Östergatan 21, Stockholm · AI-drivet bokningssystem</div>
          </div>
          <div className="dash-period">Jan 2026 — Jun 2026</div>
        </div>

        {/* ── PENGAFLÖDE ── */}
        <h2>Pengaflöde — DMs → intäkt</h2>
        <div className="grid g5">
          <div className="stat"><div className="stat-label">Kontakter</div><div className="stat-value">312</div><div className="stat-sub">senaste 30d</div></div>
          <div className="stat"><div className="stat-label">Svar</div><div className="stat-value">214</div><div className="stat-sub">69% svarsfrekvens</div></div>
          <div className="stat"><div className="stat-label">Bokade</div><div className="stat-value">47</div><div className="stat-sub">22% bokningsfrekvens</div></div>
          <div className="stat"><div className="stat-label">Stängda</div><div className="stat-value">38</div><div className="stat-sub">81% stängningsfrekvens</div></div>
          <div className="stat gold"><div className="stat-label">Intäkt insamlad</div><div className="stat-value">149 200 kr</div><div className="stat-sub">↑ 18% vs förra månaden</div></div>
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
          <div className="stat gold"><div className="stat-label">Intäkt insamlad</div><div className="stat-value">149 200 kr</div></div>
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
          <div className="stat gold"><div className="stat-label">Ella → intäkt</div><div className="stat-value">107 400 kr</div><div className="stat-sub">insamlat</div></div>
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
          <div className="table-wrap">
            <table>
              <thead><tr><th>Källa</th><th>Leads</th><th>Bokade</th><th>Vunna</th></tr></thead>
              <tbody>
                <tr><td>Instagram</td><td className="num">224</td><td className="num">38</td><td className="num">31</td></tr>
                <tr><td>Google</td><td className="num">64</td><td className="num">7</td><td className="num">5</td></tr>
                <tr><td>Rekommendation</td><td className="num">24</td><td className="num">2</td><td className="num">2</td></tr>
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Källa</th><th>Kunder</th><th>Signerat</th><th>Insamlat</th></tr></thead>
              <tbody>
                <tr><td>Instagram</td><td className="num">29</td><td className="num">142 600 kr</td><td className="gold">112 400 kr</td></tr>
                <tr><td>Google</td><td className="num">6</td><td className="num">31 200 kr</td><td className="gold">24 800 kr</td></tr>
                <tr><td>Rekommendation</td><td className="num">3</td><td className="num">13 600 kr</td><td className="gold">12 000 kr</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PER BEHANDLING ── */}
        <h2>Per behandling</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Behandling</th><th>Leads</th><th>Bokade</th><th>Stängda</th><th>Signerat</th></tr></thead>
            <tbody>
              {[
                ["Botox", 98, 22, 19, "74 100 kr"],
                ["Fillers", 64, 14, 12, "52 800 kr"],
                ["Laser / IPL", 44, 6, 5, "27 000 kr"],
                ["Microneedling", 28, 3, 2, "13 200 kr"],
                ["Ansiktsbehandling", 38, 2, 2, "9 600 kr"],
                ["Övrigt", 40, 0, 0, "—"],
              ].map(([t, l, b, s, kr]) => (
                <tr key={t as string}><td>{t}</td><td className="num">{l}</td><td className="num">{b}</td><td className="num">{s}</td><td className="gold">{kr}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{height: 32}} />
      </div>
    </>
  );
}
