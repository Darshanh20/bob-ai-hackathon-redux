// SidebarNav.tsx — Collapsible Side Navigation Slider for Maritime Command Center

import React from "react";
import { NavPage } from "./types";

interface Props {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  isOpen: boolean;
  onToggle: () => void;
  vesselCount?: number;
  terminalCount?: number;
  onOpenUpload: () => void;
  onReturnToLanding: () => void;
  portName?: string;
}

interface NavItem {
  id: NavPage;
  label: string;
  subtitle: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

export default function SidebarNav({
  currentPage,
  onSelectPage,
  isOpen,
  onToggle,
  vesselCount = 0,
  terminalCount = 0,
  onOpenUpload,
  onReturnToLanding,
  portName = "ABC INTERNATIONAL PORT",
}: Props) {
  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Overview",
      subtitle: "Command Center",
      icon: "space_dashboard",
    },
    {
      id: "vessels",
      label: "Vessels",
      subtitle: "AIS Live Tracking",
      icon: "directions_boat",
      badge: vesselCount > 0 ? `${vesselCount}` : undefined,
      badgeColor: "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40",
    },
    {
      id: "terminals",
      label: "Terminals",
      subtitle: "Berths & Cranes",
      icon: "dock",
      badge: terminalCount > 0 ? `${terminalCount}` : undefined,
      badgeColor: "bg-brand-blue/20 text-brand-blue border border-brand-blue/40",
    },
    {
      id: "dispatch",
      label: "Dispatch",
      subtitle: "Optimizer Directives",
      icon: "bolt",
      badge: "-49.9%",
      badgeColor: "bg-brand-green/20 text-brand-green border border-brand-green/40 font-bold",
    },
    {
      id: "simulation",
      label: "Simulation",
      subtitle: "What-If Incident Lab",
      icon: "science",
    },
    {
      id: "reports",
      label: "Reports",
      subtitle: "72H Shift Audits",
      icon: "analytics",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Slider Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-ocean-surface border-r border-ocean-border/80 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl ${
          isOpen ? "w-64" : "w-20"
        } ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header / Brand */}
        <div>
          <div
            className={`h-16 flex items-center border-b border-ocean-border/80 bg-ocean-base/60 ${
              isOpen ? "px-4 justify-between" : "px-2 justify-center"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                onClick={!isOpen ? onToggle : undefined}
                title={!isOpen ? "Click to expand sidebar" : undefined}
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan shrink-0 transition-transform ${
                  !isOpen ? "cursor-pointer hover:scale-105 hover:border-brand-cyan" : ""
                }`}
              >
                <span className="material-symbols-outlined text-2xl font-bold">radar</span>
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                </span>
              </button>

              {isOpen && (
                <div className="flex flex-col truncate">
                  <span className="font-sono font-bold text-lg tracking-wider text-white">
                    PORT<span className="text-brand-cyan">AI</span>
                  </span>
                  <span className="text-[9px] font-sono text-[#85A1AF] uppercase tracking-widest truncate">
                    COMMAND SUITE
                  </span>
                </div>
              )}
            </div>

            {/* Collapse Button (Only shown when expanded in header) */}
            {isOpen && (
              <button
                onClick={onToggle}
                title="Collapse Sidebar"
                className="p-1.5 rounded-lg bg-ocean-elevated hover:bg-ocean-borderLight text-[#85A1AF] hover:text-white border border-ocean-border transition-colors hidden lg:flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            )}
          </div>

          {/* Port Info Mini-Badge */}
          {isOpen && (
            <div className="px-4 py-3 border-b border-ocean-border/50 bg-ocean-base/30">
              <div className="flex items-center justify-between text-[11px] font-sono text-[#85A1AF]">
                <span className="uppercase tracking-wider font-semibold text-white truncate">
                  {portName}
                </span>
                <span className="text-brand-green font-bold text-[10px]">ONLINE</span>
              </div>
              <div className="text-[10px] font-sono text-[#678494] mt-0.5">
                AIS Telemetry Stream Active
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-2.5 space-y-1.5">
            {navItems.map((item) => {
              const active = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectPage(item.id);
                  }}
                  title={!isOpen ? item.label : undefined}
                  className={`w-full flex items-center font-sono transition-all group ${
                    isOpen
                      ? "gap-3 px-3.5 py-2.5 rounded-xl text-left"
                      : "justify-center p-3 rounded-xl"
                  } ${
                    active
                      ? "bg-brand-cyan text-ocean-base font-bold shadow-[0_0_16px_rgba(40,215,209,0.25)]"
                      : "text-[#85A1AF] hover:text-white hover:bg-ocean-elevated"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 transition-transform group-hover:scale-110 ${
                      active ? "text-ocean-base" : "text-[#85A1AF] group-hover:text-brand-cyan"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {isOpen && (
                    <div className="flex-1 flex items-center justify-between truncate">
                      <div className="flex flex-col truncate">
                        <span className="text-xs uppercase tracking-wider truncate">
                          {item.label}
                        </span>
                        <span
                          className={`text-[10px] truncate ${
                            active ? "text-ocean-base/80" : "text-[#678494]"
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                            active ? "bg-ocean-base text-brand-cyan" : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions / Footer */}
        <div className="p-2.5 border-t border-ocean-border/80 bg-ocean-base/40 space-y-2">
          {isOpen ? (
            <>
              <button
                onClick={onOpenUpload}
                className="w-full h-9 px-3 rounded-lg bg-ocean-elevated hover:bg-ocean-borderLight text-white font-sono text-xs font-semibold uppercase tracking-wider border border-ocean-border flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-brand-cyan">
                  upload_file
                </span>
                <span>Upload Schedule</span>
              </button>

              <button
                onClick={onReturnToLanding}
                className="w-full text-center text-[10px] font-sono text-[#85A1AF] hover:text-brand-cyan transition-colors py-1 flex items-center justify-center gap-1"
              >
                <span>Ingestion Workflow</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenUpload}
                title="Upload Schedule CSV"
                className="w-full h-10 rounded-lg bg-ocean-elevated hover:bg-ocean-borderLight text-brand-cyan border border-ocean-border flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
              </button>

              {/* Dedicated Expand Button in Collapsed State */}
              <button
                onClick={onToggle}
                title="Expand Sidebar"
                className="w-full h-9 rounded-lg bg-ocean-elevated hover:bg-ocean-borderLight text-[#85A1AF] hover:text-white border border-ocean-border flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
