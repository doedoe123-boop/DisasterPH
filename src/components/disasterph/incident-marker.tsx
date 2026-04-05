import { eventTypeLabel } from "@/lib/incidents";
import type { Incident, IncidentEventType } from "@/types/incident";

interface IncidentMarkerProps {
  incident: Incident;
  isSelected: boolean;
  isHovered: boolean;
  isNearSavedPlace?: boolean;
  dimmed?: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  x: number;
  y: number;
}

const hazardColor: Record<IncidentEventType, string> = {
  earthquake: "#ffbf47",
  typhoon: "#39d0ff",
  volcano: "#ff6b35",
  flood: "#39d0ff",
  landslide: "#ffa726",
  wildfire: "#ff5d5d",
};

const hazardGlyph: Record<IncidentEventType, string> = {
  earthquake: "M-9 -2L-2 -2L-5 7L2 7L-1 16L10 1L3 1L7 -10L-4 4L1 4L-2 12Z",
  typhoon:
    "M0 -14C7 -14 12 -8 12 -2C12 4 8 9 1 10C5 5 5 0 2 -2C-1 -4 -5 -2 -6 2C-8 7 -4 12 2 14C-8 15 -15 10 -16 2C-17 -8 -10 -14 0 -14Z",
  flood:
    "M-14 7C-10 2 -7 2 -3 7C1 12 4 12 8 7C12 2 15 2 19 7M-12 16C-8 11 -5 11 -1 16C3 21 6 21 10 16C14 11 17 11 21 16",
  volcano: "M-13 12L-2 -8L7 12ZM-2 -8C-1 -14 4 -16 8 -13C10 -10 8 -6 5 -4",
  landslide: "M-17 11H18M-16 11L-2 -7L7 -1L18 -13M-9 3L-2 7M4 4L10 9",
  wildfire:
    "M2 -14C8 -8 10 -4 8 1C6 7 1 10 -4 9C-9 8 -13 3 -12 -3C-11 -8 -7 -11 -2 -12C-4 -7 -1 -3 3 -3C7 -3 7 -7 2 -14Z",
};

function MarkerEffects({
  type,
  isSelected,
  color,
}: {
  type: IncidentEventType;
  isSelected: boolean;
  color: string;
}) {
  if (type === "earthquake") {
    return (
      <>
        <circle
          className="marker-pulse"
          cx="0"
          cy="0"
          r={isSelected ? 38 : 30}
          fill="none"
          stroke={color}
          strokeOpacity="0.5"
          strokeWidth="2"
        />
        <circle
          className="marker-pulse"
          cx="0"
          cy="0"
          r={isSelected ? 26 : 20}
          fill="none"
          stroke={color}
          strokeOpacity="0.3"
          strokeWidth="2.5"
          style={{ animationDelay: "0.5s" }}
        />
        {isSelected && (
          <circle
            className="marker-pulse"
            cx="0"
            cy="0"
            r={44}
            fill="none"
            stroke={color}
            strokeOpacity="0.2"
            strokeWidth="1.5"
            style={{ animationDelay: "1s" }}
          />
        )}
      </>
    );
  }

  if (type === "typhoon") {
    return (
      <>
        <circle
          className="typhoon-rotate"
          cx="0"
          cy="0"
          r={isSelected ? 34 : 26}
          fill="none"
          stroke={color}
          strokeOpacity="0.4"
          strokeWidth="2"
          strokeDasharray="8 6"
        />
        <circle
          className="typhoon-rotate-reverse"
          cx="0"
          cy="0"
          r={isSelected ? 24 : 18}
          fill="none"
          stroke={color}
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeDasharray="5 8"
        />
        {isSelected && (
          <circle
            className="typhoon-rotate"
            cx="0"
            cy="0"
            r={42}
            fill="none"
            stroke={color}
            strokeOpacity="0.15"
            strokeWidth="1.5"
            strokeDasharray="12 8"
          />
        )}
      </>
    );
  }

  if (type === "volcano") {
    return (
      <>
        <circle
          className="marker-pulse volcano-flare"
          cx="0"
          cy="0"
          r={isSelected ? 32 : 24}
          fill="none"
          stroke={color}
          strokeOpacity="0.5"
          strokeWidth="2.5"
        />
        {isSelected && (
          <>
            <circle
              className="marker-pulse"
              cx="0"
              cy="0"
              r={40}
              fill="none"
              stroke="#ff3d00"
              strokeOpacity="0.25"
              strokeWidth="2"
              style={{ animationDelay: "0.4s" }}
            />
            <circle
              cx="0"
              cy="0"
              r={16}
              fill="rgba(255, 107, 53, 0.08)"
              className="volcano-flare"
            />
          </>
        )}
      </>
    );
  }

  if (type === "flood") {
    return (
      <>
        <circle
          className="flood-spread"
          cx="0"
          cy="0"
          r={isSelected ? 30 : 22}
          fill={`rgba(57, 208, 255, ${isSelected ? 0.06 : 0.03})`}
          stroke={color}
          strokeOpacity="0.35"
          strokeWidth="2"
        />
        <circle
          className="flood-spread"
          cx="0"
          cy="0"
          r={isSelected ? 22 : 16}
          fill="none"
          stroke={color}
          strokeOpacity="0.25"
          strokeWidth="1.5"
          style={{ animationDelay: "0.6s" }}
        />
        {isSelected && (
          <circle
            className="flood-spread"
            cx="0"
            cy="0"
            r={38}
            fill="none"
            stroke={color}
            strokeOpacity="0.1"
            strokeWidth="1.5"
            style={{ animationDelay: "1.2s" }}
          />
        )}
      </>
    );
  }

  if (type === "landslide") {
    return (
      <>
        <polygon
          className="marker-pulse"
          points="0,-30 26,15 -26,15"
          fill="none"
          stroke={color}
          strokeOpacity={isSelected ? "0.5" : "0.35"}
          strokeWidth="2"
          transform={`scale(${isSelected ? 1.2 : 0.9})`}
        />
        {isSelected && (
          <polygon
            className="marker-pulse"
            points="0,-38 34,19 -34,19"
            fill="none"
            stroke={color}
            strokeOpacity="0.2"
            strokeWidth="1.5"
            style={{ animationDelay: "0.5s" }}
          />
        )}
      </>
    );
  }

  // Default/wildfire
  return (
    <circle
      className="marker-pulse"
      cx="0"
      cy="0"
      r={isSelected ? 30 : 22}
      fill="none"
      stroke={color}
      strokeOpacity="0.4"
      strokeWidth="2"
    />
  );
}

