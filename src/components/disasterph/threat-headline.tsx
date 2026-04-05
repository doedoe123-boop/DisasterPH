"use client";

import { type ThreatHeadline, type ThreatLevel } from "@/lib/threat-headline";

const levelBg: Record<ThreatLevel, string> = {
  safe: "bg-emerald-950/60 border-emerald-700/40",
  watch: "bg-amber-950/50 border-amber-700/40",
  warning: "bg-orange-950/50 border-orange-600/40",
  danger: "bg-red-950/60 border-red-600/50",
};

const levelAccent: Record<ThreatLevel, string> = {
  safe: "text-emerald-400",
  watch: "text-amber-400",
  warning: "text-orange-400",
  danger: "text-red-400",
};

const levelDot: Record<ThreatLevel, string> = {
  safe: "bg-emerald-500",
  watch: "bg-amber-500",
  warning: "bg-orange-500",
  danger: "bg-red-500",
};

interface ThreatHeadlineBarProps {
  threat: ThreatHeadline;
  onClickIncident?: (id: string) => void;
}

export default function ThreatHeadlineBar({
  threat,
  onClickIncident,
}: ThreatHeadlineBarProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 border-b ${levelBg[threat.level]} transition-colors duration-500`}
    >
      {/* Pulsing severity dot */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${levelDot[threat.level]} ${threat.level === "danger" ? "animate-ping" : ""}`}
        />
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${levelDot[threat.level]}`}
        />
      </span>

      {/* Headline + subtext */}
      <div className="flex-1 min-w-0">
        <button
          className={`text-sm font-semibold leading-tight truncate block max-w-full text-left ${levelAccent[threat.level]} ${threat.topIncident ? "hover:underline cursor-pointer" : "cursor-default"}`}
          onClick={() =>
            threat.topIncident && onClickIncident?.(threat.topIncident.id)
          }
          disabled={!threat.topIncident}
        >
          {threat.headline}
        </button>
        {threat.subtext && (
          <p className="text-[11px] text-slate-400 leading-tight truncate">
            {threat.subtext}
          </p>
        )}
      </div>

      {/* Affected place count badge */}
      {threat.affectedPlaceCount > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${levelDot[threat.level]} text-white shrink-0`}
        >
          {threat.affectedPlaceCount} place
          {threat.affectedPlaceCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
