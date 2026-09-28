from __future__ import annotations
from typing import Dict, List, Optional, Literal, Any
from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Simulation Models
# ---------------------------------------------------------------------------

class GateOp(BaseModel):
    """Represents a single quantum gate operation in a visual circuit."""
    type: str = Field(..., description="Gate type: H, X, Y, Z, S, T, CNOT")
    qubit: int = Field(..., ge=0, le=4, description="Target qubit index (0-4)")
    control: Optional[int] = Field(None, ge=0, le=4, description="Control qubit (CNOT only)")
    step: int = Field(..., ge=0, description="Chronological column/step index")


class SimulateRequest(BaseModel):
    """Unified simulation request for both visual and code modes."""
    mode: Literal["visual", "code"] = Field(..., description="Execution mode")
    shots: int = Field(1024, ge=1, le=1024, description="Number of measurement shots")
    # Visual mode
    gates: Optional[List[GateOp]] = Field(None, description="Gate list for visual mode")
    num_qubits: Optional[int] = Field(None, ge=1, le=5, description="Number of qubits (visual mode)")
    # Code mode
    code: Optional[str] = Field(None, description="Python script for code mode")

    @field_validator("gates")
    @classmethod
    def validate_gates(cls, v: Optional[List[GateOp]]) -> Optional[List[GateOp]]:
        if v is not None and len(v) > 200:
            raise ValueError("Circuit too large: maximum 200 gate operations")
        return v

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 10_000:
            raise ValueError("Code too long: maximum 10,000 characters")
        return v


class SimulationResult(BaseModel):
    """Standardized simulation output returned to the frontend."""
    counts: Dict[str, int] = Field(..., description="Raw measurement counts per bitstring")
    probabilities: Dict[str, float] = Field(..., description="Normalised probabilities per bitstring")
    statevector: Optional[List[List[float]]] = Field(
        None, description="Statevector as list of [real, imag] pairs"
    )
    bloch_vectors: Optional[List[List[float]]] = Field(
        None, description="Per-qubit Bloch vector [x, y, z] derived from reduced density matrix"
    )
    unitary: Optional[List[List[List[float]]]] = Field(
        None, description="Circuit unitary matrix as 2D list of [real, imag] pairs"
    )
    num_qubits: int = Field(..., description="Number of qubits in the circuit")
    gate_count: int = Field(..., description="Total gates applied")
    shots: int = Field(..., description="Shots used for this simulation")


class SimulateResponse(BaseModel):
    success: bool
    result: Optional[SimulationResult] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# AI Tutor Models
# ---------------------------------------------------------------------------

class TutorContext(BaseModel):
    """Workspace context automatically injected alongside the user's message."""
    mode: Literal["visual", "code"]
    circuit: Optional[Any] = Field(None, description="Circuit JSON (visual) or code string")
    results: Optional[SimulationResult] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: Optional[TutorContext] = None
    history: Optional[List[Dict[str, str]]] = Field(
        default_factory=list,
        description="Prior messages [{role: user|assistant, content: str}]"
    )


class ChatResponse(BaseModel):
    reply: str
    success: bool = True
    error: Optional[str] = None
