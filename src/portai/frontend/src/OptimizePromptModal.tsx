// OptimizePromptModal.tsx — Ingestion Completion & AI Optimization Prompt Modal

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-ocean-surface border border-brand-cyan/40 rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-brand-cyan/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-ocean-elevated border border-brand-cyan/50 flex items-center justify-center text-2xl shrink-0 text-brand-cyan shadow-[0_0_16px_rgba(40,215,209,0.25)]">
            <span className="material-symbols-outlined text-2xl">bolt</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-sono uppercase tracking-widest text-brand-cyan font-bold">
              SCHEDULE INGESTION COMPLETE
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Optimize Harbor Operations?
            </h2>
          </div>
        </div>

        {/* Body context */}
        <p className="text-xs text-[#D3E4EC] leading-relaxed">
          Successfully ingested <span className="font-sono font-bold text-white">{vesselsCount} vessels</span> across{" "}
          <span className="font-sono font-bold text-white">{terminalsCount} terminal sectors</span>. 
          Without optimization, vessels dock on a naive{" "}
          <span className="text-yellow-400 font-semibold font-sono">First-Come, First-Served (FCFS)</span> order, 
          leading to harbor bottlenecks, crane idle times, and demurrage exposure.
        </p>

        {/* Highlights */}
        <div className="bg-ocean-base/80 border border-ocean-border rounded-xl p-4 space-y-2 text-xs">
          <div className="font-semibold text-[#85A1AF] text-[11px] uppercase tracking-wider font-sono">
            AI Optimization will:
          </div>
          <ul className="space-y-2 text-xs text-[#D3E4EC]">
            <li className="flex items-center gap-2.5">
              <span className="text-brand-green font-bold text-sm">✓</span>
              <span>Prioritize <strong>Urgent &amp; High-value</strong> carriers ahead of standard ships.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-brand-green font-bold text-sm">✓</span>
              <span><strong>Alternate Routing:</strong> Divert ships from choked terminals to free berths.</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-brand-green font-bold text-sm">✓</span>
              <span>Allocate dedicated STS crane gangs dynamically to cut wait time by <strong>40%–55%</strong>.</span>
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onOptimize}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-brand-cyan hover:bg-brand-cyanHover font-sono font-bold text-xs uppercase tracking-wider text-ocean-base shadow-[0_0_16px_rgba(40,215,209,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Run AI Optimization Now</span>
          </button>
          <button
            onClick={onDismiss}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-ocean-elevated hover:bg-ocean-borderLight text-xs font-sono font-semibold text-[#85A1AF] hover:text-white border border-ocean-border transition-colors"
          >
            Keep Baseline
          </button>
        </div>
      </div>
    </div>
  );
}
