"use client";

export default function NordicSolarDashboard() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #060b12;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #e8f0ff;
          min-height: 100vh;
        }

        .page {
          padding: 28px 32px;
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 40% at 10% 0%, rgba(210,155,30,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 100%, rgba(20,70,160,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(210,155,30,0.03) 0%, transparent 70%),
            #060b12;
        }

        .dash-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(210,155,30,0.12);
        }
        .dash-logo {
          display: flex; align-items: center; gap: 12px;
        }
        .dash-sun {
          font-size: 28px;
          filter: drop-shadow(0 0 8px rgba(210,155,30,0.5));
        }
        .dash-title {
          font-size: 22px; font-weight: 700; letter-spacing: 0.08em;
          color: #f0f4ff; text-transform: uppercase;
        }
        .dash-sub { font-size: 11px; color: rgba(210,155,30,0.55); letter-spacing: 0.08em; margin-top: 3px; text-transform: uppercase; }
        .dash-period {
          font-size: 11px; color: rgba(180,195,230,0.45); letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid rgba(210,155,30,0.18);
          padding: 6px 16px; border-radius: 20px;
        }

        h2 {
          font-size: 10px; font-weight: 500;
          color: rgba(210,155,30,0.45);
          letter-spacing: 0.14em; text-transform: uppercase;
          margin: 32px 0 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(210,155,30,0.1);
          display: flex; align-items: center; gap: 10px;
        }
        h2::before {
          content: '';
          display: inline-block;
          width: 18px; height: 1px;
          background: linear-gradient(90deg, #d4961e, transparent);
        }
        h2:first-of-type { margin-top: 0; }

        .grid { display: grid; gap: 10px; margin-bottom: 4px; }
        .g3 { grid-template-columns: repeat(3, 1fr); }
        .g4 { grid-template-columns: repeat(4, 1fr); }
        .g5 { grid-template-columns: repeat(5, 1fr); }

        .stat {
          background: rgba(210,155,30,0.04);
          border: 1px solid rgba(210,155,30,0.1);
          border-radius: 12px;
          padding: 16px 18px;
          position: relative;
          overflow: hidden;
        }
        .stat::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(210,155,30,0.18), transparent);
        }
        .stat-label {
          font-size: 10px; font-weight: 500;
          color: rgba(210,155,30,0.4);
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 10px;
        }
        .stat-value { font-size: 22px; font-weight: 600; color: #e8f0ff; letter-spacing: -0.01em; }
        .stat-sub { font-size: 11px; color: rgba(180,195,230,0.4); margin-top: 5px; }
        .stat.accent { background: rgba(210,155,30,0.07); border-color: rgba(210,155,30,0.2); }
        .stat.accent .stat-value { color: #d4961e; }
        .stat.gold { background: rgba(210,155,30,0.07); border-color: rgba(210,155,30,0.22); }
        .stat.gold .stat-value { color: #e0aa30; }
        .stat.blue { background: rgba(30,80,160,0.07); border-color: rgba(30,80,160,0.2); }
        .stat.blue .stat-value { color: #6aa3e8; }
        .stat.green .stat-value { color: #5de87a; }

        .table-wrap {
          background: rgba(210,155,30,0.03);
          border: 1px solid rgba(210,155,30,0.09);
          border-radius: 12px;
          overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th {
          text-align: left; font-size: 10px; font-weight: 500;
          color: rgba(210,155,30,0.38); letter-spacing: 0.08em; text-transform: uppercase;
          padding: 12px 16px; background: rgba(210,155,30,0.04);
          border-bottom: 1px solid rgba(210,155,30,0.07);
        }
        td { padding: 11px 16px; border-bottom: 1px solid rgba(210,155,30,0.05); color: rgba(232,240,255,0.65); }
        tr:last-child td { border-bottom: none; }
        td.num { font-weight: 600; color: #e8f0ff; }
        td.gold { color: #e0aa30; font-weight: 600; }
        td.green { color: #5de87a; font-weight: 600; }
        td.blue { color: #6aa3e8; font-weight: 600; }

        .stuck-item {
          background: rgba(210,155,30,0.04);
          border: 1px solid rgba(210,155,30,0.09);
          border-left: 3px solid rgba(210,100,30,0.45);
          border-radius: 10px;
          padding: 13px 16px; margin-bottom: 8px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .stuck-name { font-size: 13px; font-weight: 500; color: #e8f0ff; }
        .stuck-step { font-size: 11px; color: rgba(210,155,30,0.45); margin-top: 3px; }
        .stuck-hours { font-size: 12px; color: rgba(210,100,30,0.75); font-weight: 500; }

        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .badge {
          display: inline-block; font-size: 9px; padding: 2px 8px; border-radius: 6px;
          background: rgba(93,232,122,0.1); border: 1px solid rgba(93,232,122,0.2);
          color: #5de87a; letter-spacing: 0.06em; margin-left: 6px; vertical-align: middle;
          font-weight: 500;
        }

        .funnel-row {
          display: flex; align-items: center; gap: 14px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(210,155,30,0.06);
        }
        .funnel-row:last-child { border-bottom: none; }
        .funnel-label { font-size: 12px; color: rgba(180,195,230,0.55); width: 120px; flex-shrink: 0; }
        .funnel-bar-wrap { flex: 1; background: rgba(210,155,30,0.06); border-radius: 4px; height: 6px; overflow: hidden; }
        .funnel-bar { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #d4961e, #1a5fc0); }
        .funnel-val { font-size: 13px; font-weight: 600; color: #e8f0ff; width: 40px; text-align: right; flex-shrink: 0; }
        .funnel-pct { font-size: 11px; color: rgba(210,155,30,0.5); width: 44px; text-align: right; flex-shrink: 0; }

        .funnel-wrap {
          background: rgba(210,155,30,0.03);
          border: 1px solid rgba(210,155,30,0.09);
          border-radius: 12px;
          padding: 16px 20px;
        }
      `}</style>

      <div className="page">

        <div className="dash-header">
          <div className="dash-logo">
            <div className="dash-sun">☀️</div>
            <div>
              <div className="dash-title">Nordic Solar</div>
              <div className="dash-sub">Storgatan 14, Göteborg · AI-drivet lead-system</div>
            </div>
          </div>
          <div className="dash-period">Jan 2026 — Jun 2026</div>
        </div>

        {/* ── PENGAFLÖDE ── */}
        <h2>Pengaflöde — leads → signerade avtal</h2>
        <div className="grid g5">
          <div className="stat"><div className="stat-label">Leads</div><div className="stat-value">284</div><div className="stat-sub">senaste 30d</div></div>
          <div className="stat"><div className="stat-label">Svar</div><div className="stat-value">198</div><div className="stat-sub">70% svarsfrekvens</div></div>
          <div className="stat"><div className="stat-label">Kvalificerade</div><div className="stat-value">112</div><div className="stat-sub">57% av svar</div></div>
          <div className="stat"><div className="stat-label">Bokade möten</div><div className="stat-value">67</div><div className="stat-sub">34% av leads</div></div>
          <div className="stat gold"><div className="stat-label">Omsättning 30d</div><div className="stat-value">2 340 000 kr</div><div className="stat-sub">41 signerade avtal</div></div>
        </div>

        {/* ── LEAD-FUNNEL ── */}
        <h2>Lead-funnel — visualiserad</h2>
        <div className="funnel-wrap">
          {[
            { label: "Leads inkommna", val: 284, pct: "100%" },
            { label: "Svarade", val: 198, pct: "70%" },
            { label: "Kvalificerade", val: 112, pct: "57%" },
            { label: "Bokade möten", val: 67, pct: "34%" },
            { label: "Signerade avtal", val: 41, pct: "61%" },
          ].map((r, i, arr) => (
            <div key={r.label} className="funnel-row">
              <div className="funnel-label">{r.label}</div>
              <div className="funnel-bar-wrap">
                <div className="funnel-bar" style={{ width: `${(r.val / arr[0].val) * 100}%` }} />
              </div>
              <div className="funnel-val">{r.val}</div>
              <div className="funnel-pct">{r.pct}</div>
            </div>
          ))}
        </div>

        {/* ── UPPFÖLJNINGAR ── */}
        <h2>Uppföljningar — återaktivera tysta leads</h2>
        <div className="grid g3">
          <div className="stat"><div className="stat-label">Skickade · 7d</div><div className="stat-value">38</div></div>
          <div className="stat"><div className="stat-label">Återaktiverade</div><div className="stat-value">14</div><div className="stat-sub">37% återaktivering</div></div>
          <div className="stat"><div className="stat-label">Ombokade via uppföljning</div><div className="stat-value">9</div></div>
        </div>

        {/* ── FASTNADE LEADS ── */}
        <h2>Var leads fastnar (24h+ utan aktivitet)</h2>
        {[
          { name: "Erik Johansson", step: "Prisförfrågan — inväntar takbild", hours: "38h" },
          { name: "BRF Solhem (18 lgh)", step: "Teknisk offert skickad", hours: "52h" },
          { name: "Anderssons Bygg AB", step: "Hembesök bokad — ej bekräftat", hours: "29h" },
          { name: "Petra Lindqvist", step: "Förbrukningsdata begärd", hours: "44h" },
        ].map((l) => (
          <div key={l.name} className="stuck-item">
            <div><div className="stuck-name">{l.name}</div><div className="stuck-step">{l.step}</div></div>
            <div className="stuck-hours">{l.hours} sedan senaste aktivitet</div>
          </div>
        ))}

        {/* ── FÖRSÄLJNING ── */}
        <h2>Försäljning — alla segment</h2>
        <div className="grid g4">
          <div className="stat gold"><div className="stat-label">Total omsättning</div><div className="stat-value">2 340 000 kr</div><div className="stat-sub">41 avtal signerade</div></div>
          <div className="stat accent"><div className="stat-label">Kontrakterat värde</div><div className="stat-value">2 890 000 kr</div><div className="stat-sub">inkl. ej fakturerat</div></div>
          <div className="stat blue"><div className="stat-label">Snitt B2C avtal</div><div className="stat-value">285 000 kr</div><div className="stat-sub">villa solceller</div></div>
          <div className="stat blue"><div className="stat-label">Snitt B2B avtal</div><div className="stat-value">680 000 kr</div><div className="stat-sub">företag/fastighet</div></div>
        </div>
        <div className="grid g4" style={{marginTop:12}}>
          <div className="stat"><div className="stat-label">Intäkt / bokat möte</div><div className="stat-value">34 925 kr</div></div>
          <div className="stat"><div className="stat-label">Intäkt / lead</div><div className="stat-value">8 239 kr</div></div>
          <div className="stat"><div className="stat-label">B2C avtal</div><div className="stat-value">29 st</div><div className="stat-sub">71% av volymen</div></div>
          <div className="stat"><div className="stat-label">B2B avtal</div><div className="stat-value">12 st</div><div className="stat-sub">29% — 72% av omsättningen</div></div>
        </div>

        {/* ── BOKADE AV NOVA ── */}
        <h2>Bokade av Nova <span className="badge">AI</span></h2>
        <div className="grid g4">
          <div className="stat"><div className="stat-label">AI-bokade möten</div><div className="stat-value">52</div><div className="stat-sub">78% av alla möten</div></div>
          <div className="stat"><div className="stat-label">Dök upp</div><div className="stat-value">46</div><div className="stat-sub">88% närvaro</div></div>
          <div className="stat"><div className="stat-label">Signerade</div><div className="stat-value">36</div><div className="stat-sub">78% stängningsfrekvens</div></div>
          <div className="stat gold"><div className="stat-label">Nova → omsättning</div><div className="stat-value">1 820 000 kr</div><div className="stat-sub">78% av totalen</div></div>
        </div>
        <div className="grid g4" style={{marginTop:12}}>
          <div className="stat"><div className="stat-label">Svarstid median</div><div className="stat-value">45 sek</div></div>
          <div className="stat"><div className="stat-label">Manuellt bokade</div><div className="stat-value">15</div><div className="stat-sub">22% av möten</div></div>
          <div className="stat"><div className="stat-label">No-shows</div><div className="stat-value">6</div><div className="stat-sub">12%</div></div>
          <div className="stat"><div className="stat-label">Förlorade efter möte</div><div className="stat-value">5</div></div>
        </div>

        {/* ── HASTIGHET ── */}
        <h2>Hastighet — hur snabbt leads rör sig</h2>
        <div className="grid g4">
          <div className="stat"><div className="stat-label">Tid till första svar</div><div className="stat-value">45 sek</div><div className="stat-sub">median</div></div>
          <div className="stat"><div className="stat-label">Lead → bokat möte</div><div className="stat-value">6h 20m</div><div className="stat-sub">median</div></div>
          <div className="stat"><div className="stat-label">Möte → offert</div><div className="stat-value">1.8 dagar</div><div className="stat-sub">median</div></div>
          <div className="stat"><div className="stat-label">Säljcykel total</div><div className="stat-value">8 dagar</div><div className="stat-sub">lead → signerat</div></div>
        </div>

        {/* ── PER TJÄNST ── */}
        <h2>Försäljning per tjänst</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tjänst</th><th>Leads</th><th>Bokade möten</th><th>Signerade</th><th>Omsättning</th></tr></thead>
            <tbody>
              {[
                ["Solceller villa", 148, 38, 24, "6 840 000 kr"],
                ["Solceller företag", 62, 16, 12, "8 160 000 kr"],
                ["Batterilager", 44, 8, 5, "325 000 kr"],
                ["Elinstallation", 18, 3, 2, "36 000 kr"],
                ["Laddbox elbil", 12, 2, 0, "—"],
              ].map(([t, l, b, s, kr]) => (
                <tr key={t as string}>
                  <td>{t}</td><td className="num">{l}</td><td className="num">{b}</td><td className="num">{s}</td><td className="gold">{kr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── PER KÄLLA ── */}
        <h2>Per källa</h2>
        <div className="row2">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Källa</th><th>Leads</th><th>Bokade</th><th>Signerade</th></tr></thead>
              <tbody>
                <tr><td>Hemsida/SEO</td><td className="num">98</td><td className="num">24</td><td className="num">16</td></tr>
                <tr><td>Facebook/Meta</td><td className="num">112</td><td className="num">28</td><td className="num">17</td></tr>
                <tr><td>Google Ads</td><td className="num">48</td><td className="num">10</td><td className="num">6</td></tr>
                <tr><td>Rekommendation</td><td className="num">26</td><td className="num">5</td><td className="num">2</td></tr>
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Källa</th><th>Avtal</th><th>Omsättning</th><th>Snitt/avtal</th></tr></thead>
              <tbody>
                <tr><td>Hemsida/SEO</td><td className="num">16</td><td className="gold">910 000 kr</td><td className="blue">56 875 kr</td></tr>
                <tr><td>Facebook/Meta</td><td className="num">17</td><td className="gold">980 000 kr</td><td className="blue">57 647 kr</td></tr>
                <tr><td>Google Ads</td><td className="num">6</td><td className="gold">310 000 kr</td><td className="blue">51 667 kr</td></tr>
                <tr><td>Rekommendation</td><td className="num">2</td><td className="gold">140 000 kr</td><td className="blue">70 000 kr</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{height: 32}} />
      </div>
    </>
  );
}
