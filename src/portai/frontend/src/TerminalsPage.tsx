// TerminalsPage.tsx — Dedicated Terminal Sectors, Berths & Crane Infrastructure Hub

import React, { useState } from "react";
import BerthGrid from "./BerthGrid";
import { CongestionData, PortData } from "./types";
import { riskColor } from "./utils";

interface Props {
  portData: PortData | null;
  congestion: CongestionData | null;
  onOpenSimulation: () => void;
}

const TERMINAL_DETAILS: Record<
  string,
  {
    name: string;
    description: string;
    quayLength: string;
    maxDraft: string;
    stsCraneCount: number;
    specialization: string;
  }
> = {
  "1": {
    name: "Pacific North Mega-Terminal",
    description: "Deep-water quay engineered for ultra-large container vessels (ULCVs) and triple-E class carriers.",
    quayLength: "1,200m Quay Line",
    maxDraft: "16.5m Deep Water",
    stsCraneCount: 10,
    specialization: "Ultra-Large Containers & Transshipment",
  },
  "2": {
    name: "Central Basin Multi-Cargo",
    description: "High-efficiency multi-purpose container terminal with fast-cycling dual-hoist STS cranes.",
    quayLength: "950m Quay Line",
    maxDraft: "14.8m Standard Draft",
    stsCraneCount: 10,
    specialization: "High-Speed Intermediate Carriers",
  },
  "3": {
    name: "South Channel Feeder Terminal",
    description: "Specialized feeder and break-bulk terminal with rapid turnaround times and rail links.",
    quayLength: "650m Quay Line",
    maxDraft: "12.5m Channel Draft",
    stsCraneCount: 8,
    specialization: "Regional Feeders & Break-Bulk",
  },
};

