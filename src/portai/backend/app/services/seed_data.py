"""
seed_data.py – Populate the SQLite database with a realistic demo dataset.

Run from the backend/ directory:
    python -m app.services.seed_data
"""

import random
import sys
import os
from datetime import datetime, timedelta

# ── allow running as a script from backend/ ──────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from app.database import SessionLocal, engine
from app.models import Base, Port, Berth, Crane, Vessel

# ── constants ─────────────────────────────────────────────────────────────────
RANDOM_SEED   = 42
NUM_TERMINALS = 4
NUM_BERTHS    = 12
NUM_CRANES    = 25
TARGET_VESSELS = 45   # final count will be 40-50

# Heavy-traffic terminals (indices 0 and 1 get ~60% of vessel traffic)
HEAVY_TERMINALS = [0, 1]

TERMINAL_NAMES = [f"T{i+1}" for i in range(NUM_TERMINALS)]

BERTH_SIZES = {
    "T1": ["large",  "large",  "medium"],   # 3 berths
    "T2": ["large",  "medium", "medium"],   # 3 berths
    "T3": ["medium", "medium", "small"],    # 3 berths
    "T4": ["medium", "small",  "small"],    # 3 berths
}

# TEU capacities by size
TEU_BY_SIZE = {"large": 8000, "medium": 4500, "small": 2000}

# Moves/hour bands by terminal (heavier terminals get faster cranes)
CRANE_MPH = {"T1": (28, 35), "T2": (25, 33), "T3": (20, 28), "T4": (18, 24)}

# Vessel container counts by size
CONTAINERS_BY_SIZE = {
    "small":  (200,  800),
    "medium": (800,  2500),
    "large":  (2500, 8000),
}

# Vessel name prefixes for realism
VESSEL_PREFIXES = [
    "MV", "SS", "MSC", "OOCL", "CSCL", "CMA", "NYK", "HMM",
    "ONE", "YML", "ZIM", "PIL", "WANHAI", "COSCO", "APL",
]
VESSEL_WORDS = [
    "ATLAS", "TITAN", "PHOENIX", "HORIZON", "NORDIC", "PACIFIC",
    "ATLANTIC", "INDUS", "EAGLE", "FALCON", "PIONEER", "ODYSSEY",
    "TRIUMPH", "VENTURE", "LIBERTY", "HARMONY", "UNITY", "FORTUNE",
    "STAR", "CROWN", "EMERALD", "SAPPHIRE", "DIAMOND", "RUBY",
    "SUMMIT", "CREST", "WAVE", "BREEZE", "SPIRIT", "VOYAGE",
]


def _vessel_code(used: set) -> str:
    while True:
        prefix = random.choice(VESSEL_PREFIXES)
        word   = random.choice(VESSEL_WORDS)
        num    = random.randint(100, 999)
        code   = f"{prefix}-{word}-{num}"
        if code not in used:
            used.add(code)
            return code


