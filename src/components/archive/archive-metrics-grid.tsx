"use client";

import {
  AlertTriangle,
  Users,
  DollarSign,
  Clock,
  Activity,
} from "lucide-react";
import { ArchiveStatBlock } from "./archive-stat-block";
import type { ArchiveEvent } from "@/types/archive";
import { computeDuration } from "@/lib/archive";

interface ArchiveMetricsGridProps {
  event: ArchiveEvent;
}

export function ArchiveMetricsGrid({ event }: ArchiveMetricsGridProps) {
  const duration = computeDuration(event.startDate, event.endDate);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {event.deathToll != null && (
        <ArchiveStatBlock
          icon={AlertTriangle}
          label="Deaths"
          value={event.deathToll.toLocaleString()}
          color="text-red-400"
          note="Confirmed — NDRRMC"
        />
      )}
      {event.displacedCount != null && (
        <ArchiveStatBlock
          icon={Users}
          label="Displaced"
          value={`${
            event.displacedCount >= 1000000
              ? `${(event.displacedCount / 1000000).toFixed(0)}M`
              : `${(event.displacedCount / 1000).toFixed(0)}K`
          }`}
          color="text-yellow-400"
          note="Estimated"
        />
      )}
      {event.damagePhpBillion != null && (
        <ArchiveStatBlock
          icon={DollarSign}
          label="Damage"
          value={`₱${event.damagePhpBillion}B`}
          color="text-orange-400"
          note="Estimated — NEDA"
        />
      )}
      <ArchiveStatBlock icon={Clock} label="Duration" value={duration} />
      {event.magnitude != null && (
        <ArchiveStatBlock
          icon={Activity}
          label={event.hazardType === "earthquake" ? "Magnitude" : "Signal"}
          value={String(event.magnitude)}
          color="text-orange-400"
          note={
            event.hazardType === "earthquake"
              ? "Source: PHIVOLCS"
              : "Source: PAGASA"
          }
        />
      )}
    </div>
  );
}
