// utils.ts — shared helpers

import { RiskLabel } from "./types";

export const RISK_COLORS: Record<RiskLabel, { bg: string; text: string; dot: string; border: string }> = {
  LOW:      { bg: "bg-emerald-900/40", text: "text-emerald-400", dot: "bg-emerald-400", border: "border-emerald-600" },
  MEDIUM:   { bg: "bg-yellow-900/40",  text: "text-yellow-400",  dot: "bg-yellow-400",  border: "border-yellow-600" },
  HIGH:     { bg: "bg-orange-900/40",  text: "text-orange-400",  dot: "bg-orange-400",  border: "border-orange-600" },
  CRITICAL: { bg: "bg-red-900/40",     text: "text-red-400",     dot: "bg-red-400",     border: "border-red-600"    },
};

export function riskColor(label: RiskLabel) {
  return RISK_COLORS[label] ?? RISK_COLORS.CRITICAL;
}

export function fmt(n: number, decimals = 1) {
  return n.toFixed(decimals);
}
