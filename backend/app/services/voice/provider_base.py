"""
Abstract Provider Interfaces for Multilingual Voice Assistant.
Enables pluggable Speech-to-Text (STT), Text-to-Speech (TTS),
Language Identification, and Conversational Intent reasoning.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple
from pydantic import BaseModel


class TranscriptionResult(BaseModel):
    text: str
    detected_language: str
    confidence: float
    provider_name: str
    is_fallback: bool = False
    details: Optional[Dict[str, Any]] = None


class SynthesisResult(BaseModel):
    audio_bytes: bytes
    content_type: str = "audio/mpeg"
    language_code: str
    provider_name: str
    duration_sec: Optional[float] = None
    is_fallback: bool = False
    notice: Optional[str] = None


class SpeechToTextProvider(ABC):
    """Abstract interface for Speech-to-Text providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "auto",
        mime_type: str = "audio/webm",
    ) -> TranscriptionResult:
        """Transcribes incoming audio payload into text in specified or auto-detected language."""
        pass


class TextToSpeechProvider(ABC):
    """Abstract interface for Text-to-Speech providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def synthesize(
        self,
        text: str,
        language: str = "en",
    ) -> SynthesisResult:
        """Synthesizes text into spoken audio in the requested Indian language."""
        pass


class LanguageDetector(ABC):
    """Abstract interface for Script & Audio Language Identification."""

    @abstractmethod
    def detect_text_language(self, text: str) -> Tuple[str, float]:
        """Detects language code and confidence from raw text or Indian script."""
        pass
