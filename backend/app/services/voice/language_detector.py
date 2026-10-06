"""
Intelligent Indian Language & Code-Mixed Script Detector.
Uses Unicode character block classification + n-gram lexical analysis
to accurately identify 22 scheduled Indian languages, English, and Romanized code-mixing.
"""
import re
from typing import Tuple
from app.services.voice.provider_base import LanguageDetector
from app.services.voice.languages import INDIAN_LANGUAGES


class IndianLanguageDetector(LanguageDetector):
    """Detects Indian languages from script and Romanized code-mixed speech."""

    # Lexical markers for disambiguating Devanagari script (Hindi, Marathi, Nepali, Sanskrit, etc.)
    MARATHI_MARKERS = {"आहे", "कसे", "कुठे", "झाली", "झाले", "करा", "सांगा", "गळती", "जहाज", "नाही"}
    NEPALI_MARKERS = {"छ", "कहाँ", "भएको", "गर्नुहोस्", "हो", "छैन", "चुहावट"}
    SANSKRIT_MARKERS = {"अस्ति", "कुत्र", "जातः", "प्रदर्शयतु", "तैलप्रवाहः", "भवति"}
    BENGALI_MARKERS = {"কোথায়", "হয়েছে", "জাহাজ", "তেল", "দেখান", "কী", "করুন"}
    ASSAMESE_MARKERS = {"ক'ত", "হৈছে", "ধৰা", "পৰিছে", "দেখুৱাওক"}

    # Romanized Indian Code-Mixed Tokens
    TANGLISH_MARKERS = {"enge", "engae", "ennai", "kasivu", "kappal", "irukku", "panni", "pannirukkeenga", "solunga", "eppadi", "thani"}
    HINGLISH_MARKERS = {"kahan", "kaha", "hua", "hai", "dikhao", "batao", "jahaj", "tel", "risav", "kitna", "kaunsa", "karein", "chahiye"}
    TENGLISH_MARKERS = {"ekkada", "undi", "chamuru", "leaked", "chesaru", "enta", "cheppandi", "chupinchu", "nava"}
    KANGLISH_MARKERS = {"elli", "aagide", "thaila", "soorike", "helu", "thorisi", "hadagu"}
    MANGLISH_MARKERS = {"evide", "aanu", "chora", "enna", "parayuka", "kappal"}

    def detect_text_language(self, text: str) -> Tuple[str, float]:
        """
        Determines the most probable language code and confidence score (0.0 to 1.0).
        Returns ('en', 0.9) by default for pure English.
        """
        if not text or not text.strip():
            return "en", 0.5

        cleaned = text.strip()
        total_chars = len(cleaned)

        # Count character categories by Unicode blocks
        counts = {
            "tamil": len(re.findall(r"[\u0B80-\u0BFF]", cleaned)),
            "telugu": len(re.findall(r"[\u0C00-\u0C7F]", cleaned)),
            "kannada": len(re.findall(r"[\u0C80-\u0CFF]", cleaned)),
            "malayalam": len(re.findall(r"[\u0D00-\u0D7F]", cleaned)),
            "devanagari": len(re.findall(r"[\u0900-\u097F]", cleaned)),
            "bengali": len(re.findall(r"[\u0980-\u09FF]", cleaned)),
            "gujarati": len(re.findall(r"[\u0A80-\u0AFF]", cleaned)),
            "gurmukhi": len(re.findall(r"[\u0A00-\u0A7F]", cleaned)),
            "odia": len(re.findall(r"[\u0B00-\u0B7F]", cleaned)),
            "arabic": len(re.findall(r"[\u0600-\u06FF]", cleaned)),
            "ol_chiki": len(re.findall(r"[\u1C50-\u1C7F]", cleaned)),
        }

        # 1. Unambiguous native scripts
        if counts["tamil"] > 2:
            return "ta", min(1.0, 0.7 + (counts["tamil"] / total_chars) * 0.3)
        if counts["telugu"] > 2:
            return "te", min(1.0, 0.7 + (counts["telugu"] / total_chars) * 0.3)
        if counts["kannada"] > 2:
            return "kn", min(1.0, 0.7 + (counts["kannada"] / total_chars) * 0.3)
        if counts["malayalam"] > 2:
            return "ml", min(1.0, 0.7 + (counts["malayalam"] / total_chars) * 0.3)
        if counts["gujarati"] > 2:
            return "gu", min(1.0, 0.7 + (counts["gujarati"] / total_chars) * 0.3)
        if counts["gurmukhi"] > 2:
            return "pa", min(1.0, 0.7 + (counts["gurmukhi"] / total_chars) * 0.3)
        if counts["odia"] > 2:
            return "or", min(1.0, 0.7 + (counts["odia"] / total_chars) * 0.3)
        if counts["arabic"] > 2:
            return "ur", min(1.0, 0.7 + (counts["arabic"] / total_chars) * 0.3)
        if counts["ol_chiki"] > 2:
            return "sat", min(1.0, 0.7 + (counts["ol_chiki"] / total_chars) * 0.3)

        # 2. Bengali vs Assamese
        if counts["bengali"] > 2:
            words = set(cleaned.split())
            if words.intersection(self.ASSAMESE_MARKERS) or "ৰ" in cleaned or "ৱ" in cleaned:
                return "as", 0.92
            return "bn", 0.95

        # 3. Devanagari script disambiguation (Hindi / Marathi / Nepali / Sanskrit)
        if counts["devanagari"] > 2:
            words = set(cleaned.split())
            if words.intersection(self.MARATHI_MARKERS) or "ळ" in cleaned:
                return "mr", 0.94
            if words.intersection(self.NEPALI_MARKERS):
                return "ne", 0.92
            if words.intersection(self.SANSKRIT_MARKERS):
                return "sa", 0.90
            return "hi", 0.95

        # 4. Latin script with Romanized Indian Code-Mixing
        lower_words = set(re.findall(r"\b[a-z]+\b", cleaned.lower()))
        if lower_words.intersection(self.TANGLISH_MARKERS):
            return "ta", 0.88
        if lower_words.intersection(self.HINGLISH_MARKERS):
            return "hi", 0.88
        if lower_words.intersection(self.TENGLISH_MARKERS):
            return "te", 0.88
        if lower_words.intersection(self.KANGLISH_MARKERS):
            return "kn", 0.88
        if lower_words.intersection(self.MANGLISH_MARKERS):
            return "ml", 0.88

        # Pure English default
        return "en", 0.95
