// RecommendationsPanel.tsx — AI optimiser recommendations

import React from "react";
import { OptimizeData } from "./types";

interface Props {
  data: OptimizeData | null;
  loading: boolean;
  onOptimize: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-400",
  high:   "text-orange-400",
  normal: "text-slate-300",
};

export default function RecommendationsPanel({ data, loading, onOptimize }: Props) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          AI Recommendations
        </h2>
        <button
          onClick={onOptimize}
          disabled={loading}
          className="px-3 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors"
        >
          {loading ? "Running…" : "Optimize"}
        </button>
      </div>

      {!data && !loading && (
        <p className="text-xs text-slate-500">Click Optimize to generate the assignment plan.</p>
      )}

      {loading && (
        <p className="text-xs text-slate-400 animate-pulse">Computing optimal assignment…</p>
      )}

      {data && !loading && (
        <>
          {/* Improvement banner */}
          <div className="bg-indigo-900/40 border border-indigo-700 rounded px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-indigo-300">Expected waiting time reduction</span>
            <span className="font-mono text-lg font-bold text-indigo-400">
              {data.summary.improvement_percent}%
            </span>
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-900 rounded p-2">
              <div className="text-slate-500 mb-0.5">Avg wait BEFORE</div>
              <div className="font-mono text-slate-200">{data.summary.avg_wait_before_h} h</div>
            </div>
            <div className="bg-slate-900 rounded p-2">
              <div className="text-slate-500 mb-0.5">Avg wait AFTER</div>
              <div className="font-mono text-emerald-400">{data.summary.avg_wait_after_h} h</div>
            </div>
          </div>

          {/* Terminal moves */}
          {data.berth_plan.recommended_moves.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Terminal Moves</div>
              {data.berth_plan.recommended_moves.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-mono bg-slate-900 rounded px-2 py-1">
                  <span className={`font-semibold ${PRIORITY_COLOR[m.priority] ?? ""}`}>
                    [{m.priority.toUpperCase()[0]}]
                  </span>
                  <span className="text-slate-200 truncate flex-1">{m.vessel_code}</span>
                  <span className="text-slate-400">{m.from_terminal}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-emerald-400">{m.to_terminal}</span>
                  <span className="text-slate-500">{m.assigned_berth}</span>
                </div>
              ))}
            </div>
          )}

          {/* Crane utilisation per terminal */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Crane Allocation</div>
            {data.crane_plan.terminal_summaries.map((t) => (
              <div key={t.terminal} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-slate-400 w-5">{t.terminal}</span>
                <div className="flex-1 h-1.5 bg-slate-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded"
                    style={{ width: `${t.utilization_pct}%` }}
                  />
                </div>
                <span className="font-mono text-slate-300 text-[10px] w-10 text-right">
                  {t.utilization_pct}%
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500">
            {data.summary.vessels_assigned} vessels assigned · {data.summary.conflicts_resolved} conflicts resolved
          </p>
        </>
      )}
    </div>
  );
}
