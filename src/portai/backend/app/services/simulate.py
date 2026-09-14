"""
simulate.py
===========
What-if scenario simulator — modifies asset state in-memory only,
never writes to the database.

Public API
----------
    run_simulation(port_id, sim_type, target_id, db) -> dict

Supported scenario types
------------------------
    "berth_unavailable"  – mark target berth as unavailable and re-score
    "crane_unavailable"  – mark target crane as unavailable and re-score
"""

from __future__ import annotations

import copy
from typing import Any, Literal

from sqlalchemy.orm import Session

from ..models import Berth, Crane, Port, Vessel
from .congestion_engine import calculate_congestion_from_lists
from .optimizer import optimize_berths_from_lists, optimize_cranes_from_lists

SimType = Literal["berth_unavailable", "crane_unavailable"]


def run_simulation(
    port_id: int,
    sim_type: SimType,
    target_id: int,
    db: Session,
) -> dict[str, Any]:
    """
    Simulate the effect of marking one berth or crane as unavailable.

    Strategy
    --------
    1. Load all assets from DB (read-only).
    2. Build a BEFORE snapshot using the real current state.
    3. Clone the affected asset object in-memory and set status="maintenance".
       The DB record is never touched.
    4. Build an AFTER snapshot with the modified list.
    5. Diff the two assignment plans to find which vessels were reassigned.
    6. Return before/after metrics + diff + a plain-text impact summary.
    """
    # ── load from DB ──────────────────────────────────────────────────────────
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise ValueError(f"Port {port_id} not found")

    berths  = db.query(Berth).filter(Berth.port_id == port_id).all()
    cranes  = db.query(Crane).filter(Crane.port_id == port_id).all()
    vessels = db.query(Vessel).filter(Vessel.port_id == port_id).all()

    # Filter to only active terminals in the data
    if vessels:
        active_terminals = set(v.terminal for v in vessels)
        berths = [b for b in berths if b.terminal in active_terminals]
        cranes = [c for c in cranes if c.terminal in active_terminals]

    # ── validate target ───────────────────────────────────────────────────────
    if sim_type == "berth_unavailable":
        target = next((b for b in berths if b.id == target_id), None)
        if target is None:
            raise ValueError(f"Berth {target_id} not found in port {port_id}")
        target_label = f"Berth {target.berth_code} (terminal {target.terminal})"
    else:
        target = next((c for c in cranes if c.id == target_id), None)
        if target is None:
            raise ValueError(f"Crane {target_id} not found in port {port_id}")
        target_label = f"Crane {target.crane_code} (terminal {target.terminal})"

    # ── BEFORE state ──────────────────────────────────────────────────────────
    before_congestion = calculate_congestion_from_lists(port, berths, cranes, vessels)
    before_berth_plan = optimize_berths_from_lists(berths, vessels)
    before_crane_plan = optimize_cranes_from_lists(cranes, vessels, before_berth_plan["assignments"])

    # ── build modified (AFTER) asset lists — IN MEMORY ONLY ──────────────────
    # We use a lightweight proxy object instead of mutating the ORM instance.
    if sim_type == "berth_unavailable":
        after_berths = [_shadow_unavailable(b, target_id) for b in berths]
        after_cranes = cranes
    else:
        after_berths = berths
        after_cranes = [_shadow_unavailable(c, target_id) for c in cranes]

    # ── AFTER state ───────────────────────────────────────────────────────────
    after_congestion = calculate_congestion_from_lists(port, after_berths, after_cranes, vessels)
    after_berth_plan = optimize_berths_from_lists(after_berths, vessels)
    after_crane_plan = optimize_cranes_from_lists(after_cranes, vessels, after_berth_plan["assignments"])

    # ── diff: which vessels changed berth assignment? ─────────────────────────
    before_map = {a["vessel_code"]: a["berth_code"] for a in before_berth_plan["assignments"]}
    after_map  = {a["vessel_code"]: a["berth_code"] for a in after_berth_plan["assignments"]}

    reassigned = []
    newly_queued = []
    for a in after_berth_plan["assignments"]:
        vc = a["vessel_code"]
        if vc not in before_map:
            continue
        if before_map[vc] != after_map.get(vc):
            reassigned.append({
                "vessel_code":   vc,
                "priority":      a["priority"],
                "size":          a["size"],
                "from_berth":    before_map[vc],
                "to_berth":      after_map.get(vc, "(unassigned)"),
                "new_wait_hours": a["wait_hours"],
            })

    # Vessels present in before but missing from after = newly unserviceable
    after_assigned_codes = {a["vessel_code"] for a in after_berth_plan["assignments"]}
    before_assigned_codes = {a["vessel_code"] for a in before_berth_plan["assignments"]}
    newly_queued = list(before_assigned_codes - after_assigned_codes)

    # ── build plain-text impact summary (no LLM, purely data-derived) ────────
    score_delta = round(
        after_congestion["overall"]["congestion_score"]
        - before_congestion["overall"]["congestion_score"],
        1,
    )
    wait_delta = round(
        after_berth_plan["avg_wait_after_h"] - before_berth_plan["avg_wait_after_h"], 2
    )
    risk_change = (
        before_congestion["overall"]["risk_label"]
        + " -> "
        + after_congestion["overall"]["risk_label"]
    )

    if score_delta > 0:
        direction = f"increases congestion score by {score_delta} points"
    elif score_delta < 0:
        direction = f"decreases congestion score by {abs(score_delta)} points"
    else:
        direction = "does not change the congestion score"

    impact_summary = (
        f"Taking {target_label} offline {direction} "
        f"(risk: {risk_change}). "
        f"Average vessel wait time changes by {wait_delta:+.2f} h "
        f"and {len(reassigned)} vessel(s) must be reassigned to alternate berths."
    )
    if newly_queued:
        impact_summary += (
            f" {len(newly_queued)} vessel(s) cannot be accommodated "
            f"and move to the waiting queue."
        )

    return {
        "port_id":    port_id,
        "simulation": {
            "type":         sim_type,
            "target_id":    target_id,
            "target_label": target_label,
        },
        "before": {
            "congestion_score": before_congestion["overall"]["congestion_score"],
            "risk_label":       before_congestion["overall"]["risk_label"],
            "avg_wait_h":       before_berth_plan["avg_wait_after_h"],
            "queue_estimate":   before_congestion["raw_metrics"]["queue_estimate"],
            "available_berths": before_congestion["raw_metrics"]["available_berths"],
            "available_cranes": before_congestion["raw_metrics"]["available_cranes"],
        },
        "after": {
            "congestion_score": after_congestion["overall"]["congestion_score"],
            "risk_label":       after_congestion["overall"]["risk_label"],
            "avg_wait_h":       after_berth_plan["avg_wait_after_h"],
            "queue_estimate":   after_congestion["raw_metrics"]["queue_estimate"],
            "available_berths": after_congestion["raw_metrics"]["available_berths"],
            "available_cranes": after_congestion["raw_metrics"]["available_cranes"],
        },
        "delta": {
            "congestion_score": score_delta,
            "avg_wait_h":       wait_delta,
            "risk_label_change": risk_change,
            "vessels_reassigned": len(reassigned),
            "vessels_newly_queued": len(newly_queued),
        },
        "reassigned_vessels": reassigned,
        "newly_queued_vessels": newly_queued,
        "impact_summary": impact_summary,
        "after_assignment_plan": after_berth_plan["assignments"],
    }


# ── helpers ───────────────────────────────────────────────────────────────────

class _Shadowed:
    """
    Lightweight in-memory shadow of an ORM object with one field overridden.
    Proxies all attribute reads to the original; overrides only 'status'.
    Never touches the SQLAlchemy identity map.
    """
    __slots__ = ("_orig", "_overrides")

    def __init__(self, orig: Any, **overrides: Any):
        object.__setattr__(self, "_orig", orig)
        object.__setattr__(self, "_overrides", overrides)

    def __getattr__(self, name: str) -> Any:
        overrides = object.__getattribute__(self, "_overrides")
        if name in overrides:
            return overrides[name]
        return getattr(object.__getattribute__(self, "_orig"), name)


def _shadow_unavailable(asset: Any, target_id: int) -> Any:
    """Return a shadowed copy with status='maintenance' if id matches, else original."""
    if asset.id == target_id:
        return _Shadowed(asset, status="maintenance")
    return asset
