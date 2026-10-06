"""
Indian Languages Configuration & Capability Matrix.
Supports the 22 scheduled official languages of India + English + Auto-Detection.
Provides precise metadata, script detection, BCP-47 speech tags, and capability mapping.
"""
from typing import Dict, List, Optional
from pydantic import BaseModel


class LanguageMetadata(BaseModel):
    code: str
    name: str
    native_name: str
    script: str
    bcp47: str
    gtts_code: Optional[str] = None
    stt_supported: bool = True
    tts_supported: bool = True
    text_supported: bool = True
    fallback_tts: str = "en"
    direction: str = "ltr"
    sample_queries: List[str] = []
    support_note: Optional[str] = None


# Comprehensive registry of 22 Scheduled Indian Languages + English
INDIAN_LANGUAGES: Dict[str, LanguageMetadata] = {
    "auto": LanguageMetadata(
        code="auto",
        name="Auto Detect Language",
        native_name="தானியங்கு / स्वतः पहचान",
        script="Multi",
        bcp47="en-IN",
        gtts_code=None,
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        fallback_tts="en",
        sample_queries=["Where is the oil spill?", "எண்ணெய் கசிவு எங்கே உள்ளது?"],
        support_note="Automatically detects spoken language or input script."
    ),
    "en": LanguageMetadata(
        code="en",
        name="English",
        native_name="English (India)",
        script="Latin",
        bcp47="en-IN",
        gtts_code="en",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "Where is the latest oil spill?",
            "Show candidate vessels",
            "What is the severity of the spill?",
            "Report an oil spill"
        ]
    ),
    "hi": LanguageMetadata(
        code="hi",
        name="Hindi",
        native_name="हिन्दी",
        script="Devanagari",
        bcp47="hi-IN",
        gtts_code="hi",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "तेल का रिसाव कहाँ हुआ है?",
            "सक्रिय तेल रिसाव दिखाएं",
            "जिम्मेदार जहाज की जांच करें",
            "आपातकालीन अलर्ट क्या हैं?"
        ]
    ),
    "ta": LanguageMetadata(
        code="ta",
        name="Tamil",
        native_name="தமிழ்",
        script="Tamil",
        bcp47="ta-IN",
        gtts_code="ta",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "எண்ணெய் கசிவு எங்கே கண்டறியப்பட்டது?",
            "சந்தேகத்திற்குரிய கப்பல்கள் எவை?",
            "எண்ணெய் கசிவு பரப்பளவு என்ன?",
            "எண்ணெய் கசிவை பதிவு செய்க"
        ]
    ),
    "te": LanguageMetadata(
        code="te",
        name="Telugu",
        native_name="తెలుగు",
        script="Telugu",
        bcp47="te-IN",
        gtts_code="te",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "చమురు లీకేజీ ఎక్కడ జరిగింది?",
            "అనుమానిత నౌకలు ఏవి?",
            "ప్రస్తుత హెచ్చరికలు ఏమిటి?",
            "చమురు విస్తీర్ణం ఎంత?"
        ]
    ),
    "kn": LanguageMetadata(
        code="kn",
        name="Kannada",
        native_name="ಕನ್ನಡ",
        script="Kannada",
        bcp47="kn-IN",
        gtts_code="kn",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "ತೈಲ ಸೋರಿಕೆ ಎಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ?",
            "ಸಂಶಯಾಸ್ಪದ ಹಡಗುಗಳು ಯಾವುವು?",
            "ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳನ್ನು ತೋರಿಸಿ",
            "ತೈಲ ಸೋರಿಕೆಯನ್ನು ವರದಿ ಮಾಡಿ"
        ]
    ),
    "ml": LanguageMetadata(
        code="ml",
        name="Malayalam",
        native_name="മലയാളം",
        script="Malayalam",
        bcp47="ml-IN",
        gtts_code="ml",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "എണ്ണ ചോർച്ച എവിടെയാണ് കണ്ടെത്തിയത്?",
            "സംശയമുള്ള കപ്പലുകൾ ഏവ?",
            "തീരദേശ സുരക്ഷാ മുന്നറിയിപ്പുകൾ എന്തൊക്കെയാണ്?",
            "എണ്ണ ചോർച്ച റിപ്പോർട്ട് ചെയ്യുക"
        ]
    ),
    "mr": LanguageMetadata(
        code="mr",
        name="Marathi",
        native_name="मराठी",
        script="Devanagari",
        bcp47="mr-IN",
        gtts_code="mr",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "तेल गळती कुठे झाली आहे?",
            "संशयित जहाजांची यादी दाखवा",
            "सध्याचे आपत्कालीन इशारे काय आहेत?",
            "तेल गळतीची तक्रार नोंदवा"
        ]
    ),
    "gu": LanguageMetadata(
        code="gu",
        name="Gujarati",
        native_name="ગુજરાતી",
        script="Gujarati",
        bcp47="gu-IN",
        gtts_code="gu",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "ઓઇલ સ્પીલ ક્યાં થયો છે?",
            "શંકાસ્પદ જહાજોની યાદી બતાવો",
            "કટોકટી ચેતવણીઓ શું છે?",
            "ઓઇલ સ્પીલની જાણ કરો"
        ]
    ),
    "bn": LanguageMetadata(
        code="bn",
        name="Bengali",
        native_name="বাংলা",
        script="Bengali",
        bcp47="bn-IN",
        gtts_code="bn",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "তেল নিঃসরণ কোথায় সনাক্ত করা হয়েছে?",
            "সন্দেহভাজন জাহাজগুলি কী কী?",
            "সক্রিয় জরুরি সতর্কতা দেখান",
            "তেল ছড়িয়ে পড়ার রিপোর্ট করুন"
        ]
    ),
    "pa": LanguageMetadata(
        code="pa",
        name="Punjabi",
        native_name="ਪੰਜਾਬੀ",
        script="Gurmukhi",
        bcp47="pa-IN",
        gtts_code=None,  # gTTS pa has limited voice coverage; falls back gracefully
        stt_supported=True,
        tts_supported=False,
        text_supported=True,
        fallback_tts="hi",
        support_note="Punjabi voice input is supported; audio response speaks in standard Hindi voice fallback or text.",
        sample_queries=[
            "ਤੇਲ ਦਾ ਰਿਸਾਅ ਕਿੱਥੇ ਹੋਇਆ ਹੈ?",
            "ਸ਼ੱਕੀ ਜਹਾਜ਼ ਕਿਹੜੇ ਹਨ?",
            "ਐਮਰਜੈਂਸੀ ਅਲਰਟ ਦਿਖਾਓ"
        ]
    ),
    "or": LanguageMetadata(
        code="or",
        name="Odia",
        native_name="ଓଡ଼ିଆ",
        script="Odia",
        bcp47="or-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="hi",
        support_note="Odia text chat fully supported; voice recognition in experimental mode.",
        sample_queries=[
            "ତେଲ ଲିକେଜ୍ କେଉଁଠାରେ ହୋଇଛି?",
            "ଜରୁରୀକାଳୀନ ସତର୍କତା ଦେଖାନ୍ତୁ"
        ]
    ),
    "as": LanguageMetadata(
        code="as",
        name="Assamese",
        native_name="অসমীয়া",
        script="Bengali-Assamese",
        bcp47="as-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="bn",
        support_note="Assamese text chat fully supported; voice synthesis in experimental mode.",
        sample_queries=[
            "তেল নিগৰণ ক'ত ধৰা পৰিছে?",
            "জৰুৰীকালীন সতৰ্কবাণীসমূহ দেখুৱাওক"
        ]
    ),
    "ur": LanguageMetadata(
        code="ur",
        name="Urdu",
        native_name="اردو",
        script="Arabic-Urdu",
        bcp47="ur-IN",
        gtts_code="ur",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        direction="rtl",
        sample_queries=[
            "تیل کا اخراج کہاں ہوا ہے؟",
            "مشکوک جہازوں کی تفصیل دکھائیں",
            "ہنگامی الرٹ کیا ہیں؟"
        ]
    ),
    "kok": LanguageMetadata(
        code="kok",
        name="Konkani",
        native_name="कोंकणी",
        script="Devanagari",
        bcp47="kok-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="mr",
        support_note="Konkani text interaction supported; falls back to Marathi voice.",
        sample_queries=[
            "तेल गळती खंय जाल्या?",
            "आणीबाणीचे शिटकावणी दाखय"
        ]
    ),
    "ne": LanguageMetadata(
        code="ne",
        name="Nepali",
        native_name="नेपाली",
        script="Devanagari",
        bcp47="ne-NP",
        gtts_code="ne",
        stt_supported=True,
        tts_supported=True,
        text_supported=True,
        sample_queries=[
            "तेल चुहावट कहाँ भएको छ?",
            "आपतकालीन सतर्कता देखाउनुहोस्"
        ]
    ),
    "mni": LanguageMetadata(
        code="mni",
        name="Manipuri (Meitei)",
        native_name="মৈতৈলোন্",
        script="Bengali-Meitei",
        bcp47="mni-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="en",
        support_note="Manipuri text interaction active; voice recognition in experimental phase.",
        sample_queries=[
            "থাও কায়বা কদাইদা থোকখি?",
            "অকুপ্পা চেকশিনৱা ফোঙদোকউ"
        ]
    ),
    "mai": LanguageMetadata(
        code="mai",
        name="Maithili",
        native_name="मैथिली",
        script="Devanagari",
        bcp47="mai-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="hi",
        support_note="Maithili text interaction active; voice fallback to Hindi.",
        sample_queries=[
            "तेल रिसाव कतय भेल अछि?",
            "आपातकालीन अलर्ट देखाउ"
        ]
    ),
    "sa": LanguageMetadata(
        code="sa",
        name="Sanskrit",
        native_name="संस्कृतम्",
        script="Devanagari",
        bcp47="sa-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="hi",
        support_note="Sanskrit textual reasoning supported.",
        sample_queries=[
            "तैलप्रवाहः कुत्र जातः?",
            "आपत्कालीनसूचनाः प्रदर्शयतु"
        ]
    ),
    "brx": LanguageMetadata(
        code="brx",
        name="Bodo",
        native_name="बर'",
        script="Devanagari",
        bcp47="brx-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="hi",
        support_note="Bodo text interaction supported.",
        sample_queries=["थौ गुबुन जायगायाव सोरजिदों नामा?"]
    ),
    "doi": LanguageMetadata(
        code="doi",
        name="Dogri",
        native_name="डोगरी",
        script="Devanagari",
        bcp47="doi-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="hi",
        support_note="Dogri text interaction supported; falls back to Hindi voice.",
        sample_queries=["तेल दा रिसाव कुत्थे होआ ऐ?"]
    ),
    "sat": LanguageMetadata(
        code="sat",
        name="Santali",
        native_name="ᱥᱟᱱᱛᱟᱲᱤ",
        script="Ol Chiki",
        bcp47="sat-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        fallback_tts="en",
        support_note="Santali text interaction supported with Ol Chiki / Latin script.",
        sample_queries=["ᱥᱩᱱᱩᱢ ᱚᱠᱟᱨᱮ ᱞᱤᱸᱜᱤᱱ ᱠᱟᱱᱟ?"]
    ),
    "ks": LanguageMetadata(
        code="ks",
        name="Kashmiri",
        native_name="कॉशुर / کٲشُر",
        script="Arabic-Kashmiri",
        bcp47="ks-IN",
        gtts_code=None,
        stt_supported=False,
        tts_supported=False,
        text_supported=True,
        direction="rtl",
        fallback_tts="ur",
        support_note="Kashmiri text interaction supported; falls back to Urdu voice.",
        sample_queries=["تیل کتیہٕ پیو؟"]
    ),
}


def get_language_metadata(code: str) -> LanguageMetadata:
    """Returns metadata for code, defaulting to English if unknown."""
    norm = code.lower().strip()
    if norm in INDIAN_LANGUAGES:
        return INDIAN_LANGUAGES[norm]
    # Check if code is a BCP-47 tag like 'ta-IN'
    for k, meta in INDIAN_LANGUAGES.items():
        if meta.bcp47.lower() == norm or norm.startswith(k):
            return meta
    return INDIAN_LANGUAGES["en"]


def list_available_languages() -> List[Dict]:
    """Returns serializable list of all supported languages with capabilities."""
    return [
        {
            "code": meta.code,
            "name": meta.name,
            "native_name": meta.native_name,
            "script": meta.script,
            "bcp47": meta.bcp47,
            "stt_supported": meta.stt_supported,
            "tts_supported": meta.tts_supported,
            "text_supported": meta.text_supported,
            "direction": meta.direction,
            "support_note": meta.support_note,
            "sample_queries": meta.sample_queries,
        }
        for meta in INDIAN_LANGUAGES.values()
    ]
