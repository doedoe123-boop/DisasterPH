import { MapPin } from "lucide-react";
import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import { severityLabel, visualFromSeverity } from "@/lib/severity";
import type { Incident } from "@/types/incident";

interface IncidentDetailsProps {
  incident: Incident;
}

/** Keys surfaced as structured stats rather than generic tags */
const STRUCTURED_KEYS = new Set([
  "magnitude",
  "depth_km",
  "felt_reports",
  "tsunami_warning",
  "mmi",
  "alert_level",
  "wind_speed_kph",
  "movement",
  "signal_number",
]);

/** Keys hidden from the generic tag list (links, internal notes) */
const HIDDEN_KEYS = new Set([
  "usgs_url",
  "eonet_link",
  "data_source",
  "confidence",
  "note",
  "category",
  "bulletin_type",
  "magnitude_unit",
  "magnitude_value",
  "track_points",
]);

function EarthquakeStats({ metadata }: { metadata: Incident["metadata"] }) {
  const mag = metadata.magnitude as number | null;
  const depth = metadata.depth_km as number | null;
  const felt = metadata.felt_reports as number | null;
  const tsunami = metadata.tsunami_warning as boolean | null;
  const mmi = metadata.mmi as number | null;

  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      {mag != null && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/8 px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-amber-300/60">
            Magnitude
          </p>
          <p className="text-[18px] font-bold leading-6 tabular-nums text-amber-200">
            {Number(mag).toFixed(1)}
          </p>
        </div>
      )}
      {depth != null && (
        <div className="rounded-lg border border-overlay/8 bg-overlay/[0.03] px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            Depth
          </p>
          <p className="text-[18px] font-bold leading-6 tabular-nums text-[var(--text-primary)]">
            {Number(depth).toFixed(0)}
            <span className="ml-0.5 text-[11px] font-normal text-[var(--text-dim)]">
              km
            </span>
          </p>
        </div>
      )}
      {mmi != null && (
        <div className="rounded-lg border border-overlay/8 bg-overlay/[0.03] px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            Intensity (MMI)
          </p>
          <p className="text-[14px] font-semibold leading-5 text-[var(--text-primary)]">
            {mmiToRoman(Number(mmi))}
          </p>
        </div>
      )}
      {felt != null && (
        <div className="rounded-lg border border-overlay/8 bg-overlay/[0.03] px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            Felt reports
          </p>
          <p className="text-[14px] font-semibold leading-5 text-[var(--text-primary)]">
            {felt}
          </p>
        </div>
      )}
      {tsunami && (
        <div className="col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5">
          <p className="text-[11px] font-medium text-red-300">
            Tsunami warning issued
          </p>
        </div>
      )}
    </div>
  );
}

function VolcanoStats({ metadata }: { metadata: Incident["metadata"] }) {
  const alertLevel = metadata.alert_level as string | null;

  if (!alertLevel) return null;

  const alertColor =
    alertLevel === "red" || alertLevel === "warning"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : alertLevel === "orange" || alertLevel === "watch"
        ? "border-orange-400/30 bg-orange-400/10 text-orange-300"
        : "border-amber-400/20 bg-amber-400/8 text-amber-300";

  return (
    <div className="mt-2">
      <div className={`rounded-lg border px-2.5 py-1.5 ${alertColor}`}>
        <p className="text-[9px] uppercase tracking-[0.2em] opacity-60">
          Alert Level
        </p>
        <p className="text-[13px] font-semibold uppercase">{alertLevel}</p>
      </div>
    </div>
  );
}

function TyphoonStats({ metadata }: { metadata: Incident["metadata"] }) {
  const windSpeed = metadata.wind_speed_kph as number | null;
  const movement = metadata.movement as string | null;
  const signalNo = metadata.signal_number as number | null;
  const trackJson = metadata.track_points as string | undefined;

  let trackCount = 0;
  if (typeof trackJson === "string") {
    try {
      const pts = JSON.parse(trackJson);
      if (Array.isArray(pts)) trackCount = pts.length;
    } catch {
      /* ignore */
    }
  }

  if (!windSpeed && !movement && !signalNo && trackCount === 0) return null;

  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      {signalNo != null && (
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/8 px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-300/60">
            Signal No.
          </p>
          <p className="text-[18px] font-bold leading-6 text-cyan-200">
            #{signalNo}
          </p>
        </div>
      )}
      {windSpeed != null && (
        <div className="rounded-lg border border-overlay/8 bg-overlay/[0.03] px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            Wind Speed
          </p>
          <p className="text-[14px] font-semibold leading-5 text-[var(--text-primary)]">
            {windSpeed}
            <span className="ml-0.5 text-[11px] font-normal text-[var(--text-dim)]">
              kph
            </span>
          </p>
        </div>
      )}
      {movement && (
        <div className="col-span-2 rounded-lg border border-overlay/8 bg-overlay/[0.03] px-2.5 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            Movement
          </p>
          <p className="text-[12px] leading-4 text-[var(--text-primary)]">{movement}</p>
        </div>
      )}
      {trackCount > 1 && (
        <div className="col-span-2 rounded-lg border border-cyan-400/15 bg-cyan-400/5 px-2.5 py-1.5">
          <p className="text-[11px] text-cyan-300/80">
            Track path visible on map ({trackCount} points)
          </p>
        </div>
      )}
    </div>
  );
}

function mmiToRoman(mmi: number): string {
  const romans = [
    "",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  const clamped = Math.round(Math.max(1, Math.min(12, mmi)));
  return romans[clamped] ?? String(mmi);
}

export function IncidentDetails({ incident }: IncidentDetailsProps) {
  const severityVisual = visualFromSeverity(incident.severity);

  // Filter out structured/hidden keys for the generic tag list
  const genericMeta = Object.entries(incident.metadata).filter(
    ([key, value]) =>
      !STRUCTURED_KEYS.has(key) && !HIDDEN_KEYS.has(key) && value != null,
  );

  return (
    <section
      className={`shrink-0 rounded-lg border border-overlay/10 border-l-2 bg-[var(--bg-panel-strong)] p-3 ${severityVisual.accent}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="rounded border border-overlay/10 bg-overlay/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {eventTypeLabel[incident.event_type]}
        </span>
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityVisual.badge}`}
        >
          {severityLabel[incident.severity]}
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-dim)]">
          {incident.source}
        </span>
      </div>

      <h3 className="mt-2 text-[15px] font-semibold leading-6 text-[var(--text-primary)]">
        {incident.title}
      </h3>

      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <MapPin className="h-3 w-3 shrink-0 text-[var(--text-dim)]" />
        <span>{incident.region}</span>
        <span className="text-[var(--text-dim)]">·</span>
        <span suppressHydrationWarning>
          {formatShortTime(incident.updated_at)}
        </span>
      </div>

      {/* Hazard-specific structured stats */}
      {incident.event_type === "earthquake" && (
        <EarthquakeStats metadata={incident.metadata} />
      )}
      {incident.event_type === "volcano" && (
        <VolcanoStats metadata={incident.metadata} />
      )}
      {incident.event_type === "typhoon" && (
        <TyphoonStats metadata={incident.metadata} />
      )}

      <div className="mt-2.5 border-t border-overlay/6 pt-3">
        <p className="text-[12px] leading-[1.6] text-[var(--text-muted)]">
          {incident.description}
        </p>
        {genericMeta.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {genericMeta.map(([key, value]) => (
              <span
                key={key}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  incident.severity === "critical"
                    ? "border-red-500/30 bg-red-500/20 text-red-200"
                    : "border-overlay/8 bg-overlay/[0.03] text-[var(--text-muted)]"
                }`}
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
