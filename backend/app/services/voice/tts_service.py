"""
Text-to-Speech (TTS) Provider Service for Indian Languages.
Uses gTTS (Google Text-to-Speech) for high quality native Indian pronunciation,
with graceful fallback mechanisms for languages without native voice models.
"""
import io
import logging
from typing import Dict
from gtts import gTTS

from app.services.voice.provider_base import TextToSpeechProvider, SynthesisResult
from app.services.voice.languages import get_language_metadata, INDIAN_LANGUAGES

logger = logging.getLogger("oil_spill.voice.tts")


class GoogleTTSProvider(TextToSpeechProvider):
    """Generates spoken audio for Indian languages via gTTS."""

    @property
    def name(self) -> str:
        return "GoogleTTSProvider"

    def synthesize(
        self,
        text: str,
        language: str = "en",
    ) -> SynthesisResult:
        if not text or not text.strip():
            text = "Ready."

        meta = get_language_metadata(language)
        target_gtts_code = meta.gtts_code
        is_fallback = False
        notice = None

        # Check if requested language has direct gTTS support
        if not target_gtts_code or not meta.tts_supported:
            fallback_meta = get_language_metadata(meta.fallback_tts)
            target_gtts_code = fallback_meta.gtts_code or "en"
            is_fallback = True
            notice = (
                f"Audio synthesized using {fallback_meta.name} voice fallback. "
                f"{meta.name} native voice model is in preview."
            )
            logger.info("Language %s falling back to TTS code %s", language, target_gtts_code)

        try:
            # Generate MP3 stream in memory
            tts = gTTS(text=text.strip(), lang=target_gtts_code, slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            audio_bytes = fp.read()

            return SynthesisResult(
                audio_bytes=audio_bytes,
                content_type="audio/mpeg",
                language_code=meta.code,
                provider_name=self.name,
                is_fallback=is_fallback,
                notice=notice,
            )
        except Exception as e:
            logger.error("TTS synthesis error for lang %s (%s): %s", language, target_gtts_code, e)
            # Final fallback to English
            try:
                tts = gTTS(text=text.strip(), lang="en", slow=False)
                fp = io.BytesIO()
                tts.write_to_fp(fp)
                fp.seek(0)
                return SynthesisResult(
                    audio_bytes=fp.read(),
                    content_type="audio/mpeg",
                    language_code="en",
                    provider_name=f"{self.name} (Emergency Fallback)",
                    is_fallback=True,
                    notice=f"Voice synthesis fell back to English: {str(e)}",
                )
            except Exception as final_e:
                logger.critical("Final TTS fallback failed: %s", final_e)
                return SynthesisResult(
                    audio_bytes=b"",
                    content_type="audio/mpeg",
                    language_code="en",
                    provider_name="Failed",
                    is_fallback=True,
                    notice=f"Voice synthesis temporarily unavailable: {str(final_e)}",
                )
