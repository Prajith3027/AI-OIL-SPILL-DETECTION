import React from "react";
import { Mic, Square, Loader2, Volume2 } from "lucide-react";

export type OrbState = "idle" | "listening" | "processing" | "speaking";

interface Props {
  state: OrbState;
  level: number; // 0..1 microphone level
  onClick: () => void;
  disabled?: boolean;
}

const LABEL: Record<OrbState, string> = {
  idle: "Tap to speak",
  listening: "Listening… tap to stop",
  processing: "Analysing…",
  speaking: "Speaking… tap to stop",
};

export const VoiceOrb: React.FC<Props> = ({ state, level, onClick, disabled }) => {
  const scale = 1 + (state === "listening" ? level * 0.35 : 0);
  const color =
    state === "listening" ? "#ef4444" : state === "speaking" ? "#10b981" : state === "processing" ? "#f59e0b" : "#0066b2";
  const Icon = state === "listening" ? Square : state === "processing" ? Loader2 : state === "speaking" ? Volume2 : Mic;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {(state === "listening" || state === "speaking") &&
          [0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: color, opacity: 0.12, animationDuration: `${1.6 + i * 0.5}s`, animationDelay: `${i * 0.3}s` }}
            />
          ))}
        <span
          className="absolute inset-3 rounded-full blur-xl transition-all duration-150"
          style={{ background: color, opacity: 0.35, transform: `scale(${scale})` }}
        />
        <button
          id="voice-orb-button"
          type="button"
          onClick={onClick}
          disabled={disabled || state === "processing"}
          aria-label={LABEL[state]}
          className="relative w-28 h-28 rounded-full text-white flex items-center justify-center shadow-2xl transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-60"
          style={{
            transform: `scale(${scale})`,
            background: `radial-gradient(circle at 30% 25%, ${color}ee, ${color} 55%, #021a30)`,
            boxShadow: `0 0 40px ${color}88`,
          }}
        >
          <Icon className={`w-10 h-10 ${state === "processing" ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">{LABEL[state]}</p>
    </div>
  );
};
