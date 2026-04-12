import { MapPin } from "lucide-react";
import type { PlaceRiskSummary } from "@/types/incident";
import { formatShortTime } from "@/lib/incidents";
import { visualFromRiskLevel, visualFromSeverity } from "@/lib/severity";
import { eventLabel, severityText, t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

interface RiskSummaryProps {
  risk: PlaceRiskSummary;
  onSelectIncident: (id: string) => void;
}

export function RiskSummary({ risk, onSelectIncident }: RiskSummaryProps) {
  const { locale } = useLocale();
  const i18n = t(locale);
  const {
    place,
    nearbyIncidents,
    riskLevel,
    nearestDistanceKm,
    strongestIncident,
    freshestUpdateAt,
    placeRegion,
    matchingSummary,
  } = risk;
  const riskVisual = visualFromRiskLevel(riskLevel);

  return (
    <section
      className={`shrink-0 rounded-lg border border-overlay/10 border-l-2 bg-gradient-to-r p-3 ${riskVisual.panel}`}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <span className="rounded border border-overlay/10 bg-overlay/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {i18n.risk.summary}
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-dim)]">
          {place.label}
        </span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
        {placeRegion}
      </p>

      {/* Headline */}
      <h3 className="mt-2 text-[15px] font-semibold leading-6 text-[var(--text-primary)]">
        {i18n.risk.headlines[riskLevel]}
      </h3>
      <p className="mt-1 text-[12px] leading-[1.5] text-[var(--text-muted)]">
        {i18n.risk.descriptions[riskLevel]}
      </p>

      {strongestIncident && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${visualFromSeverity(strongestIncident.severity).dot}`}
          />
          <span className="truncate">
            {i18n.common.strongestNearby}:{" "}
            {eventLabel(strongestIncident.event_type, locale)}{" "}
            {severityText(strongestIncident.severity, locale)}
          </span>
        </div>
      )}

      {/* Distance indicator */}
      {nearestDistanceKm !== null && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <MapPin className="h-3 w-3 shrink-0 text-[var(--text-dim)]" />
          <span>
            {i18n.common.nearestHazard}: ~{Math.round(nearestDistanceKm)} km
          </span>
        </div>
      )}
      {freshestUpdateAt && (
        <div
          className="mt-1 text-[11px] text-[var(--text-dim)]"
          suppressHydrationWarning
        >
          {i18n.common.lastNearbyUpdate} {formatShortTime(freshestUpdateAt)}
        </div>
      )}
      <div className="mt-2 rounded-lg border border-overlay/6 bg-overlay/[0.02] px-2.5 py-2 text-[11px] leading-5 text-[var(--text-muted)]">
        {matchingSummary}
      </div>

      {/* Nearby incidents list */}
      {nearbyIncidents.length > 0 && (
        <div className="mt-2.5 border-t border-overlay/6 pt-2">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            {i18n.common.nearbyIncidents} ({nearbyIncidents.length})
          </p>
          <div className="space-y-1">
            {nearbyIncidents.slice(0, 5).map((inc) => (
              <button
                key={inc.id}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-overlay/[0.04]"
                onClick={() => onSelectIncident(inc.id)}
                type="button"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${visualFromSeverity(inc.severity).dot}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                    {inc.title}
                  </p>
                  <p
                    className="text-[10px] text-[var(--text-dim)]"
                    suppressHydrationWarning
                  >
                    {eventLabel(inc.event_type, locale)} ·{" "}
                    {severityText(inc.severity, locale)} ·{" "}
                    {formatShortTime(inc.updated_at)}
                  </p>
                </div>
              </button>
            ))}
            {nearbyIncidents.length > 5 && (
              <p className="px-2 text-[10px] text-[var(--text-dim)]">
                +{nearbyIncidents.length - 5} {i18n.common.more}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
