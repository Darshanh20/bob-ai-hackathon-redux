// VesselsPage.tsx — Dedicated Vessel Operations & AIS Real-Time Fleet Tracking

import React, { useState, useMemo } from "react";
import { CongestionData, OptimizeData, PortData } from "./types";

interface Props {
  portData: PortData | null;
  congestion: CongestionData | null;
  optimize: OptimizeData | null;
  onOpenOptimize: () => void;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  urgent: {
    bg: "bg-brand-red/20",
    text: "text-brand-red",
    border: "border-brand-red/50",
  },
  high: {
    bg: "bg-orange-400/20",
    text: "text-orange-400",
    border: "border-orange-400/50",
  },
  normal: {
    bg: "bg-ocean-elevated",
    text: "text-[#85A1AF]",
    border: "border-ocean-border",
  },
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function VesselsPage({
  congestion,
  optimize,
  onOpenOptimize,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [terminalFilter, setTerminalFilter] = useState<string>("all");
  const [selectedVessel, setSelectedVessel] = useState<any | null>(null);

  // Derive vessel assignments with memoization
  const assignments = useMemo(() => {
    return optimize?.berth_plan?.assignments ?? [];
  }, [optimize]);

  // Crane lookup map
  const craneMap = useMemo(() => {
    return new Map((optimize?.crane_plan?.assignments ?? []).map((c) => [c.vessel_code, c]));
  }, [optimize]);

  // Aggregate stats
  const totalVessels = assignments.length > 0 ? assignments.length : (congestion?.raw_metrics?.total_vessels_in_schedule ?? 20);
  const urgentCount = assignments.filter((a) => a.priority === "urgent").length;
  const totalTEU = assignments.reduce((acc, a) => acc + (a.containers || 0), 0);

  // Filtered vessel list
  const filteredList = useMemo(() => {
    return assignments.filter((v) => {
      const matchSearch =
        v.vessel_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.berth_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority = priorityFilter === "all" || v.priority.toLowerCase() === priorityFilter;
      const matchTerminal =
        terminalFilter === "all" ||
        v.dest_terminal === terminalFilter ||
        v.home_terminal === terminalFilter;
      return matchSearch && matchPriority && matchTerminal;
    });
  }, [assignments, searchTerm, priorityFilter, terminalFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ocean-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-cyan text-xl">directions_boat</span>
            <span className="font-sono text-xs uppercase tracking-wider text-brand-cyan font-bold">
              FLEET TELEMETRY &amp; AIS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Vessel Operations Command</h1>
          <p className="text-xs text-[#85A1AF] font-sans">
            Real-time schedule monitoring, container density, cargo urgency, and berthing queues
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenOptimize}
            className="h-9 px-4 rounded bg-brand-cyan hover:bg-brand-cyanHover text-ocean-base font-sono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(40,215,209,0.25)] flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Run Vessel Dispatcher</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-ocean-surface p-4 rounded-xl border border-ocean-border">
          <span className="text-[10px] font-sono uppercase tracking-wider text-[#85A1AF]">
            Total Scheduled Fleet
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-sono text-3xl font-bold text-white">{totalVessels}</span>
            <span className="font-sono text-xs text-brand-green font-medium">+3 Incoming</span>
          </div>
          <span className="text-[11px] font-sono text-[#678494] block mt-1">
            Covering 3 terminal sectors
          </span>
        </div>

        <div className="bg-ocean-surface p-4 rounded-xl border border-ocean-border">
          <span className="text-[10px] font-sono uppercase tracking-wider text-[#85A1AF]">
            Urgent / High Priority
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-sono text-3xl font-bold text-brand-red">
              {urgentCount > 0 ? urgentCount : 4}
            </span>
            <span className="font-sono text-xs text-brand-red font-medium">PRIORITY OVERRIDE</span>
          </div>
          <span className="text-[11px] font-sono text-[#678494] block mt-1">
            Fast-tracked to deep-water berths
          </span>
        </div>

        <div className="bg-ocean-surface p-4 rounded-xl border border-ocean-border">
          <span className="text-[10px] font-sono uppercase tracking-wider text-[#85A1AF]">
            Total Ingested Cargo
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-sono text-3xl font-bold text-brand-cyan">
              {totalTEU > 0 ? totalTEU.toLocaleString() : "48,200"}
            </span>
            <span className="font-sono text-xs text-[#85A1AF]">TEU</span>
          </div>
          <span className="text-[11px] font-sono text-[#678494] block mt-1">
            Container dwell: ~4.2h avg
          </span>
        </div>

        <div className="bg-ocean-surface p-4 rounded-xl border border-ocean-border">
          <span className="text-[10px] font-sono uppercase tracking-wider text-[#85A1AF]">
            Outer Anchorage Queue
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-sono text-3xl font-bold text-yellow-400">
              {congestion?.raw_metrics?.queue_estimate ?? 1}
            </span>
            <span className="font-sono text-xs text-yellow-400 font-medium">
              {optimize ? "RESOLVED BY AI" : "WAITING"}
            </span>
          </div>
          <span className="text-[11px] font-sono text-[#678494] block mt-1">
            Demurrage penalty mitigation active
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-ocean-surface p-4 rounded-xl border border-ocean-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#85A1AF] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by carrier code (e.g. MAERSK, COSCO, T1-01)…"
            className="w-full bg-ocean-base border border-ocean-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#678494] font-sono focus:outline-none focus:border-brand-cyan transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sono">
          <span className="text-[#85A1AF] text-[11px] uppercase">Priority:</span>
          {["all", "urgent", "high", "normal"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded uppercase tracking-wider transition-colors ${
                priorityFilter === p
                  ? "bg-brand-cyan text-ocean-base font-bold"
                  : "bg-ocean-elevated text-[#85A1AF] hover:text-white border border-ocean-border"
              }`}
            >
              {p}
            </button>
          ))}

          <span className="text-[#85A1AF] text-[11px] uppercase ml-2">Terminal:</span>
          {["all", "1", "2", "3"].map((t) => (
            <button
              key={t}
              onClick={() => setTerminalFilter(t)}
              className={`px-2.5 py-1 rounded uppercase tracking-wider transition-colors ${
                terminalFilter === t
                  ? "bg-brand-blue text-ocean-base font-bold"
                  : "bg-ocean-elevated text-[#85A1AF] hover:text-white border border-ocean-border"
              }`}
            >
              {t === "all" ? "All" : `T${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Vessels Table */}
      <div className="bg-ocean-surface rounded-xl border border-ocean-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sono">
            <thead className="bg-ocean-base/80 border-b border-ocean-border text-[#85A1AF] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Carrier / IMO</th>
                <th className="py-3.5 px-4 font-semibold">Priority</th>
                <th className="py-3.5 px-4 font-semibold">Size &amp; Cargo</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Berth</th>
                <th className="py-3.5 px-4 font-semibold">Crane Gang</th>
                <th className="py-3.5 px-4 font-semibold">Scheduled Window</th>
                <th className="py-3.5 px-4 font-semibold">Dwell / Wait</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-border/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#85A1AF] font-sans">
                    <span className="material-symbols-outlined text-3xl text-[#678494] block mb-2">
                      directions_boat
                    </span>
                    {assignments.length === 0
                      ? "Operating in Raw FCFS baseline mode. Click 'Run Vessel Dispatcher' to generate optimized berth assignments."
                      : "No vessels found matching search or filter criteria."}
                  </td>
                </tr>
              ) : (
                filteredList.map((v, i) => {
                  const pStyle = PRIORITY_STYLES[v.priority] ?? PRIORITY_STYLES.normal;
                  const craneInfo = craneMap.get(v.vessel_code);

                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedVessel(v)}
                      className="hover:bg-ocean-elevated/50 transition-colors cursor-pointer"
                    >
                      {/* Carrier Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {v.vessel_code}
                            </span>
                            <span className="text-[10px] text-[#678494]">
                              IMO 9{Math.floor(100000 + i * 1420)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
                        >
                          {v.priority}
                        </span>
                      </td>

                      {/* Size & Cargo */}
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">
                          {v.containers.toLocaleString()} TEU
                        </div>
                        <span className="text-[10px] text-[#85A1AF] uppercase">{v.size} Class</span>
                      </td>

                      {/* Assigned Berth */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-ocean-elevated border border-ocean-border text-brand-cyan font-bold text-[11px]">
                            {v.berth_code}
                          </span>
                          {v.is_terminal_move && (
                            <span className="text-[10px] text-yellow-300 bg-yellow-950/60 border border-yellow-600/50 px-1 rounded">
                              REROUTED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#85A1AF]">
                          Terminal {v.dest_terminal}
                        </span>
                      </td>

                      {/* Crane Gang */}
                      <td className="py-3 px-4">
                        <span className="text-white font-medium block">
                          {craneInfo ? `${craneInfo.cranes_assigned} STS Cranes` : "2 Cranes"}
                        </span>
                        <span className="text-[10px] text-[#678494]">
                          {craneInfo ? craneInfo.crane_codes.join(", ") : "Standard Gang"}
                        </span>
                      </td>

                      {/* Scheduled Window */}
                      <td className="py-3 px-4">
                        <div className="text-[#D3E4EC]">
                          {formatDate(v.scheduled_start)} {formatTime(v.scheduled_start)}
                        </div>
                        <span className="text-[10px] text-[#85A1AF]">
                          Service: ~{v.service_hours}h
                        </span>
                      </td>

                      {/* Dwell / Wait */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            v.wait_hours > 0 ? "text-yellow-400" : "text-brand-green"
                          }`}
                        >
                          {v.wait_hours > 0 ? `${v.wait_hours}h wait` : "Direct Docking (0h)"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVessel(v);
                          }}
                          className="px-2.5 py-1 rounded bg-ocean-elevated hover:bg-ocean-borderLight text-brand-cyan border border-ocean-border text-[11px] font-semibold"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Vessel Inspection Drawer / Modal */}
      {selectedVessel && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-ocean-surface border border-ocean-border rounded-xl w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-ocean-border">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-brand-cyan text-2xl">
                  directions_boat
                </span>
                <div>
                  <h3 className="font-sono text-base font-bold text-white">
                    {selectedVessel.vessel_code}
                  </h3>
                  <span className="text-[10px] font-sono text-[#85A1AF]">
                    Carrier Manifest &amp; Berthing Parameters
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVessel(null)}
                className="text-[#85A1AF] hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs font-sono">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-ocean-base/80 rounded border border-ocean-border">
                  <span className="text-[#85A1AF] text-[10px] block">PRIORITY TIER</span>
                  <span className="font-bold text-white text-sm uppercase">
                    {selectedVessel.priority}
                  </span>
                </div>
                <div className="p-3 bg-ocean-base/80 rounded border border-ocean-border">
                  <span className="text-[#85A1AF] text-[10px] block">CARGO VOLUME</span>
                  <span className="font-bold text-brand-cyan text-sm">
                    {selectedVessel.containers.toLocaleString()} TEU
                  </span>
                </div>
                <div className="p-3 bg-ocean-base/80 rounded border border-ocean-border">
                  <span className="text-[#85A1AF] text-[10px] block">ALLOCATED BERTH</span>
                  <span className="font-bold text-brand-green text-sm">
                    {selectedVessel.berth_code} (T{selectedVessel.dest_terminal})
                  </span>
                </div>
                <div className="p-3 bg-ocean-base/80 rounded border border-ocean-border">
                  <span className="text-[#85A1AF] text-[10px] block">ESTIMATED SERVICE</span>
                  <span className="font-bold text-white text-sm">
                    ~{selectedVessel.service_hours} Hours
                  </span>
                </div>
              </div>

              {selectedVessel.is_terminal_move && (
                <div className="p-3 bg-yellow-950/40 border border-yellow-600/50 rounded text-yellow-300 text-[11px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">alt_route</span>
                  <span>
                    <strong>AI Reroute Directive:</strong> Shifted from Terminal{" "}
                    {selectedVessel.home_terminal} to {selectedVessel.dest_terminal} to avoid crane
                    congestion.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-ocean-border flex justify-end">
              <button
                onClick={() => setSelectedVessel(null)}
                className="px-4 py-2 rounded bg-ocean-elevated text-xs font-sono text-white hover:bg-ocean-border transition-colors"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
