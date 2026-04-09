"use client";

import { ExternalLink, ShieldAlert } from "lucide-react";
import type { ArchiveSource } from "@/types/archive";
import { SOURCE_CREDIBILITY } from "@/lib/archive";

interface ArchiveSourcesPanelProps {
  sources: ArchiveSource[];
}

export function ArchiveSourcesPanel({ sources }: ArchiveSourcesPanelProps) {
  return (
    <div className="glass-pane rounded-xl p-4">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-3 flex items-center gap-1.5">
        <ShieldAlert className="w-3 h-3" /> Official Sources
      </h3>
      <div className="space-y-2.5">
        {sources.map((s, i) => {
          const agencyKey = Object.keys(SOURCE_CREDIBILITY).find((k) =>
            s.name.includes(k),
          );
          const credLabel = agencyKey
            ? SOURCE_CREDIBILITY[agencyKey]
            : "Official";
          return (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5 group-hover:text-orange-400 transition-colors" />
              <div>
                <span className="text-xs text-cyan-400 group-hover:text-orange-400 transition-colors leading-tight block">
                  {s.name}
                </span>
                <span className="text-[9px] font-mono text-[var(--text-dim)]">
                  {credLabel}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
