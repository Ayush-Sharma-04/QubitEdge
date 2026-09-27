"""
ai.py — /api/ai router
"""
from __future__ import annotations

import logging
from fastapi import APIRouter

from models import ChatRequest, ChatResponse
from services import llm_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse, summary="Chat with the AI quantum tutor")
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a message to the AI tutor with optional workspace context.

    The context (active circuit + simulation results) is automatically
    injected into the LLM prompt to enable contextual, targeted responses.
    """
    try:
        context_dict = request.context.model_dump() if request.context else None
        reply = llm_service.chat(
            message=request.message,
            context=context_dict,
            history=request.history or [],
        )
        return ChatResponse(reply=reply, success=True)

    except Exception as exc:
        logger.exception("AI chat error")
        return ChatResponse(
            reply="",
            success=False,
            error=f"AI service error: {exc}",
        )
