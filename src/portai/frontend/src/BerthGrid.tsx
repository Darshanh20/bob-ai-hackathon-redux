// BerthGrid.tsx — Berth status grid grouped by terminal

import React from "react";
import { BerthRecord } from "./types";

interface Props {
  berths: BerthRecord[];
}

const STATUS_STYLE: Record<string, string> = {
  available:   "bg-emerald-600/70 border-emerald-500 text-emerald-100",
  maintenance: "bg-yellow-600/70  border-yellow-500  text-yellow-100",
  occupied:    "bg-red-700/70     border-red-600     text-red-100",
};

export default function BerthGrid({ berths }: Props) {
  // Group by terminal
  const byTerminal: Record<string, BerthRecord[]> = {};
  for (const b of berths) {
    (byTerminal[b.terminal] ??= []).push(b);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
        Berth Status
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {Object.entries(byTerminal)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([terminal, tbBerths]) => (
            <div key={terminal} className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2">
              <div className="text-xs font-bold text-slate-300 tracking-widest">{terminal}</div>
              <div className="flex flex-wrap gap-2">
                {tbBerths.map((berth) => (
                  <div
                    key={berth.id}
                    title={`${berth.berth_code} | ${berth.max_vessel_size} | ${berth.capacity_teu} TEU | ${berth.status}`}
                    className={`
                      border rounded px-2 py-1 text-[10px] font-mono font-semibold cursor-default
                      ${STATUS_STYLE[berth.status] ?? STATUS_STYLE.occupied}
                    `}
                  >
                    {berth.berth_code.replace("BRT-", "")}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-500 flex-wrap">
                {tbBerths.map((b) => (
                  <span key={b.id} className="capitalize">{b.status.charAt(0)}</span>
                ))}
              </div>
            </div>
          ))}
      </div>
      {/* Legend */}
      <div className="flex gap-4 text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"/>Available</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block"/>Maintenance</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-600 inline-block"/>Occupied</span>
      </div>
    </div>
  );
}
