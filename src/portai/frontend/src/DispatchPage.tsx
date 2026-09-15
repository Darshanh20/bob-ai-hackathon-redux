// DispatchPage.tsx — Dedicated AI Optimization Engine & Dispatch Directive Hub

import React from "react";
import RecommendationsPanel from "./RecommendationsPanel";
import { OptimizeData } from "./types";

interface Props {
  optimize: OptimizeData | null;
  loadingOpt: boolean;
  onOptimize: () => void;
  onAuthorizeDispatch: () => void;
}

export default function DispatchPage({
  optimize,
  loadingOpt,
  onOptimize,
  onAuthorizeDispatch,
}: Props) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ocean-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-cyan text-xl">bolt</span>
            <span className="font-sono text-xs uppercase tracking-wider text-brand-cyan font-bold">
              SOLVER DIRECTIVES &amp; BERTHING PLAN
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Dispatch Directive Engine</h1>
          <p className="text-xs text-[#85A1AF] font-sans">
            Automated CP-SAT solver assigning optimal deep-water berths, STS crane gangs, and alternate terminal diversions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-ocean-surface border border-ocean-border text-xs font-sono">
            <span className="text-[#85A1AF]">Solver Model:</span>
            <span className="text-brand-cyan font-bold">CP-SAT / MIP</span>
          </div>
          <button
            onClick={onOptimize}
            disabled={loadingOpt}
            className="h-9 px-4 rounded bg-brand-cyan hover:bg-brand-cyanHover text-ocean-base font-sono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(40,215,209,0.25)] flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>{loadingOpt ? "Optimizing…" : "Execute Optimization"}</span>
          </button>
        </div>
      </div>

      {/* Main Optimization Panel Component */}
      <RecommendationsPanel
        data={optimize}
        loading={loadingOpt}
        onOptimize={onOptimize}
        onAuthorizeDispatch={onAuthorizeDispatch}
      />
    </div>
  );
}
