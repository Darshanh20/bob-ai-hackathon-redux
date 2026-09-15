"""
portai – FastAPI entry point
Run locally:  uvicorn app.main:app --reload --port 8000
"""

import os
from dotenv import load_dotenv

# Load .env from the backend/ directory (one level above this package)
_env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(_env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers.ports import router as ports_router

# ── Create all tables on startup ─────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(title="portai API", version="0.1.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(ports_router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}
