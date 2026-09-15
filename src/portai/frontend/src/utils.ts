// utils.ts — shared helpers & theme color mappings

import { RiskLabel } from "./types";

export const RISK_COLORS: Record<RiskLabel, { bg: string; text: string; dot: string; border: string; badgeBg: string }> = {
  LOW: {
    bg: "bg-brand-green/10",
    text: "text-brand-green",
    dot: "bg-brand-green",
    border: "border-brand-green/30",
    badgeBg: "bg-brand-green/20 text-brand-green",
  },
  MEDIUM: {
    bg: "bg-yellow-400/10",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
    border: "border-yellow-400/30",
    badgeBg: "bg-yellow-400/20 text-yellow-300",
  },
  HIGH: {
    bg: "bg-orange-400/10",
    text: "text-orange-400",
    dot: "bg-orange-400",
    border: "border-orange-400/30",
    badgeBg: "bg-orange-400/20 text-orange-300",
  },
  CRITICAL: {
    bg: "bg-brand-red/15",
    text: "text-brand-red",
    dot: "bg-brand-red",
    border: "border-brand-red/40",
    badgeBg: "bg-brand-red text-ocean-base",
  },
};

export function riskColor(label: RiskLabel) {
  return RISK_COLORS[label] ?? RISK_COLORS.CRITICAL;
}

export function fmt(n: number, decimals = 1) {
  return n.toFixed(decimals);
}
