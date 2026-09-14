// OptimizePromptModal.tsx — Prompt modal displayed upon schedule upload

import React from "react";

interface Props {
  vesselsCount: number;
  terminalsCount: number;
  onOptimize: () => void;
  onDismiss: () => void;
}

export default function OptimizePromptModal({
  vesselsCount,
  terminalsCount,
  onOptimize,
  onDismiss,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-700/60 rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl relative">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-2xl shrink-0 text-indigo-400">
            ⚡
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
              Schedule Ingestion Complete
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Optimize Harbor Operations?
            </h2>
          </div>
        </div>

        {/* Body context */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Imported <span className="font-mono font-bold text-white">{vesselsCount} vessels</span> across{" "}
          <span className="font-mono font-bold text-white">{terminalsCount} terminals</span>. 
          Without optimization, vessels will dock on a naive{" "}
          <span className="text-amber-300 font-semibold">First-Come, First-Served (FCFS)</span> order, 
          leading to harbor traffic jams and extended queues.
        </p>

        {/* Highlights */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider font-mono">
            AI Optimization will:
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-400">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Prioritize <strong>Urgent &amp; High-value</strong> cargo ahead of standard vessels.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>Alternate Routing:</strong> Divert ships from choked terminals to free berths.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Allocate dedicated cranes dynamically to cut wait time by <strong>40%–55%</strong>.</span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onOptimize}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>🚀 Run AI Optimization Now</span>
          </button>
          <button
            onClick={onDismiss}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            Keep Baseline (View Raw)
          </button>
        </div>
      </div>
    </div>
  );
}
