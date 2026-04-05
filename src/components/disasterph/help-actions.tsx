"use client";

import { useState } from "react";
import type { HelpAction } from "@/types/incident";

interface HelpActionsProps {
  actions: HelpAction[];
}

const iconPaths: Record<HelpAction["icon"], string> = {
  phone:
    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  share:
    "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
  checklist:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  locate:
    "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  alert:
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
};

const iconColor: Record<HelpAction["icon"], string> = {
  phone: "text-emerald-300",
  share: "text-cyan-300",
  checklist: "text-amber-300",
  locate: "text-blue-300",
  alert: "text-orange-300",
  link: "text-blue-300",
  copy: "text-violet-300",
};

const buttonBorder: Record<HelpAction["icon"], string> = {
  phone: "hover:border-emerald-400/30",
  share: "hover:border-cyan-400/30",
  checklist: "hover:border-amber-400/30",
  locate: "hover:border-blue-400/30",
  alert: "hover:border-orange-400/30",
  link: "hover:border-blue-400/30",
  copy: "hover:border-violet-400/30",
};

const actionTypeLabel: Record<HelpAction["actionType"], string> = {
  call: "Call",
  link: "Open",
  share: "Share",
  copy: "Copy",
  internal: "",
};

export function HelpActions({ actions }: HelpActionsProps) {
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
  const primary = actions.slice(0, 4);
  const secondary = actions.slice(4);

  return (
    <section className="rounded-xl border border-white/8 bg-[var(--bg-panel)] backdrop-blur">
      <div className="border-b border-white/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Help & Safety
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2">
        {primary.map((action) => (
          <button
            key={action.id}
            className={`group flex flex-col items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center transition hover:bg-white/[0.05] ${buttonBorder[action.icon]}`}
            onClick={() => handleAction(action)}
            type="button"
          >
            <svg
              className={`h-5 w-5 ${iconColor[action.icon]}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d={iconPaths[action.icon]}
              />
            </svg>
            <span className="text-[11px] font-medium text-white">
              {action.label}
            </span>
            <span className="text-[10px] leading-tight text-[var(--text-dim)]">
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
        <div className="space-y-0.5 border-t border-white/6 px-2 py-1.5">
          {secondary.map((action) => (
            <button
              key={action.id}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
              onClick={() => handleAction(action)}
              type="button"
            >
              <svg
                className={`h-4 w-4 shrink-0 ${iconColor[action.icon]}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d={iconPaths[action.icon]}
                />
              </svg>
              <div className="min-w-0 flex-1">
                <span className="text-[12px] font-medium text-white">
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
