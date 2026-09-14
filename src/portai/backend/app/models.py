"""
portai – SQLAlchemy ORM models
"""

import json
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .database import Base


# ── Enums stored as strings ───────────────────────────────────────────────────
VESSEL_SIZES   = ("small", "medium", "large")
VESSEL_PRIOS   = ("normal", "high", "urgent")
ASSET_STATUSES = ("available", "maintenance", "occupied")


class Port(Base):
    __tablename__ = "ports"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String,  nullable=False, unique=True)
    terminals     = Column(Integer, nullable=False)
    berths        = Column(Integer, nullable=False)
    cranes        = Column(Integer, nullable=False)
    yard_capacity = Column(Integer, nullable=False)

    # relationships
    berth_records  = relationship("Berth",  back_populates="port", cascade="all, delete-orphan")
    crane_records  = relationship("Crane",  back_populates="port", cascade="all, delete-orphan")
    vessel_records = relationship("Vessel", back_populates="port", cascade="all, delete-orphan")


class Berth(Base):
    __tablename__ = "berths"

    id               = Column(Integer, primary_key=True, index=True)
    port_id          = Column(Integer, ForeignKey("ports.id"), nullable=False, index=True)
    berth_code       = Column(String,  nullable=False, unique=True)
    terminal         = Column(String,  nullable=False)
    max_vessel_size  = Column(String,  nullable=False)   # small | medium | large
    status           = Column(String,  nullable=False, default="available")  # available | maintenance | occupied
    capacity_teu     = Column(Integer, nullable=False)

    port    = relationship("Port", back_populates="berth_records")
    vessels = relationship("Vessel", back_populates="assigned_berth_rel",
                           foreign_keys="Vessel.assigned_berth_id")


class Crane(Base):
    __tablename__ = "cranes"

    id                    = Column(Integer, primary_key=True, index=True)
    port_id               = Column(Integer, ForeignKey("ports.id"), nullable=False, index=True)
    crane_code            = Column(String,  nullable=False, unique=True)
    terminal              = Column(String,  nullable=False)
    capacity_moves_per_hour = Column(Integer, nullable=False)
    status                = Column(String,  nullable=False, default="available")  # available | maintenance | occupied

    port = relationship("Port", back_populates="crane_records")


class Vessel(Base):
    __tablename__ = "vessels"

    id                = Column(Integer, primary_key=True, index=True)
    port_id           = Column(Integer, ForeignKey("ports.id"), nullable=False, index=True)
    vessel_code       = Column(String,  nullable=False, unique=True)
    eta               = Column(DateTime, nullable=False)
    etd               = Column(DateTime, nullable=False)
    containers        = Column(Integer,  nullable=False)
    size              = Column(String,   nullable=False)   # small | medium | large
    priority          = Column(String,   nullable=False, default="normal")  # normal | high | urgent
    terminal          = Column(String,   nullable=False)
    assigned_berth_id = Column(Integer, ForeignKey("berths.id"), nullable=True)
    # JSON list of crane_codes, e.g. '["CRN-T1-01","CRN-T1-02"]'
    assigned_cranes   = Column(Text, nullable=True)

    port               = relationship("Port",  back_populates="vessel_records")
    assigned_berth_rel = relationship("Berth", back_populates="vessels",
                                      foreign_keys=[assigned_berth_id])

    # ── helpers ───────────────────────────────────────────────────────────────
    def get_assigned_cranes(self) -> list:
        if self.assigned_cranes:
            return json.loads(self.assigned_cranes)
        return []

    def set_assigned_cranes(self, crane_list: list):
        self.assigned_cranes = json.dumps(crane_list)
