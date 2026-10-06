"""
FastAPI Routes for Multilingual Indian Voice Assistant.
Endpoints:
  GET  /api/voice/languages   → Capability matrix of 22 Indian languages + English
  POST /api/voice/transcribe  → Speech-to-text audio upload
  POST /api/voice/synthesize  → Text-to-speech MP3 stream
  POST /api/voice/command     → Full voice & text pipeline (STT → Intent → RBAC → Response → TTS)
"""
import base64
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.auth import get_current_user_optional
from app.models.user import User
from app.services.voice.languages import list_available_languages, get_language_metadata
from app.services.voice.stt_service import GoogleSpeechToTextProvider
from app.services.voice.tts_service import GoogleTTSProvider
from app.services.voice.intent_engine import MultilingualIntentEngine

logger = logging.getLogger("oil_spill.voice.routes")

router = APIRouter(prefix="/voice", tags=["Multilingual Voice Assistant"])

# Instantiate singletons
_stt_provider = GoogleSpeechToTextProvider()
_tts_provider = GoogleTTSProvider()
_intent_engine = MultilingualIntentEngine()


class VoiceCommandRequest(BaseModel):
    message: Optional[str] = Field(None, description="Direct text input or transcribed speech")
    language: str = Field("auto", description="Selected Indian language code or 'auto'")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
    incident_id: Optional[str] = Field(None, description="Optional incident anchor")


class VoiceCommandResponse(BaseModel):
    transcript: str
    detected_language: str
    language_name: str
    native_language_name: str
    response_text: str
    voice_text: str
    audio_base64: Optional[str] = None
    audio_url: Optional[str] = None
    intent: str
    badge: Optional[str] = None
    action: Optional[Dict[str, Any]] = None
    followups: List[str] = []
    require_confirmation: bool = False
    is_restricted: bool = False
    support_note: Optional[str] = None


class SynthesisRequest(BaseModel):
    text: str = Field(..., max_length=2000)
    language: str = Field("en", description="Target language code (e.g. 'ta', 'hi', 'te')")


@router.get("/languages", summary="List supported Indian languages and speech capabilities")
def get_languages():
    """Returns metadata for all 22 official Indian languages + English + Auto-Detect."""
    return {
        "total_languages": 23,
        "languages": list_available_languages(),
        "default_language": "auto",
    }


@router.post("/transcribe", summary="Transcribe speech audio into text")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("auto"),
):
    """Converts uploaded speech audio to text using configured Indian speech provider."""
    content = await audio.read()
    res = _stt_provider.transcribe(
        audio_bytes=content,
        language=language,
        mime_type=audio.content_type or "audio/webm",
    )
    meta = get_language_metadata(res.detected_language)
    return {
        "text": res.text,
        "detected_language": res.detected_language,
        "language_name": meta.name,
        "native_name": meta.native_name,
        "confidence": res.confidence,
        "provider": res.provider_name,
        "is_fallback": res.is_fallback,
        "details": res.details,
    }


@router.post("/synthesize", summary="Synthesize speech audio from text")
def synthesize_speech(payload: SynthesisRequest):
    """Generates streaming MP3 audio in requested Indian language."""
    res = _tts_provider.synthesize(text=payload.text, language=payload.language)
    headers = {
        "Content-Disposition": f"inline; filename=speech_{payload.language}.mp3",
        "X-Language-Code": res.language_code,
        "X-Provider-Name": res.provider_name,
    }
    if res.notice:
        headers["X-Language-Notice"] = res.notice
    return Response(content=res.audio_bytes, media_type="audio/mpeg", headers=headers)


@router.post("/command", response_model=VoiceCommandResponse, summary="Process voice or text query through full pipeline")
async def process_voice_command(
    payload: VoiceCommandRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Complete Voice Assistant Pipeline:
    Text/Speech → Language Detection → Intent Engine (RBAC) → Multilingual Phrasing → TTS Audio Generation.
    """
    user_query = (payload.message or "").strip()
    if not user_query:
        user_query = "Hello, what is the status of the oil spill?"

    session_id = payload.session_id or (current_user.id if current_user else "anonymous-session")

    # Run intent reasoning with RBAC enforcement
    result = _intent_engine.process_query(
        query_text=user_query,
        user=current_user,
        db=db,
        language=payload.language,
        session_id=session_id,
    )

    resolved_lang = payload.language if payload.language != "auto" else _intent_engine.detector.detect_text_language(user_query)[0]
    meta = get_language_metadata(resolved_lang)

    # Synthesize audio for the spoken response
    tts_result = _tts_provider.synthesize(text=result["voice_text"], language=meta.code)
    audio_b64 = None
    if tts_result.audio_bytes:
        audio_b64 = base64.b64encode(tts_result.audio_bytes).decode("utf-8")

    return VoiceCommandResponse(
        transcript=user_query,
        detected_language=meta.code,
        language_name=meta.name,
        native_language_name=meta.native_name,
        response_text=result["text"],
        voice_text=result["voice_text"],
        audio_base64=audio_b64,
        audio_url=f"/api/voice/synthesize?lang={meta.code}",
        intent=result["intent"],
        badge=result.get("badge"),
        action=result.get("action"),
        followups=result.get("followups", []),
        require_confirmation=result.get("require_confirmation", False),
        is_restricted=result.get("is_restricted", False),
        support_note=meta.support_note or tts_result.notice,
    )