def seed():
    random.seed(RANDOM_SEED)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── wipe existing data ────────────────────────────────────────────────
        db.query(Vessel).delete()
        db.query(Crane).delete()
        db.query(Berth).delete()
        db.query(Port).delete()
        db.commit()

        # ── 1. Port ───────────────────────────────────────────────────────────
        port = Port(
            name="ABC International Port",
            terminals=NUM_TERMINALS,
            berths=NUM_BERTHS,
            cranes=NUM_CRANES,
            yard_capacity=50_000,
        )
        db.add(port)
        db.flush()   # get port.id

        # ── 2. Berths ─────────────────────────────────────────────────────────
        maintenance_berths = set(random.sample(range(NUM_BERTHS), 2))
        berth_objects = []
        berth_idx = 0
        for t_name, sizes in BERTH_SIZES.items():
            for slot_i, size in enumerate(sizes):
                if berth_idx in maintenance_berths:
                    status = "maintenance"
                else:
                    status = "available"
                b = Berth(
                    port_id        = port.id,
                    berth_code     = f"BRT-{t_name}-{slot_i+1:02d}",
                    terminal       = t_name,
                    max_vessel_size= size,
                    status         = status,
                    capacity_teu   = TEU_BY_SIZE[size],
                )
                db.add(b)
                berth_objects.append(b)
                berth_idx += 1
        db.flush()

        # ── 3. Cranes ─────────────────────────────────────────────────────────
        # distribute 25 cranes: T1=8, T2=7, T3=6, T4=4
        cranes_per_terminal = {"T1": 8, "T2": 7, "T3": 6, "T4": 4}
        maintenance_cranes  = set(random.sample(range(NUM_CRANES), 2))
        crane_idx = 0
        for t_name, count in cranes_per_terminal.items():
            mph_lo, mph_hi = CRANE_MPH[t_name]
            for c_i in range(count):
                if crane_idx in maintenance_cranes:
                    status = "maintenance"
                else:
                    status = "available"
                c = Crane(
                    port_id               = port.id,
                    crane_code            = f"CRN-{t_name}-{c_i+1:02d}",
                    terminal              = t_name,
                    capacity_moves_per_hour = random.randint(mph_lo, mph_hi),
                    status                = status,
                )
                db.add(c)
                crane_idx += 1
        db.flush()

        # ── 4. Vessels ────────────────────────────────────────────────────────
        now       = datetime.utcnow().replace(second=0, microsecond=0)
        used_codes: set = set()

        # Terminal weight: T1 & T2 = 30% each, T3 = 25%, T4 = 15%
        terminal_weights = [30, 30, 25, 15]

        vessel_objects = []
        for v_i in range(TARGET_VESSELS):
            # ETA spread over next 72 hours, clustered slightly in first 36 h
            eta_offset_h = random.triangular(0, 72, 24)
            eta = now + timedelta(hours=eta_offset_h)

            # Size – weighted toward medium/large for realism
            size = random.choices(
                ["small", "medium", "large"],
                weights=[20, 50, 30],
            )[0]

            containers_lo, containers_hi = CONTAINERS_BY_SIZE[size]
            containers = random.randint(containers_lo, containers_hi)

            # ETD = ETA + service time (roughly 1 h per 500 containers, min 4 h)
            service_hours = max(4, round(containers / 500))
            etd = eta + timedelta(hours=service_hours)

            # Priority – mostly normal, some high/urgent
            priority = random.choices(
                ["normal", "high", "urgent"],
                weights=[65, 25, 10],
            )[0]

            # Terminal – heavy on T1/T2
            terminal = random.choices(
                TERMINAL_NAMES,
                weights=terminal_weights,
            )[0]

            v = Vessel(
                port_id     = port.id,
                vessel_code = _vessel_code(used_codes),
                eta         = eta,
                etd         = etd,
                containers  = containers,
                size        = size,
                priority    = priority,
                terminal    = terminal,
                assigned_berth_id = None,
                assigned_cranes   = None,
            )
            db.add(v)
            vessel_objects.append(v)

        db.commit()

        # ── Summary ───────────────────────────────────────────────────────────
        n_ports   = db.query(Port).count()
        n_berths  = db.query(Berth).count()
        n_cranes  = db.query(Crane).count()
        n_vessels = db.query(Vessel).count()

        print("=" * 52)
        print("  portai seed complete")
        print("=" * 52)
        print(f"  Ports   : {n_ports}")
        print(f"  Berths  : {n_berths}  (2 in maintenance)")
        print(f"  Cranes  : {n_cranes}  (2 in maintenance)")
        print(f"  Vessels : {n_vessels}")
        print("-" * 52)

        # per-terminal breakdown
        from sqlalchemy import func
        rows = (
            db.query(Vessel.terminal, func.count(Vessel.id))
            .group_by(Vessel.terminal)
            .order_by(Vessel.terminal)
            .all()
        )
        print("  Vessel distribution by terminal:")
        for term, cnt in rows:
            bar = "#" * cnt
            print(f"    {term}: {cnt:3d}  {bar}")
        print("=" * 52)

        return vessel_objects

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
