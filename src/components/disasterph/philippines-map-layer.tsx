import { MAP_VIEW_BOX } from "@/lib/map";
import { philippineIslandPaths } from "@/data/ph-paths";

const regionLabels = [
  { id: "luzon", x: 530, y: 455, text: "Luzon" },
  { id: "palawan", x: 130, y: 760, text: "Palawan" },
  { id: "mindoro", x: 260, y: 645, text: "Mindoro" },
  { id: "visayas", x: 630, y: 770, text: "Visayas" },
  { id: "samar", x: 680, y: 700, text: "Samar" },
  { id: "mindanao", x: 630, y: 980, text: "Mindanao" },
  { id: "west-ph-sea", x: 30, y: 900, text: "West Philippine Sea", dim: true },
  { id: "philippine-sea", x: 780, y: 600, text: "Philippine", dim: true },
  { id: "philippine-sea-2", x: 830, y: 640, text: "Sea", dim: true },
  { id: "sulu-sea", x: 280, y: 1050, text: "Sulu Sea", dim: true },
  { id: "celebes-sea", x: 370, y: 1300, text: "Celebes Sea", dim: true },
];

export function PhilippinesMapLayer() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 z-[2] h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${MAP_VIEW_BOX.width} ${MAP_VIEW_BOX.height}`}
    >
      <defs>
        <radialGradient id="seaGlow" cx="46%" cy="38%" r="62%">
          <stop offset="0%" stopColor="rgba(25, 95, 155, 0.28)" />
          <stop offset="40%" stopColor="rgba(12, 55, 95, 0.16)" />
          <stop offset="100%" stopColor="rgba(5, 16, 28, 0)" />
        </radialGradient>
        <radialGradient id="seaGlow2" cx="52%" cy="55%" r="50%">
          <stop offset="0%" stopColor="rgba(57, 208, 255, 0.06)" />
          <stop offset="100%" stopColor="rgba(5, 16, 28, 0)" />
        </radialGradient>
        <linearGradient id="landFill" x1="30%" x2="70%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#5a7b90" />
          <stop offset="35%" stopColor="#4a6878" />
          <stop offset="100%" stopColor="#3a5565" />
        </linearGradient>
        <filter id="coastGlow" height="180%" width="180%" x="-40%" y="-40%">
          <feGaussianBlur result="blurred" stdDeviation="6" />
          <feColorMatrix
            in="blurred"
            result="cyanGlow"
            type="matrix"
            values="0 0 0 0 0.15 0 0 0 0 0.72 0 0 0 0 0.95 0 0 0 0.45 0"
          />
          <feMerge>
            <feMergeNode in="cyanGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="innerShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feOffset dx="1" dy="2" result="offsetBlur" />
          <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
        </filter>
      </defs>

      {/* Ocean base */}
      <rect
        fill="url(#seaGlow)"
        height={MAP_VIEW_BOX.height}
        width={MAP_VIEW_BOX.width}
      />
      <rect
        fill="url(#seaGlow2)"
        height={MAP_VIEW_BOX.height}
        width={MAP_VIEW_BOX.width}
      />

      {/* Subtle radar grid */}
      <g opacity="0.08">
        {[200, 400, 600, 800, 1000, 1200, 1400].map((y) => (
          <line
            key={`h-${y}`}
            x1="0"
            y1={y}
            x2={MAP_VIEW_BOX.width}
            y2={y}
            stroke="rgba(57, 208, 255, 0.6)"
            strokeWidth="0.5"
          />
        ))}
        {[200, 400, 600, 800].map((x) => (
          <line
            key={`v-${x}`}
            x1={x}
            y1="0"
            x2={x}
            y2={MAP_VIEW_BOX.height}
            stroke="rgba(57, 208, 255, 0.6)"
            strokeWidth="0.5"
          />
        ))}
      </g>

      {/* Radar circles - centered roughly on Philippines */}
      <g opacity="0.05">
        {[120, 280, 440, 600].map((r) => (
          <circle
            key={`radar-${r}`}
            cx="480"
            cy="700"
            r={r}
            fill="none"
            stroke="rgba(57, 208, 255, 0.8)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
        ))}
      </g>

      {/* GeoJSON-derived island geometry */}
      <g filter="url(#coastGlow)" opacity="0.95">
        {philippineIslandPaths.map((island) => (
          <path
            key={island.id}
            d={island.d}
            fill="url(#landFill)"
            stroke="rgba(120, 200, 255, 0.3)"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        ))}
      </g>

      {/* Latitude/longitude reference lines over land */}
      <g opacity="0.04">
        {[8, 10, 12, 14, 16, 18, 20].map((lat) => {
          const y = (1 - (lat - 4.5) / 17) * MAP_VIEW_BOX.height;
          return (
            <g key={`lat-${lat}`}>
              <line
                x1="0"
                y1={y}
                x2={MAP_VIEW_BOX.width}
                y2={y}
                stroke="rgba(57, 208, 255, 1)"
                strokeWidth="0.5"
                strokeDasharray="6 12"
              />
              <text
                x="16"
                y={y - 4}
                fill="rgba(57, 208, 255, 0.5)"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {lat}°N
              </text>
            </g>
          );
        })}
        {[118, 120, 122, 124, 126].map((lon) => {
          const x = ((lon - 116.5) / 11) * MAP_VIEW_BOX.width;
          return (
            <g key={`lon-${lon}`}>
              <line
                x1={x}
                y1="0"
                x2={x}
                y2={MAP_VIEW_BOX.height}
                stroke="rgba(57, 208, 255, 1)"
                strokeWidth="0.5"
                strokeDasharray="6 12"
              />
              <text
                x={x + 4}
                y="20"
                fill="rgba(57, 208, 255, 0.5)"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {lon}°E
              </text>
            </g>
          );
        })}
      </g>

      {/* Region labels */}
      <g>
        {regionLabels.map((label) => (
          <text
            key={label.id}
            fill={
              label.dim
                ? "rgba(100, 145, 180, 0.35)"
                : "rgba(180, 220, 255, 0.55)"
            }
            fontSize={label.dim ? "18" : "22"}
            letterSpacing={label.dim ? "3px" : "5px"}
            fontWeight={label.dim ? "400" : "500"}
            x={label.x}
            y={label.y}
          >
            {label.text.toUpperCase()}
          </text>
        ))}
      </g>
    </svg>
  );
}
