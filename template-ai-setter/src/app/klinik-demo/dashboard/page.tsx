"use client";

/**
 * Glow Studio — demo-dashboard.
 * Visar realistiska fake-siffror för en etablerad skönhetsklinik.
 * Används som iframe i Glow Studio HQ:s dashboard-flik.
 */

export default function GlowDashboard() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0c14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e8e0ff; }

        .page { padding: 28px 32px; min-height: 100vh; background: #0a0c14; }

        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
        .title { font-size: 22px; font-weight: 700; color: #f0eaff; letter-spacing: 0.02em; }
        .subtitle { font-size: 13px; color: rgba(200,190,220,0.45); margin-top: 4px; }
        .period-badge {
          background: rgba(180,140,220,0.12);
          border: 1px solid rgba(180,140,220,0.25);
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 12px;
          color: rgba(200,190,220,0.7);
          letter-spacing: 0.04em;
        }

        .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .kpi {
          background: rgba(180,140,220,0.07);
          border: 1px solid rgba(180,140,220,0.18);
          border-radius: 14px;
          padding: 20px 22px;
        }
        .kpi-label { font-size: 11px; color: rgba(200,190,220,0.45); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
        .kpi-value { font-size: 28px; font-weight: 700; color: #f0eaff; letter-spacing: -0.01em; }
        .kpi-sub { font-size: 12px; color: rgba(180,140,220,0.6); margin-top: 6px; }
        .kpi-up { color: #5de87a; }
        .kpi-accent .kpi-value { color: #c9a8d4; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }

        .card {
          background: rgba(180,140,220,0.06);
          border: 1px solid rgba(180,140,220,0.16);
          border-radius: 14px;
          padding: 22px;
        }
        .card-title { font-size: 11px; color: rgba(200,190,220,0.45); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 18px; }

        .funnel-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .funnel-label { font-size: 13px; color: rgba(200,190,220,0.7); }
        .funnel-right { display: flex; align-items: center; gap: 12px; }
        .funnel-val { font-size: 14px; font-weight: 600; color: #f0eaff; min-width: 36px; text-align: right; }
        .bar-wrap { width: 120px; height: 6px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #8b5cf6, #c9a8d4); }

        .treatment-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .treatment-name { font-size: 13px; color: rgba(200,190,220,0.8); }
        .treatment-right { display: flex; align-items: center; gap: 10px; }
        .treatment-pct { font-size: 13px; font-weight: 600; color: #c9a8d4; min-width: 36px; text-align: right; }
        .treatment-bar { width: 80px; height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
        .treatment-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #7eb8d4, #c9a8d4); }

        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .stat-item { }
        .stat-label { font-size: 11px; color: rgba(200,190,220,0.4); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
        .stat-value { font-size: 20px; font-weight: 700; color: #f0eaff; }
        .stat-sub { font-size: 11px; color: rgba(200,190,220,0.45); margin-top: 3px; }

        .leads-list { }
        .lead-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .lead-row:last-child { border-bottom: none; }
        .lead-name { font-size: 13px; color: #f0eaff; }
        .lead-treatment { font-size: 12px; color: rgba(200,190,220,0.45); margin-top: 2px; }
        .lead-badge {
          font-size: 10px; padding: 3px 9px; border-radius: 10px;
          background: rgba(180,140,220,0.15); border: 1px solid rgba(180,140,220,0.25);
          color: rgba(200,190,220,0.7); letter-spacing: 0.04em;
        }
        .lead-badge.booked { background: rgba(93,232,122,0.1); border-color: rgba(93,232,122,0.25); color: #5de87a; }

        .footer { margin-top: 8px; text-align: center; font-size: 11px; color: rgba(200,190,220,0.2); letter-spacing: 0.06em; }
      `}</style>

      <div className="page">
        <div className="header">
          <div>
            <div className="title">Glow Studio</div>
            <div className="subtitle">Östergatan 21, Stockholm · Senaste 30 dagarna</div>
          </div>
          <div className="period-badge">JAN 2026 — JUN 2026</div>
        </div>

        {/* KPI-rad */}
        <div className="kpi-row">
          <div className="kpi kpi-accent">
            <div className="kpi-label">Omsättning · 30d</div>
            <div className="kpi-value">156 400 kr</div>
            <div className="kpi-sub kpi-up">↑ 18% vs förra månaden</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Nya leads · 30d</div>
            <div className="kpi-value">138</div>
            <div className="kpi-sub kpi-up">↑ 12% vs förra månaden</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Bokade besök · 30d</div>
            <div className="kpi-value">47</div>
            <div className="kpi-sub">34% konvertering</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">AI-assisterade bokningar</div>
            <div className="kpi-value">73%</div>
            <div className="kpi-sub">av totalt bokade</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Konverteringstratt */}
          <div className="card">
            <div className="card-title">Konverteringstratt · Instagram DM</div>
            {[
              { label: "Inkommande meddelanden", val: 138, pct: 100 },
              { label: "Engagerade (svarade)", val: 94, pct: 68 },
              { label: "Kvalificerade", val: 61, pct: 44 },
              { label: "Bokade besök", val: 47, pct: 34 },
              { label: "Genomförda besök", val: 39, pct: 28 },
            ].map((r) => (
              <div key={r.label} className="funnel-row">
                <div className="funnel-label">{r.label}</div>
                <div className="funnel-right">
                  <div className="bar-wrap"><div className="bar-fill" style={{ width: `${r.pct}%` }} /></div>
                  <div className="funnel-val">{r.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Behandlingsfördelning */}
          <div className="card">
            <div className="card-title">Behandlingar · bokningar</div>
            {[
              { name: "Botox", pct: 42 },
              { name: "Fillers", pct: 28 },
              { name: "Laser / IPL", pct: 14 },
              { name: "Microneedling", pct: 8 },
              { name: "Ansiktsbehandling", pct: 5 },
              { name: "Övrigt", pct: 3 },
            ].map((t) => (
              <div key={t.name} className="treatment-row">
                <div className="treatment-name">{t.name}</div>
                <div className="treatment-right">
                  <div className="treatment-bar"><div className="treatment-fill" style={{ width: `${t.pct}%` }} /></div>
                  <div className="treatment-pct">{t.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-3">
          {/* Snabbstats */}
          <div className="card">
            <div className="card-title">Nyckeltal</div>
            <div className="stat-grid">
              {[
                { label: "Snitt ordervärde", val: "3 800 kr", sub: "per besök" },
                { label: "Återkommande kunder", val: "61%", sub: "av totalt" },
                { label: "Median svarstid", val: "2 min", sub: "AI-receptionist" },
                { label: "Svarar utanför öppettid", val: "100%", sub: "Ella alltid på" },
              ].map((s) => (
                <div key={s.label} className="stat-item">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.val}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Omsättning per källa */}
          <div className="card">
            <div className="card-title">Leads per kanal</div>
            {[
              { name: "Instagram DM", val: 94, pct: 68 },
              { name: "Google", val: 28, pct: 20 },
              { name: "Rekommendation", val: 11, pct: 8 },
              { name: "Övrigt", val: 5, pct: 4 },
            ].map((r) => (
              <div key={r.name} className="funnel-row">
                <div className="funnel-label">{r.name}</div>
                <div className="funnel-right">
                  <div className="bar-wrap"><div className="bar-fill" style={{ width: `${r.pct}%` }} /></div>
                  <div className="funnel-val">{r.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Varma leads */}
          <div className="card">
            <div className="card-title">Aktiva leads just nu</div>
            <div className="leads-list">
              {[
                { name: "Anna Lindqvist", treatment: "Botox", booked: false },
                { name: "Sofia Bergström", treatment: "Fillers", booked: true },
                { name: "Maja Karlsson", treatment: "Laser IPL", booked: false },
                { name: "Emma Johansson", treatment: "Microneedling", booked: true },
                { name: "Hanna Persson", treatment: "Botox + Fillers", booked: false },
              ].map((l) => (
                <div key={l.name} className="lead-row">
                  <div>
                    <div className="lead-name">{l.name}</div>
                    <div className="lead-treatment">{l.treatment}</div>
                  </div>
                  <div className={`lead-badge ${l.booked ? "booked" : ""}`}>
                    {l.booked ? "BOKAD" : "AKTIV"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer">GLOW STUDIO · AI-DRIVET BOKNINGSSYSTEM · POWERED BY AURA</div>
      </div>
    </>
  );
}
