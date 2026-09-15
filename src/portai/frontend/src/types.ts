// types.ts — shared TypeScript types for all PORTAI dashboard components

export type RiskLabel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NavPage = "overview" | "vessels" | "terminals" | "dispatch" | "simulation" | "reports";

export interface ForecastWindow {
  window: string;
  window_start: string;
  window_end: string;
  vessel_count: number;
  congestion_score: number;
  risk_label: RiskLabel;
}

export interface TerminalBreakdown {
  terminal: string;
  vessel_count: number;
  berth_utilization: number;
  crane_utilization: number;
  queue_estimate: number;
  congestion_score: number;
  risk_label: RiskLabel;
}

export interface CongestionData {
  port_id: number;
  port_name: string;
  computed_at: string;
  overall: {
    congestion_score: number;
    risk_label: RiskLabel;
    peak_window_start: string;
    peak_window_end: string;
  };
  raw_metrics: {
    berth_utilization_pct: number;
    crane_utilization_pct: number;
    total_vessels_in_schedule: number;
    incoming_next_8h: number;
    queue_estimate: number;
    available_berths: number;
    available_cranes: number;
  };
  forecast: ForecastWindow[];
  terminal_breakdown: TerminalBreakdown[];
}

export interface BerthRecord {
  id: number;
  berth_code: string;
  terminal: string;
  max_vessel_size: string;
  status: "available" | "maintenance" | "occupied";
  capacity_teu: number;
}

export interface CraneRecord {
  id: number;
  crane_code: string;
  terminal: string;
  capacity_moves_per_hour: number;
  status: "available" | "maintenance" | "occupied";
}

export interface VesselRecord {
  id: number;
  vessel_code: string;
  eta: string;
  etd: string;
  containers: number;
  size: "small" | "medium" | "large" | string;
  priority: "normal" | "high" | "urgent" | string;
  terminal: string;
  assigned_berth_id?: number | null;
  assigned_cranes?: string[];
}

export interface PortData {
  id: number;
  name: string;
  terminals: number;
  berths: number;
  cranes: number;
  yard_capacity: number;
  berth_records: BerthRecord[];
  crane_records: CraneRecord[];
}

export interface OptimizeMove {
  vessel_code: string;
  priority: string;
  from_terminal: string;
  to_terminal: string;
  assigned_berth: string;
  reason: string;
}

export interface OptimizeData {
  summary: {
    total_vessels: number;
    vessels_assigned: number;
    conflicts_resolved: number;
    recommended_moves: number;
    avg_wait_before_h: number;
    avg_wait_after_h: number;
    improvement_percent: number;
  };
  berth_plan: {
    assignments: Array<{
      vessel_code: string;
      size: string;
      priority: string;
      containers: number;
      berth_code: string;
      home_terminal: string;
      dest_terminal: string;
      scheduled_start: string;
      wait_hours: number;
      service_hours: number;
      is_terminal_move: boolean;
      eta?: string;
    }>;
    recommended_moves: OptimizeMove[];
  };
  crane_plan: {
    assignments?: Array<{
      vessel_code: string;
      terminal: string;
      priority: string;
      containers: number;
      cranes_assigned: number;
      crane_codes: string[];
      est_throughput_teu_per_h?: number;
    }>;
    terminal_summaries: Array<{
      terminal: string;
      available_cranes: number;
      cranes_allocated: number;
      utilization_pct: number;
      vessels_served: number;
    }>;
  };
}

export interface SimulateResult {
  simulation: { type: string; target_id: number; target_label: string };
  before: { congestion_score: number; risk_label: RiskLabel; avg_wait_h: number; queue_estimate: number; available_berths: number };
  after:  { congestion_score: number; risk_label: RiskLabel; avg_wait_h: number; queue_estimate: number; available_berths: number };
  delta: {
    congestion_score: number;
    avg_wait_h: number;
    risk_label_change: string;
    vessels_reassigned: number;
    vessels_newly_queued: number;
  };
  reassigned_vessels: Array<{ vessel_code: string; priority: string; from_berth: string; to_berth: string; new_wait_hours: number }>;
  impact_summary: string;
}

export interface ReportData {
  port: string;
  generated_at: string;
  overall_risk: RiskLabel;
  expected_vessels: number;
  high_risk_terminal: string;
  peak_congestion_window: string;
  key_risks: string[];
  ai_recommendations: string[];
  expected_impact: {
    wait_time_reduction_pct: number;
    vessels_cleared: number;
    queue_reduction: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}
