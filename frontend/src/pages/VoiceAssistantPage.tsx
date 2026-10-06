import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Languages, ShieldAlert, Send, Bot, User as UserIcon, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { VoiceOrb, type OrbState } from "../components/voice/VoiceOrb";
import { voiceApi, type VoiceLanguage, type VoiceCommandResult } from "../services/voiceApi";

interface Turn {
  id: number;
  role: "user" | "assistant";
  text: string;
  lang?: string;
  badge?: string | null;
  restricted?: boolean;
  followups?: string[];
  note?: string | null;
}

const FALLBACK_LANGS: VoiceLanguage[] = [
  { code: "auto", name: "Auto-Detect", native_name: "Auto", script: "", bcp47: "en-IN", stt_supported: true, tts_supported: true, text_supported: true, direction: "ltr", sample_queries: [] },
  { code: "en", name: "English", native_name: "English", script: "Latin", bcp47: "en-IN", stt_supported: true, tts_supported: true, text_supported: true, direction: "ltr", sample_queries: [] },
];

const VoiceAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [languages, setLanguages] = useState<VoiceLanguage[]>(FALLBACK_LANGS);
  const [language, setLanguage] = useState("auto");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [orb, setOrb] = useState<OrbState>("idle");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef(`voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const idRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    voiceApi.languages().then((r) => setLanguages(r.languages)).catch(() => undefined);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);
  useEffect(() => () => stopAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const current = useMemo(() => languages.find((l) => l.code === language) ?? languages[0], [languages, language]);

  const quickCommands = useMemo(() => {
    const own = current?.sample_queries?.slice(0, 3) ?? [];
    const base = isAdmin
      ? ["Which vessel is most likely responsible?", "Show the latest oil spill incidents", "Forecast the spill drift"]
      : ["Is there an oil spill near me?", "How do I report an oil spill?", "What safety precautions should I take?"];
    return [...own, ...base].slice(0, 6);
  }, [current, isAdmin]);

  const stopAll = () => {
    cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    audioElRef.current?.pause();
    window.speechSynthesis?.cancel();
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  };

  const speak = useCallback((res: VoiceCommandResult) => {
    setOrb("speaking");
    const done = () => setOrb("idle");
    if (res.audio_base64) {
      const a = new Audio(`data:audio/mpeg;base64,${res.audio_base64}`);
      audioElRef.current = a;
      a.onended = done;
      a.onerror = done;
      a.play().catch(done);
      return;
    }
    if ("speechSynthesis" in window) {
      const meta = languages.find((l) => l.code === res.detected_language);
      const u = new SpeechSynthesisUtterance(res.voice_text);
      u.lang = meta?.bcp47 ?? "en-IN";
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
    } else done();
  }, [languages]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg) return;
      setError(null);
      setTurns((t) => [...t, { id: ++idRef.current, role: "user", text: msg }]);
      setOrb("processing");
      try {
        const res = await voiceApi.command(msg, language, sessionId.current);
        setTurns((t) => [
          ...t,
          {
            id: ++idRef.current,
            role: "assistant",
            text: res.response_text,
            lang: res.native_language_name,
            badge: res.badge,
            restricted: res.is_restricted,
            followups: res.followups,
            note: res.support_note,
          },
        ]);
        speak(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Voice service unavailable. You can continue by typing.");
        setOrb("idle");
      }
    },
    [language, speak]
  );

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Microphone is not available in this browser. Please type your question instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(1, peak / 64));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(rafRef.current);
        setLevel(0);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setOrb("processing");
        try {
          const tr = await voiceApi.transcribe(blob, language);
          if (!tr.text?.trim()) {
            setError("Couldn't understand the audio. Please try again or type your question.");
            setOrb("idle");
            return;
          }
          await send(tr.text);
        } catch {
          setError("Speech recognition is unavailable right now. Please type your question.");
          setOrb("idle");
        }
      };
      recorderRef.current = rec;
      rec.start();
      setOrb("listening");
    } catch {
      setError("Microphone permission denied. Please allow access or type your question.");
      setOrb("idle");
    }
  };

  const onOrb = () => {
    if (orb === "listening") recorderRef.current?.stop();
    else if (orb === "speaking") {
      audioElRef.current?.pause();
      window.speechSynthesis?.cancel();
      setOrb("idle");
    } else if (orb === "idle") void startRecording();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#17324D] dark:text-white">Multilingual Voice Assistant</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Speak or type in any of 22 Indian languages · {isAdmin ? "Admin: full investigative access" : "Citizen: public information"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#0066b2] dark:text-[#00f3ff]" />
          <select
            id="voice-language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs font-semibold rounded-lg px-3 py-2 bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] text-[#17324D] dark:text-white"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} {l.native_name !== l.name ? `· ${l.native_name}` : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      {current?.support_note && (
        <div className="text-[11px] px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 text-amber-800 dark:text-amber-300">
          {current.support_note}
        </div>
      )}

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <section className="rounded-2xl p-5 bg-gradient-to-b from-[#06223b] to-[#0a3a5f] border border-[#1a3854] flex flex-col items-center justify-center gap-4 text-white">
          <VoiceOrb state={orb} level={level} onClick={onOrb} />
          <div className="flex flex-wrap gap-1.5 justify-center">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${current?.stt_supported ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/30 text-slate-300"}`}>
              Speech in {current?.stt_supported ? "✓" : "text only"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${current?.tts_supported ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/30 text-slate-300"}`}>
              Voice out {current?.tts_supported ? "✓" : "text only"}
            </span>
          </div>
          <p className="text-[10px] text-center text-slate-300 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Role: {user?.role ?? "guest"} · RBAC enforced server-side
          </p>
        </section>

        <section className="rounded-2xl bg-white dark:bg-[#0c1f33] border border-[#D9E8F2] dark:border-[#1a3854] flex flex-col h-[520px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
            {turns.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-16">
                Tap the orb and speak, or choose a command below.
              </p>
            )}
            {turns.map((t) => (
              <div key={t.id} className={`flex gap-2 ${t.role === "user" ? "justify-end" : ""}`}>
                {t.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[#0066b2] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    t.role === "user"
                      ? "bg-[#0066b2] text-white"
                      : t.restricted
                      ? "bg-red-50 dark:bg-red-950/30 border border-red-300/50 text-red-800 dark:text-red-200"
                      : "bg-[#F0F7FC] dark:bg-[#0e2740] text-[#17324D] dark:text-slate-100"
                  }`}
                >
                  {t.restricted && (
                    <div className="flex items-center gap-1 font-bold mb-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Restricted
                    </div>
                  )}
                  {t.badge && !t.restricted && (
                    <span className="inline-block mb-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0066b2]/15 text-[#0066b2] dark:text-[#00f3ff]">
                      {t.badge}
                    </span>
                  )}
                  <div>{t.text}</div>
                  {t.note && <div className="mt-1 text-[10px] opacity-70">{t.note}</div>}
                  {t.followups && t.followups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {t.followups.map((f) => (
                        <button key={f} onClick={() => void send(f)} className="text-[10px] px-2 py-1 rounded-full border border-[#0066b2]/40 text-[#0066b2] dark:text-[#00f3ff] hover:bg-[#0066b2]/10">
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {t.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {error && <div className="mx-4 mb-2 text-[11px] px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">{error}</div>}

          <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
            {quickCommands.map((q) => (
              <button key={q} onClick={() => void send(q)} className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-[#EAF6FF] dark:bg-[#12385c] text-[#0066b2] dark:text-[#00f3ff] font-semibold hover:opacity-80">
                {q}
              </button>
            ))}
          </div>

          <form
            className="p-3 border-t border-[#D9E8F2] dark:border-[#1a3854] flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = input;
              setInput("");
              void send(v);
            }}
          >
            <input
              id="voice-text-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type in any language…"
              dir={current?.direction === "rtl" ? "rtl" : "ltr"}
              className="flex-1 text-xs rounded-xl px-3 py-2.5 bg-[#F4F9FD] dark:bg-[#071521] border border-[#D9E8F2] dark:border-[#1a3854] text-[#17324D] dark:text-white outline-none focus:border-[#0066b2]"
            />
            <button type="submit" id="voice-send-button" className="px-3 rounded-xl bg-[#0066b2] text-white hover:bg-[#005a9e]" aria-label="Send">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default VoiceAssistantPage;
