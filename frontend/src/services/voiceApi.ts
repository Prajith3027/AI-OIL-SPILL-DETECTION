import { request } from "./http";

export interface VoiceLanguage {
  code: string;
  name: string;
  native_name: string;
  script: string;
  bcp47: string;
  stt_supported: boolean;
  tts_supported: boolean;
  text_supported: boolean;
  direction: string;
  support_note?: string | null;
  sample_queries: string[];
}

export interface VoiceCommandResult {
  transcript: string;
  detected_language: string;
  language_name: string;
  native_language_name: string;
  response_text: string;
  voice_text: string;
  audio_base64?: string | null;
  intent: string;
  badge?: string | null;
  action?: Record<string, unknown> | null;
  followups: string[];
  require_confirmation: boolean;
  is_restricted: boolean;
  support_note?: string | null;
}

export interface TranscribeResult {
  text: string;
  detected_language: string;
  language_name: string;
  native_name: string;
  confidence: number;
  provider: string;
  is_fallback: boolean;
}

export const voiceApi = {
  languages: () =>
    request<{ languages: VoiceLanguage[]; default_language: string }>("/api/voice/languages"),

  command: (message: string, language: string, sessionId: string) =>
    request<VoiceCommandResult>("/api/voice/command", {
      method: "POST",
      body: JSON.stringify({ message, language, session_id: sessionId }),
    }),

  transcribe: (audio: Blob, language: string) => {
    const fd = new FormData();
    fd.append("audio", audio, "speech.webm");
    fd.append("language", language);
    return request<TranscribeResult>("/api/voice/transcribe", { method: "POST", body: fd });
  },
};
