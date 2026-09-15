// BerthGrid.tsx — Tactical Berth Allocation Status Matrix

import React from "react";
import { BerthRecord } from "./types";

interface Props {
  berths: BerthRecord[];
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; label: string; dot: string }
> = {
  available: {
    bg: "bg-brand-green/15",
    text: "text-brand-green",
    border: "border-brand-green/40",
    label: "AVAILABLE",
    dot: "bg-brand-green",
  },
  maintenance: {
    bg: "bg-brand-red/20",
    text: "text-brand-red",
    border: "border-brand-red/50",
    label: "MAINTENANCE",
    dot: "bg-brand-red",
  },
  occupied: {
    bg: "bg-brand-cyan/15",
    text: "text-brand-cyan",
    border: "border-brand-cyan/40",
    label: "OCCUPIED",
    dot: "bg-brand-cyan",
  },
};

export default function BerthGrid({ berths }: Props) {
  // Group berths by terminal
  const byTerminal: Record<string, BerthRecord[]> = {};
  for (const b of berths) {
    (byTerminal[b.terminal] ??= []).push(b);
  }

  const sortedTerminals = Object.entries(byTerminal).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-sono uppercase tracking-wider text-[#85A1AF] font-semibold">
            Live Berth Allocation Status
          </h3>
          <p className="text-[11px] text-[#678494] font-sono">
            Tactical Berth Board · {berths.length} Total Berths Monitored
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-sono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-green inline-block"></span>
            <span className="text-[#85A1AF]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-cyan inline-block"></span>
            <span className="text-[#85A1AF]">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-red inline-block"></span>
            <span className="text-[#85A1AF]">Maintenance</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedTerminals.map(([terminal, tbBerths]) => {
          const availCount = tbBerths.filter((b) => b.status === "available").length;
          const occCount = tbBerths.filter((b) => b.status === "occupied").length;
          const maintCount = tbBerths.filter((b) => b.status === "maintenance").length;

          return (
            <div
              key={terminal}
              className="bg-ocean-surface rounded-xl border border-ocean-border p-4 space-y-3 hover:border-ocean-borderLight transition-all"
            >
              <div className="flex items-center justify-between pb-2 border-b border-ocean-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-sono text-sm font-bold text-white tracking-wide">
                    Terminal {terminal}
                  </span>
                  <span className="text-[10px] font-sono text-[#85A1AF] px-1.5 py-0.5 rounded bg-ocean-elevated border border-ocean-border">
                    {tbBerths.length} Berths
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-sono">
                  <span className="text-brand-green font-semibold">{availCount} Free</span>
                  <span className="text-[#678494]">·</span>
                  <span className="text-brand-cyan font-semibold">{occCount} Active</span>
                  {maintCount > 0 && (
                    <>
                      <span className="text-[#678494]">·</span>
                      <span className="text-brand-red font-semibold">{maintCount} Maint</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tbBerths.map((berth) => {
                  const cfg = STATUS_CONFIG[berth.status] ?? STATUS_CONFIG.occupied;
                  const cleanCode = berth.berth_code.replace("BRT-", "");

                  return (
                    <div
                      key={berth.id}
                      className={`p-2.5 rounded-lg border bg-ocean-base/60 ${cfg.border} flex flex-col justify-between gap-2 hover:scale-[1.01] transition-transform`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-sono text-xs font-bold text-white">
                            {cleanCode}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-sono text-[9px] font-bold uppercase ${cfg.bg} ${cfg.text}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] font-sono text-[#85A1AF] space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-[#678494]">Max Vessel:</span>
                          <span className="text-white font-medium">{berth.max_vessel_size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#678494]">Capacity:</span>
                          <span className="text-white font-medium">{berth.capacity_teu.toLocaleString()} TEU</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