export function IncidentMarker({
  incident,
  isSelected,
  isHovered,
  isNearSavedPlace = false,
  dimmed = false,
  onSelect,
  onHover,
  x,
  y,
}: IncidentMarkerProps) {
  const color = hazardColor[incident.event_type];
  const isHighPriority =
    incident.severity === "warning" || incident.severity === "critical";

  // Severity-scaled base radius
  const baseR =
    incident.severity === "critical"
      ? 22
      : incident.severity === "warning"
        ? 20
        : incident.severity === "watch"
          ? 17
          : 14;

  const r = isSelected ? baseR + 4 : isHovered ? baseR + 2 : baseR;
  const sw = isSelected
    ? 3
    : isHovered
      ? 3
      : incident.severity === "critical"
        ? 2.5
        : 2;
  const opacity = dimmed ? 0.35 : 1;

  return (
    <g
      className="group"
      transform={`translate(${x} ${y})`}
      opacity={opacity}
      style={{ transition: "opacity 0.3s" }}
    >
      <MarkerEffects
        type={incident.event_type}
        isSelected={isSelected}
        color={color}
      />

      {/* Near-saved-place glow ring */}
      {isNearSavedPlace && !isSelected && (
        <circle
          cx="0"
          cy="0"
          r={r + 6}
          fill="none"
          stroke="rgba(34, 211, 238, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="marker-pulse"
        />
      )}

      {/* Core marker */}
      <circle
        className="marker-core"
        cx="0"
        cy="0"
        fill="rgba(5, 12, 20, 0.94)"
        r={r}
        stroke={color}
        strokeWidth={sw}
        style={{
          filter: isSelected
            ? `drop-shadow(0 0 4px ${color})`
            : isHovered
              ? `drop-shadow(0 0 3px ${color})`
              : undefined,
          transition: "r 0.15s, stroke-width 0.15s, filter 0.15s",
        }}
      />

      {/* Hazard glyph */}
      <path
        d={hazardGlyph[incident.event_type]}
        fill={
          incident.event_type === "flood" || incident.event_type === "landslide"
            ? "none"
            : color
        }
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={incident.event_type === "earthquake" ? 1.6 : 2}
        transform="scale(0.82)"
      />

      {/* Hit area */}
      <foreignObject height="80" width="80" x="-40" y="-40">
        <button
          aria-label={incident.title}
          className="h-[80px] w-[80px] cursor-pointer rounded-full bg-transparent"
          onClick={onSelect}
          onMouseEnter={() => onHover(incident.id)}
          onMouseLeave={() => onHover(null)}
          type="button"
        />
      </foreignObject>

      {/* Tooltip label */}
      <g
        className={`transition-opacity duration-200 ${
          isSelected || isHovered
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <rect
          fill="rgba(5, 13, 22, 0.94)"
          height="80"
          rx="14"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          width={380}
          x="-190"
          y="-108"
        />
        <text
          fill="rgba(255,255,255,0.5)"
          fontSize="18"
          letterSpacing="0.14em"
          textAnchor="middle"
          x="0"
          y="-74"
        >
          {eventTypeLabel[incident.event_type].toUpperCase()} ·{" "}
          {incident.severity.toUpperCase()}
        </text>
        <text
          fill="white"
          fontSize="24"
          fontWeight="500"
          textAnchor="middle"
          x="0"
          y="-44"
        >
          {incident.title.length > 28
            ? incident.title.slice(0, 28) + "…"
            : incident.title}
        </text>
      </g>
    </g>
  );
}
