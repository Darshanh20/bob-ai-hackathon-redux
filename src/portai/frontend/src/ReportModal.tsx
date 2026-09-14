// ReportModal.tsx — 72-hour operations report modal

import React, { useState } from "react";
import { ReportData } from "./types";
import { riskColor } from "./utils";

interface Props {
  portId: number;
  apiUrl: string;
  onClose: () => void;
}

export default function ReportModal({ portId, apiUrl, onClose }: Props) {
  const [report, setReport]   = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${apiUrl}/ports/${portId}/report`)
      .then((r) => r.json())
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const rc = report ? riskColor(report.overall_risk) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">72-Hour Operations Report</div>
            <h2 className="font-bold text-white text-lg leading-tight">PORTAI — {report?.port ?? "…"}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {loading && <p className="text-slate-400 text-sm animate-pulse">Generating report…</p>}
          {error   && <p className="text-red-400 text-sm">Error: {error}</p>}

          {report && rc && (
            <>
              {/* Overall risk */}
              <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${rc.bg} ${rc.border}`}>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">Overall Risk</div>
                  <div className={`text-2xl font-bold font-mono ${rc.text}`}>{report.overall_risk}</div>
                </div>
                <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                  <div>Generated: <span className="text-slate-300 font-mono">{new Date(report.generated_at).toLocaleString()}</span></div>
                  <div>Peak window: <span className="text-slate-300 font-mono">{report.peak_congestion_window}</span></div>
                </div>
              </div>

              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Expected Vessels",    value: report.expected_vessels },
                  { label: "High-Risk Terminal",  value: report.high_risk_terminal },
                  { label: "Wait Reduction",      value: `${report.expected_impact.wait_time_reduction_pct}%` },
                  { label: "Vessels Cleared",     value: report.expected_impact.vessels_cleared },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-500 mb-1">{kpi.label}</div>
                    <div className="font-mono font-bold text-white text-lg">{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Key risks */}
              <section>
                <h3 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2">Key Risks</h3>
                <ul className="space-y-1">
                  {report.key_risks.map((r, i) => (
                    <li key={i} className="text-[12px] text-slate-300 flex gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* AI Recommendations */}
              <section>
                <h3 className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-2">AI Recommendations</h3>
                <ul className="space-y-1">
                  {report.ai_recommendations.map((r, i) => (
                    <li key={i} className="text-[12px] text-slate-300 flex gap-2">
                      <span className="text-indigo-500 mt-0.5">›</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Impact */}
              <section className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-2">Expected Impact</h3>
                <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
                  <div><div className="text-slate-500">Wait Reduction</div><div className="font-mono font-bold text-emerald-400 text-base">{report.expected_impact.wait_time_reduction_pct}%</div></div>
                  <div><div className="text-slate-500">Vessels Cleared</div><div className="font-mono font-bold text-white text-base">{report.expected_impact.vessels_cleared}</div></div>
                  <div><div className="text-slate-500">Queue Reduction</div><div className="font-mono font-bold text-white text-base">{report.expected_impact.queue_reduction}</div></div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
