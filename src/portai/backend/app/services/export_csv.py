"""
export_csv.py – Export the vessel schedule to a CSV file.

Run from the backend/ directory:
    python -m app.services.export_csv
"""

import csv
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from app.database import SessionLocal
from app.models import Vessel

OUTPUT_DIR  = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "sample_vessel_schedule.csv")

COLUMNS = [
    "Vessel ID",
    "ETA",
    "ETD",
    "Containers",
    "Size",
    "Priority",
    "Terminal",
]


def export():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    db = SessionLocal()
    try:
        vessels = db.query(Vessel).order_by(Vessel.eta).all()

        with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=COLUMNS)
            writer.writeheader()
            for v in vessels:
                writer.writerow({
                    "Vessel ID":  v.vessel_code,
                    "ETA":        v.eta.strftime("%Y-%m-%d %H:%M"),
                    "ETD":        v.etd.strftime("%Y-%m-%d %H:%M"),
                    "Containers": v.containers,
                    "Size":       v.size,
                    "Priority":   v.priority,
                    "Terminal":   v.terminal,
                })

        print(f"Exported {len(vessels)} vessels -> {os.path.abspath(OUTPUT_FILE)}")
    finally:
        db.close()


if __name__ == "__main__":
    export()
