"""
main.py — FastAPI application entry point
"""
from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env before anything else
load_dotenv()

from routers import simulate, ai  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="QubitEdge API",
    description="Backend API for the AI-Powered Interactive Quantum Learning Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(simulate.router, prefix="/api", tags=["Simulation"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Tutor"])


# Health
@app.get("/health", tags=["Health"], summary="Health check")
async def health() -> dict:
    """Returns server status and dependency availability."""
    try:
        import qiskit  # noqa: F401
        qiskit_ok = True
        qiskit_version = qiskit.__version__
    except ImportError:
        qiskit_ok = False
        qiskit_version = "not installed"

    try:
        import google.generativeai  # noqa: F401
        genai_ok = True
    except ImportError:
        genai_ok = False

    gemini_key_set = bool(os.getenv("GEMINI_API_KEY", ""))

    return {
        "status": "ok",
        "qiskit": {"available": qiskit_ok, "version": qiskit_version},
        "google_generativeai": {"available": genai_ok},
        "gemini_api_key_set": gemini_key_set,
        "ai_tutor_mode": "live" if (genai_ok and gemini_key_set) else "mock",
    }
