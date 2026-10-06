import React from "react";
import { Ship } from "lucide-react";

interface MarineLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export const MarineLoader: React.FC<MarineLoaderProps> = ({
  text = "Synchronizing Maritime Surveillance Stream...",
  size = "md",
}) => {
  const containerDimensions = size === "sm" ? "w-16 h-16" : size === "lg" ? "w-36 h-36" : "w-24 h-24";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4 select-none">
      <div className={`relative ${containerDimensions} flex items-center justify-center`}>
        {/* Outer Range Ring */}
        <div className="absolute inset-0 rounded-full border border-[#00f3ff]/30" />
        
        {/* Middle Pulse Ring */}
        <div className="absolute inset-2 rounded-full border border-[#00f3ff]/20 animate-ping opacity-30" />
        
        {/* Inner Range Ring with crosshairs */}
        <div className="absolute inset-4 rounded-full border border-dashed border-[#00f3ff]/40" />
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#00f3ff]/20 -translate-y-1/2" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#00f3ff]/20 -translate-x-1/2" />

        {/* Rotating Radar Sweep Beam */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none animate-spin"
          style={{
            animationDuration: "3s",
            background:
              "conic-gradient(from 0deg, rgba(0, 243, 255, 0.45) 0deg, rgba(0, 243, 255, 0.15) 35deg, transparent 75deg)",
          }}
        />

        {/* Center AIS Vessel Marker with Ping */}
        <div className="relative z-10 w-9 h-9 rounded-full bg-[#00172d] border border-[#00f3ff] flex items-center justify-center text-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.6)]">
          <Ship className={iconSize} />
          {/* Signal wave pulses */}
          <span className="absolute -inset-1 rounded-full border border-[#00f3ff]/60 animate-ping opacity-40" />
        </div>
      </div>

      {text && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-mono font-bold tracking-widest text-[#00f3ff] uppercase drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]">
            {text}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087F68] animate-pulse" />
            <span>RADAR SWEEP ACTIVE • AIS CH-87B</span>
          </div>
        </div>
      )}
    </div>
  );
};
