"""
Speech-to-Text (STT) Service for Indian Languages.
Supports transcription via SpeechRecognition (Google API) with multi-language BCP-47 routing.
Provides graceful fallbacks and format conversion handling.
"""
import io
import logging
from typing import Optional
import speech_recognition as sr

from app.services.voice.provider_base import SpeechToTextProvider, TranscriptionResult
from app.services.voice.languages import get_language_metadata
from app.services.voice.language_detector import IndianLanguageDetector

logger = logging.getLogger("oil_spill.voice.stt")


class GoogleSpeechToTextProvider(SpeechToTextProvider):
    """Transcribes audio using Google Speech Recognition API with Indian language BCP-47 routing."""

    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.lang_detector = IndianLanguageDetector()

    @property
    def name(self) -> str:
        return "GoogleSpeechToTextProvider"

    def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "auto",
        mime_type: str = "audio/webm",
    ) -> TranscriptionResult:
        if not audio_bytes or len(audio_bytes) < 100:
            return TranscriptionResult(
                text="",
                detected_language="en",
                confidence=0.0,
                provider_name=self.name,
                is_fallback=True,
                details={"error": "Audio payload empty or too short."}
            )

        meta = get_language_metadata(language if language != "auto" else "en")
        target_bcp47 = meta.bcp47 if language != "auto" else "en-IN"

        # Attempt to read audio via SpeechRecognition AudioFile
        try:
            audio_io = io.BytesIO(audio_bytes)
            with sr.AudioFile(audio_io) as source:
                audio_data = self.recognizer.record(source)

            # Try requested language
            transcript = self.recognizer.recognize_google(audio_data, language=target_bcp47)
            det_lang, conf = self.lang_detector.detect_text_language(transcript)

            return TranscriptionResult(
                text=transcript,
                detected_language=det_lang if language == "auto" else meta.code,
                confidence=conf,
                provider_name=self.name,
                is_fallback=False,
                details={"bcp47_used": target_bcp47}
            )
        except sr.UnknownValueError:
            logger.warning("Google Speech Recognition could not understand audio")
            return TranscriptionResult(
                text="",
                detected_language=meta.code,
                confidence=0.0,
                provider_name=self.name,
                is_fallback=True,
                details={"error": "No clear speech detected. Please speak closer to microphone."}
            )
        except sr.RequestError as e:
            logger.error("Could not request results from Google Speech service: %s", e)
            return TranscriptionResult(
                text="",
                detected_language=meta.code,
                confidence=0.0,
                provider_name=self.name,
                is_fallback=True,
                details={"error": f"Speech recognition service error: {str(e)}"}
            )
        except Exception as general_e:
            logger.warning("Audio decoding note: %s", general_e)
            return TranscriptionResult(
                text="",
                detected_language=meta.code,
                confidence=0.0,
                provider_name=self.name,
                is_fallback=True,
                details={"error": f"Audio format processing notice: {str(general_e)}"}
            )