export default function TerminalsPage({
  portData,
  congestion,
  onOpenSimulation,
}: Props) {
  const [activeTerminalTab, setActiveTerminalTab] = useState<string>("all");

  const breakdown = congestion?.terminal_breakdown ?? [];
  const berthRecords = portData?.berth_records ?? [];
  const craneRecords = portData?.crane_records ?? [];

  const filteredBerths =
    activeTerminalTab === "all"
      ? berthRecords
      : berthRecords.filter((b) => b.terminal === activeTerminalTab || b.terminal === `T${activeTerminalTab}`);

  const filteredCranes =
    activeTerminalTab === "all"
      ? craneRecords
      : craneRecords.filter((c) => c.terminal === activeTerminalTab || c.terminal === `T${activeTerminalTab}`);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ocean-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-cyan text-xl">dock</span>
            <span className="font-sono text-xs uppercase tracking-wider text-brand-cyan font-bold">
              TERMINAL INFRASTRUCTURE &amp; QUAY
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Terminal Hub &amp; Berth Allocation</h1>
          <p className="text-xs text-[#85A1AF] font-sans">
            Real-time telemetry across harbor sectors, deep-water berths, STS crane gangs, and yard capacity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSimulation}
            className="h-9 px-4 rounded bg-ocean-elevated hover:bg-ocean-borderLight text-white font-sono text-xs font-semibold uppercase tracking-wider border border-ocean-border transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-brand-cyan">science</span>
            <span>Simulate Outage</span>
          </button>
        </div>
      </div>

      {/* Terminal Sector Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {breakdown.map((t) => {
          const cleanKey = t.terminal.replace("T", "");
          const details = TERMINAL_DETAILS[cleanKey] ?? TERMINAL_DETAILS["1"];
          const trc = riskColor(t.risk_label);

          return (
            <div
              key={t.terminal}
              className={`bg-ocean-surface rounded-xl p-5 border ${
                t.risk_label === "CRITICAL"
                  ? "border-brand-red/60 shadow-xl"
                  : "border-ocean-border hover:border-ocean-borderLight"
              } flex flex-col justify-between transition-all`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-sono text-base font-bold text-white block">
                      Terminal {t.terminal}
                    </span>
                    <span className="text-[11px] font-sono text-[#85A1AF]">{details.name}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded font-sono text-[11px] font-bold uppercase ${trc.badgeBg}`}
                  >
                    {t.risk_label}
                  </span>
                </div>

                <p className="text-xs text-[#85A1AF] leading-relaxed font-sans">{details.description}</p>

                {/* 3 Major Indicators */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-ocean-border/60 text-center font-sono bg-ocean-base/40 rounded-lg">
                  <div>
                    <span className="text-xl font-bold text-white block">{t.vessel_count}</span>
                    <span className="text-[10px] text-[#85A1AF] uppercase">Vessels</span>
                  </div>
                  <div>
                    <span
                      className={`text-xl font-bold block ${
                        t.berth_utilization >= 85 ? "text-brand-red" : "text-white"
                      }`}
                    >
                      {t.berth_utilization}%
                    </span>
                    <span className="text-[10px] text-[#85A1AF] uppercase">Berth Util</span>
                  </div>
                  <div>
                    <span
                      className={`text-xl font-bold block ${
                        t.queue_estimate > 0 ? "text-brand-red" : "text-brand-green"
                      }`}
                    >
                      {t.queue_estimate}
                    </span>
                    <span className="text-[10px] text-[#85A1AF] uppercase">Queued</span>
                  </div>
                </div>

                <div className="text-[11px] font-sono text-[#85A1AF] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#678494]">Quay Specification:</span>
                    <span className="text-white font-medium">{details.quayLength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#678494]">Channel Draft:</span>
                    <span className="text-brand-cyan font-medium">{details.maxDraft}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#678494]">STS Cranes:</span>
                    <span className="text-white font-medium">{details.stsCraneCount} Online</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-ocean-border/60 flex items-center justify-between">
                <span className="text-[11px] font-sono text-brand-cyan">
                  {details.specialization}
                </span>
                <button
                  onClick={() => setActiveTerminalTab(cleanKey)}
                  className="text-xs font-sono text-brand-cyan hover:underline font-semibold"
                >
                  Filter Matrix →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-ocean-border/80 pb-2">
        <span className="text-xs font-sono text-[#85A1AF] uppercase mr-2 font-semibold">
          Sector Filter:
        </span>
        {["all", "1", "2", "3"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTerminalTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-sono uppercase tracking-wider transition-colors ${
              activeTerminalTab === tab
                ? "bg-brand-cyan text-ocean-base font-bold"
                : "bg-ocean-elevated text-[#85A1AF] hover:text-white border border-ocean-border"
            }`}
          >
            {tab === "all" ? "All Sectors" : `Terminal ${tab}`}
          </button>
        ))}
      </div>

      {/* Tactical Berth Matrix Section */}
      <div className="bg-ocean-surface rounded-xl border border-ocean-border p-6 shadow-xl space-y-4">
        <BerthGrid berths={filteredBerths} />
      </div>

      {/* STS Cranes Status Grid */}
      <div className="bg-ocean-surface rounded-xl border border-ocean-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-sono uppercase tracking-wider text-[#85A1AF] font-semibold">
              STS Crane Allocation &amp; Maintenance Status
            </h3>
            <p className="text-[11px] text-[#678494] font-sono">
              {filteredCranes.length} Total STS Gantry Cranes Monitored
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-sono">
            <span className="text-brand-green">● Available</span>
            <span className="text-brand-cyan">● Operational</span>
            <span className="text-brand-red">● Maintenance</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredCranes.map((c) => {
            const isMaint = c.status === "maintenance";
            const isOcc = c.status === "occupied";

            return (
              <div
                key={c.id}
                className={`p-3 rounded-lg border bg-ocean-base/80 text-center font-sono flex flex-col justify-between gap-1 transition-all ${
                  isMaint
                    ? "border-brand-red/50 bg-brand-red/10"
                    : isOcc
                    ? "border-brand-cyan/40"
                    : "border-ocean-border hover:border-brand-green/50"
                }`}
              >
                <span className="text-xs font-bold text-white block">{c.crane_code}</span>
                <span className="text-[10px] text-[#85A1AF]">Terminal {c.terminal}</span>
                <span
                  className={`text-[9px] font-bold uppercase mt-1 px-1 py-0.5 rounded ${
                    isMaint
                      ? "bg-brand-red text-ocean-base"
                      : isOcc
                      ? "bg-brand-cyan/20 text-brand-cyan"
                      : "bg-brand-green/20 text-brand-green"
                  }`}
                >
                  {c.status}
                </span>
                <span className="text-[9px] text-[#678494] mt-0.5">
                  {c.capacity_moves_per_hour} mv/h
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
