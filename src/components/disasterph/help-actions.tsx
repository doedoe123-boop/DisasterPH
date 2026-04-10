"use client";

import { useState } from "react";
import {
  Phone,
  Share2,
  ClipboardCheck,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { HelpAction } from "@/types/incident";
import type { LucideIcon } from "lucide-react";

interface HelpActionsProps {
  actions: HelpAction[];
  compact?: boolean;
}

const iconComponent: Record<HelpAction["icon"], LucideIcon> = {
  phone: Phone,
  share: Share2,
  checklist: ClipboardCheck,
  locate: MapPin,
  alert: AlertTriangle,
  link: ExternalLink,
  copy: Copy,
};

const iconColor: Record<HelpAction["icon"], string> = {
  phone: "text-[var(--text-primary)]",
  share: "text-cyan-300",
  checklist: "text-amber-300",
  locate: "text-blue-300",
  alert: "text-[var(--text-primary)]",
  link: "text-blue-300",
  copy: "text-violet-300",
};

const buttonStyle: Record<HelpAction["icon"], string> = {
  phone: "bg-emerald-600/90 hover:bg-emerald-500 border-emerald-500",
  share: "bg-overlay/[0.02] hover:bg-overlay/[0.05] border-overlay/8 hover:border-cyan-400/30",
  checklist: "bg-overlay/[0.02] hover:bg-overlay/[0.05] border-overlay/8 hover:border-amber-400/30",
  locate: "bg-overlay/[0.02] hover:bg-overlay/[0.05] border-overlay/8 hover:border-blue-400/30",
  alert: "bg-orange-600/90 hover:bg-orange-500 border-orange-500",
  link: "bg-overlay/[0.02] hover:bg-overlay/[0.05] border-overlay/8 hover:border-blue-400/30",
  copy: "bg-overlay/[0.02] hover:bg-overlay/[0.05] border-overlay/8 hover:border-violet-400/30",
};

const actionTypeLabel: Record<HelpAction["actionType"], string> = {
  call: "Call",
  link: "Open",
  share: "Share",
  copy: "Copy",
  internal: "",
};

export function HelpActions({ actions, compact = false }: HelpActionsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleAction(action: HelpAction) {
    switch (action.actionType) {
      case "call":
        if (action.href) window.open(action.href, "_self");
        break;
      case "link":
        if (action.href)
          window.open(action.href, "_blank", "noopener,noreferrer");
        break;
      case "share":
        if (
          action.copyText &&
          typeof navigator !== "undefined" &&
          navigator.share
        ) {
          try {
            await navigator.share({ text: action.copyText });
          } catch {
            // User cancelled or share failed — fall through to copy
            await copyToClipboard(action);
          }
        } else {
          await copyToClipboard(action);
        }
        break;
      case "copy":
        await copyToClipboard(action);
        break;
      case "internal":
        // Internal actions are placeholders for future features
        break;
    }
  }

  async function copyToClipboard(action: HelpAction) {
    if (!action.copyText) return;
    try {
      await navigator.clipboard.writeText(action.copyText);
      setCopiedId(action.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard API failed silently
    }
  }

  // Split into primary (first 4) and secondary
  const primary = actions.slice(0, compact ? 3 : 4);
  const secondary = compact ? [] : actions.slice(4);

  if (compact) {
    return (
      <div className="flex gap-1.5">
        {primary.map((action) => (
          <button
            key={action.id}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-center transition ${buttonStyle[action.icon]}`}
            onClick={() => handleAction(action)}
            type="button"
          >
            {(() => {
              const Icon = iconComponent[action.icon];
              return (
                <Icon className={`h-3.5 w-3.5 ${iconColor[action.icon]}`} />
              );
            })()}
            <span className="text-[10px] font-medium text-[var(--text-primary)]">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)]">
      <div className="border-b border-overlay/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Help & Safety
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2">
        {primary.map((action) => (
          <button
            key={action.id}
            className={`group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${buttonStyle[action.icon]}`}
            onClick={() => handleAction(action)}
            type="button"
          >
            {(() => {
              const Icon = iconComponent[action.icon];
              return <Icon className={`h-5 w-5 ${iconColor[action.icon]}`} />;
            })()}
            <span className={`text-[11px] font-medium ${action.icon === 'phone' || action.icon === 'alert' ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
              {action.label}
            </span>
            <span className={`text-[10px] leading-tight ${action.icon === 'phone' || action.icon === 'alert' ? 'text-overlay/80' : 'text-[var(--text-dim)]'}`}>
              {copiedId === action.id ? "Copied!" : action.description}
            </span>
            {actionTypeLabel[action.actionType] && (
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-dim)] opacity-0 transition group-hover:opacity-100">
                {actionTypeLabel[action.actionType]}
              </span>
            )}
          </button>
        ))}
      </div>

      {secondary.length > 0 && (
        <div className="space-y-0.5 border-t border-overlay/6 px-2 py-1.5">
          {secondary.map((action) => (
            <button
              key={action.id}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-overlay/[0.04]"
              onClick={() => handleAction(action)}
              type="button"
            >
              {(() => {
                const Icon = iconComponent[action.icon];
                return (
                  <Icon
                    className={`h-4 w-4 shrink-0 ${iconColor[action.icon]}`}
                  />
                );
              })()}
              <div className="min-w-0 flex-1">
                <span className="text-[12px] font-medium text-[var(--text-primary)]">
                  {action.label}
                </span>
                <span className="ml-1.5 text-[11px] text-[var(--text-dim)]">
                  {copiedId === action.id ? "Copied!" : action.description}
                </span>
              </div>
              {action.actionType !== "internal" && (
                <span className="shrink-0 text-[9px] uppercase tracking-wider text-[var(--text-dim)]">
                  {actionTypeLabel[action.actionType]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
