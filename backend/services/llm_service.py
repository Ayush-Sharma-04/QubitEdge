"""
llm_service.py
--------------
Gemini API adapter with mock fallback.
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai not installed. AI Tutor will use mock mode.")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

SYSTEM_PROMPT = """You are QubitEdge Tutor — an expert, patient, and concise quantum computing educator.
Your role is to help learners understand quantum circuits, gates, and measurement outcomes.

Guidelines:
- Keep answers clear and educational, avoiding unnecessary jargon.
- When the user provides a circuit or code, reference it specifically in your explanation.
- When explaining measurement results, use intuitive analogies (e.g., coin flips, superposition as "both at once").
- If you see a Bell state (50/50 split of |00⟩ and |11⟩), explain entanglement.
- Format responses in plain readable text. Use short paragraphs. Use bullet points only when listing multiple items.
- Never fabricate code that the user hasn't provided.
- If you cannot determine the answer from context, say so honestly.
"""


def _build_context_block(context: Optional[Dict[str, Any]]) -> str:
    """Format the workspace context into a readable block for the LLM."""
    if not context:
        return ""

    lines = ["\n--- Workspace Context ---"]
    mode = context.get("mode", "unknown")
    lines.append(f"Mode: {mode}")

    circuit = context.get("circuit")
    if circuit:
        if mode == "visual" and isinstance(circuit, dict):
            gates = circuit.get("gates", [])
            lines.append(f"Circuit gates ({len(gates)} total):")
            for g in gates[:20]:  # Limit to first 20
                ctrl = f" control={g.get('control')}" if g.get("control") is not None else ""
                lines.append(f"  Step {g.get('step', '?')}: {g.get('type')} on qubit {g.get('qubit')}{ctrl}")
            if len(gates) > 20:
                lines.append(f"  ... and {len(gates) - 20} more gates")
        elif mode == "code" and isinstance(circuit, str):
            code_preview = circuit[:1000]
            lines.append(f"User code:\n```python\n{code_preview}\n```")

    results = context.get("results")
    if results:
        probs = results.get("probabilities", {})
        if probs:
            lines.append("Simulation results (probabilities):")
            for state, prob in sorted(probs.items(), key=lambda x: -x[1])[:8]:
                bar = "█" * int(prob * 20)
                lines.append(f"  |{state}⟩: {prob:.3f}  {bar}")

    lines.append("--- End Context ---\n")
    return "\n".join(lines)


def _mock_response(message: str, context_block: str) -> str:
    """Return a helpful mock response when no API key is set."""
    has_context = bool(context_block)
    if has_context:
        return (
            "📡 AI Tutor is in demo mode (no GEMINI_API_KEY set).\n\n"
            "I can see your circuit context! Once you add a Gemini API key to the backend "
            "`.env` file, I'll be able to give you a real explanation of your results.\n\n"
            "In the meantime: if your histogram shows roughly 50% |00⟩ and 50% |11⟩, "
            "you've likely created a Bell state — a maximally entangled state where two "
            "qubits are perfectly correlated. Try removing the Hadamard gate to see a "
            "deterministic result instead!"
        )
    return (
        "📡 AI Tutor is in demo mode (no GEMINI_API_KEY set).\n\n"
        "Add your Google Gemini API key to `backend/.env` as `GEMINI_API_KEY=your_key_here` "
        "to enable real AI tutoring. You can get a free key at https://aistudio.google.com."
    )


def chat(
    message: str,
    context: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    Send a message to the Gemini LLM with workspace context injected.

    Args:
        message: The user's natural language question.
        context: Workspace context dict (mode, circuit, results).
        history: Prior conversation turns [{role, content}].

    Returns:
        The AI tutor's text response.
    """
    context_block = _build_context_block(context)
    full_message = context_block + message if context_block else message

    api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

    if not GENAI_AVAILABLE or not api_key:
        return _mock_response(message, context_block)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_PROMPT,
        )

        # Build chat history
        chat_history = []
        for turn in (history or []):
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role in ("user", "model") and content:
                chat_history.append({"role": role, "parts": [content]})

        chat_session = model.start_chat(history=chat_history)
        response = chat_session.send_message(full_message)
        return response.text

    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        return (
            f"⚠️ AI Tutor encountered an error: {exc}\n\n"
            "Please check your GEMINI_API_KEY and network connection."
        )
