"use client";

import { useState } from "react";
import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import {
  Phone,
  Share2,
  ClipboardCheck,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Copy,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type {
  HelpAction,
  Incident,
  OfficialAdvisory,
  PlaceRiskSummary,
} from "@/types/incident";
import type { PrepTip } from "@/lib/prep-guidance";
import type { LucideIcon } from "lucide-react";

interface FloatingIncidentCardProps {
  incident: Incident;
  helpActions: HelpAction[];
  prepTips: PrepTip[];
  advisories: OfficialAdvisory[];
  nearPlaceName?: string | null;
  placeRisks: PlaceRiskSummary[];
  focusMode: boolean;
}

const severityBadge: Record<string, string> = {
  advisory: "text-cyan-200 border-cyan-300/20 bg-cyan-300/10",
  watch: "text-amber-200 border-amber-300/20 bg-amber-300/10",
  warning: "text-orange-200 border-orange-300/20 bg-orange-300/10",
  critical: "text-white border-red-500 bg-red-600 font-bold shadow-[inset_0_4px_24px_rgba(239,68,68,0.15)]",
};

const severityAccent: Record<string, string> = {
  advisory: "border-l-cyan-400/40",
  watch: "border-l-amber-400/50",
  warning: "border-l-orange-400/60",
  critical: "border-l-red-400/70",
};

const urgencyColor: Record<string, string> = {
  now: "text-red-300",
  soon: "text-amber-300",
  general: "text-cyan-300/70",
};

const iconComponent: Record<string, LucideIcon> = {
  phone: Phone,
  share: Share2,
  checklist: ClipboardCheck,
  locate: MapPin,
  alert: AlertTriangle,
  link: ExternalLink,
  copy: Copy,
};

const iconColor: Record<string, string> = {
  phone: "text-emerald-300",
  share: "text-cyan-300",
  checklist: "text-amber-300",
  locate: "text-blue-300",
  alert: "text-orange-300",
  link: "text-blue-300",
  copy: "text-violet-300",
};

export function FloatingIncidentCard({
  incident,
  helpActions,
  prepTips,
  advisories,
  nearPlaceName,
  placeRisks,
  focusMode,
}: FloatingIncidentCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Auto-expand in focus mode
  const isExpanded = expanded || focusMode;

  const quickActions = helpActions
    .filter((a) => a.actionType === "call" || a.actionType === "link")
    .slice(0, 3);

  // Affected places for this incident
  const affectedPlaces = placeRisks.filter((r) =>
    r.nearbyIncidents.some((i) => i.id === incident.id),
  );

  // Matching advisory
  const relatedAdvisory = advisories.find(
    (a) =>
      a.source === incident.source ||
      a.title.toLowerCase().includes(incident.event_type),
  );

  function handleAction(action: HelpAction) {
    if (action.actionType === "call" && action.href)
      window.open(action.href, "_self");
    if (action.actionType === "link" && action.href)
      window.open(action.href, "_blank", "noopener,noreferrer");
    if (action.actionType === "share" && action.copyText) {
      if (navigator.share) {
        navigator.share({ text: action.copyText }).catch(() => {
          navigator.clipboard.writeText(action.copyText!).catch(() => {});
        });
      } else {
        navigator.clipboard.writeText(action.copyText).catch(() => {});
      }
    }
    if (action.actionType === "copy" && action.copyText) {
      navigator.clipboard.writeText(action.copyText).catch(() => {});
    }
  }

  /* ── Compact card ── */
  if (!isExpanded) {
    return (
      <div className="absolute bottom-4 left-4 z-20 hidden w-72 rounded-lg border border-white/10 bg-[rgba(6,14,22,0.96)] shadow-[0_4px_16px_rgba(0,0,0,0.4)] lg:block">
        <div className="p-3">
          <div className="flex items-center gap-1.5">
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {eventTypeLabel[incident.event_type]}
            </span>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityBadge[incident.severity]}`}
            >
              {incident.severity}
            </span>
            <span className="ml-auto text-[10px] text-[var(--text-dim)]">
              {incident.source}
            </span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold leading-5 text-white">
            {incident.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span>{incident.region}</span>
            <span className="text-[var(--text-dim)]">·</span>
            <span suppressHydrationWarning>{formatShortTime(incident.updated_at)}</span>
          </div>
        </div>

        {/* Expand + quick actions */}
        <div className="flex items-center gap-1 border-t border-white/8 px-2 py-1.5">
          <button
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-cyan-300/80 transition hover:bg-cyan-400/10 hover:text-cyan-200"
            onClick={() => setExpanded(true)}
            type="button"
          >
            <Maximize2 className="h-3 w-3" />
            Expand
          </button>
          <div className="mx-1 h-3 w-px bg-white/8" />
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[10px] text-[var(--text-muted)] transition hover:bg-white/[0.06] hover:text-white"
              onClick={() => handleAction(action)}
              title={action.label}
              type="button"
            >
              {(() => {
                const Icon = iconComponent[action.icon] ?? ExternalLink;
                return <Icon className="h-3 w-3 shrink-0" />;
              })()}
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Expanded card ── */
  return (
    <div
      className={`absolute bottom-4 left-4 z-20 hidden w-[380px] max-h-[calc(100%-5rem)] rounded-lg border border-white/12 border-l-2 ${severityAccent[incident.severity]} bg-[rgba(6,14,22,0.97)] shadow-[0_4px_20px_rgba(0,0,0,0.45)] lg:flex lg:flex-col`}
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2 shrink-0">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
          Incident Detail
        </span>
        <button
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-[var(--text-dim)] transition hover:bg-white/[0.06] hover:text-white"
          onClick={() => setExpanded(false)}
          type="button"
        >
          <Minimize2 className="h-3 w-3" />
          Collapse
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ── Section: Situation ── */}
        <div className="p-3 pb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {eventTypeLabel[incident.event_type]}
            </span>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityBadge[incident.severity]}`}
            >
              {incident.severity}
            </span>
            {nearPlaceName && (
              <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 text-[9px] text-cyan-300">
                Near {nearPlaceName}
              </span>
            )}
            <span className="ml-auto text-[10px] text-[var(--text-dim)]">
              {incident.source}
            </span>
          </div>

          <h3 className="mt-2 text-[15px] font-semibold leading-6 text-white">
            {incident.title}
          </h3>

          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <MapPin className="h-3 w-3 shrink-0 text-[var(--text-dim)]" />
            <span>{incident.region}</span>
            <span className="text-[var(--text-dim)]">·</span>
            <span suppressHydrationWarning>{formatShortTime(incident.updated_at)}</span>
          </div>

          {incident.description && (
            <p className="mt-2 text-[12px] leading-[1.5] text-[var(--text-muted)] line-clamp-4">
              {incident.description}
            </p>
          )}
        </div>

        {/* ── Section: Risk to My Places ── */}
        {affectedPlaces.length > 0 && (
          <div className="border-t border-white/6 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.22em] text-[var(--text-dim)] mb-1.5">
              Risk to My Places
            </p>
            <div className="space-y-1">
              {affectedPlaces.map((r) => {
                const dist = r.nearestDistanceKm;
                return (
                  <div
                    key={r.place.id}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        r.riskLevel === "danger"
                          ? "bg-red-400"
                          : r.riskLevel === "at-risk"
                            ? "bg-orange-400"
                            : r.riskLevel === "monitor"
                              ? "bg-amber-300"
                              : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-[12px] font-medium text-white truncate">
                      {r.place.label}
                    </span>
                    <span className="ml-auto text-[10px] text-[var(--text-dim)] shrink-0">
                      {dist !== null ? `${Math.round(dist)} km` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section: What To Do ── */}
        {prepTips.length > 0 && (
          <div className="border-t border-white/6 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.22em] text-[var(--text-dim)] mb-1.5">
              What to Do
            </p>
            <div className="space-y-1.5">
              {prepTips.slice(0, 4).map((tip) => (
                <div key={tip.id} className="flex items-start gap-2">
                  <span
                    className={`mt-1 text-[12px] font-bold uppercase shrink-0 ${urgencyColor[tip.urgency]}`}
                  >
                    {tip.urgency === "now"
                      ? "✓"
                      : tip.urgency === "soon"
                        ? "✓"
                        : "·"}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium leading-tight text-white">
                      {tip.title}
                    </span>
                    <p className="text-[10px] leading-tight text-[var(--text-dim)] mt-0.5">
                      {tip.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section: Help Actions ── */}
        {helpActions.length > 0 && (
          <div className="border-t border-white/6 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.22em] text-[var(--text-dim)] mb-1.5">
              Help & Safety
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {helpActions.slice(0, 6).map((action) => (
                <button
                  key={action.id}
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/8 bg-white/[0.02] px-2 py-2 text-center transition hover:bg-white/[0.05]"
                  onClick={() => handleAction(action)}
                  type="button"
                >
                  {(() => {
                    const Icon = iconComponent[action.icon] ?? ExternalLink;
                    return (
                      <Icon
                        className={`h-4 w-4 ${iconColor[action.icon] ?? "text-cyan-300"}`}
                      />
                    );
                  })()}
                  <span className="text-[10px] font-medium text-white leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Section: Official Source ── */}
        {relatedAdvisory && (
          <div className="border-t border-white/6 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.22em] text-[var(--text-dim)] mb-1.5">
              Official Source
            </p>
            <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {relatedAdvisory.source}
                </span>
                <span className="ml-auto text-[10px] text-[var(--text-dim)]" suppressHydrationWarning>
                  {formatShortTime(relatedAdvisory.issued_at)}
                </span>
              </div>
              <p className="mt-1 text-[12px] font-medium text-white leading-tight">
                {relatedAdvisory.title}
              </p>
              {relatedAdvisory.summary && (
                <p className="mt-1 text-[11px] text-[var(--text-muted)] line-clamp-2">
                  {relatedAdvisory.summary}
                </p>
              )}
              {relatedAdvisory.url && (
                <a
                  href={relatedAdvisory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-cyan-300/80 hover:text-cyan-200 transition"
                >
                  <ExternalLink className="h-3 w-3" />
                  View full bulletin
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Section: Details (metadata) ── */}
        {Object.keys(incident.metadata).length > 0 && (
          <div className="border-t border-white/6 px-3 py-3">
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
              {Object.entries(incident.metadata).map(([key, value]) => (
                <span
                  key={key}
                  className={`max-w-full truncate rounded-full border px-2 py-1 text-[11px] ${
                    incident.severity === 'critical'
                      ? 'border-red-500/30 bg-red-500/20 text-red-200 font-medium'
                      : 'border-white/8 bg-white/[0.03] text-[var(--text-muted)]'
                  }`}
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
