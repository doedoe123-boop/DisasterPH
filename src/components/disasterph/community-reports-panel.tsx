"use client";

import { useState } from "react";
import {
  ChevronDown,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Droplets,
  Mountain,
  Zap,
  Users,
  HardHat,
  CircleDot,
  Send,
} from "lucide-react";
import { formatShortTime } from "@/lib/incidents";
import type {
  CommunityReport,
  ReportCategory,
  ReportStatus,
} from "@/types/incident";
import { LocationSearch, type GeocodingResult } from "./location-search";

// ── Constants ──

const CATEGORY_META: Record<
  ReportCategory,
  { label: string; icon: typeof AlertTriangle }
> = {
  blocked_road: { label: "Blocked Road", icon: AlertTriangle },
  flooding: { label: "Flooding", icon: Droplets },
  landslide: { label: "Landslide", icon: Mountain },
  power_outage: { label: "Power Outage", icon: Zap },
  evacuation: { label: "Evacuation", icon: Users },
  damage: { label: "Damage", icon: HardHat },
  other: { label: "Other", icon: CircleDot },
};

const STATUS_VISUAL: Record<
  ReportStatus,
  { label: string; dot: string; tone: string; Icon: typeof Clock }
> = {
  pending: {
    label: "Pending Review",
    dot: "bg-amber-400",
    tone: "text-amber-300",
    Icon: Clock,
  },
  approved: {
    label: "Approved",
    dot: "bg-emerald-400",
    tone: "text-emerald-300",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-400",
    tone: "text-red-300",
    Icon: XCircle,
  },
};

// ── Props ──

interface CommunityReportsProps {
  reports: CommunityReport[];
  onAddReport: (
    report: Omit<CommunityReport, "id" | "createdAt" | "updatedAt" | "status">,
  ) => void;
  onModerate: (
    id: string,
    decision: { status: ReportStatus; reason: string; moderator: string },
  ) => void;
  onRemove: (id: string) => void;
}

// ── Submission Form ──

function ReportForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: CommunityReportsProps["onAddReport"];
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<ReportCategory>("flooding");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<GeocodingResult | null>(null);

  function handleSubmit() {
    if (!title.trim() || !selectedLocation || !reporterName.trim()) return;

    onSubmit({
      category,
      title: title.trim(),
      description: description.trim(),
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      locationLabel: selectedLocation.label,
      reporterName: reporterName.trim(),
    });

    // Reset
    setTitle("");
    setDescription("");
    setCategory("flooding");
    setSelectedLocation(null);
  }

  const canSubmit =
    title.trim().length > 0 &&
    reporterName.trim().length > 0 &&
    selectedLocation !== null;

  return (
    <div className="space-y-3 rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-2.5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">
        New Report
      </p>

      {/* Reporter name */}
      <input
        className="w-full rounded-md border border-overlay/10 bg-overlay/5 px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-overlay/30 focus:border-cyan-400/30 focus:outline-none"
        placeholder="Your name (internal)"
        value={reporterName}
        onChange={(e) => setReporterName(e.target.value)}
        maxLength={50}
      />

      {/* Category selector */}
      <div className="grid grid-cols-4 gap-1">
        {(
          Object.entries(CATEGORY_META) as [
            ReportCategory,
            typeof CATEGORY_META.flooding,
          ][]
        ).map(([key, meta]) => {
          const Icon = meta.icon;
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              className={`flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-center transition ${
                active
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                  : "border-overlay/6 bg-overlay/[0.02] text-[var(--text-dim)] hover:bg-overlay/5"
              }`}
              onClick={() => setCategory(key)}
            >
              <Icon className="h-3 w-3" />
              <span className="text-[8px] leading-tight">{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Title */}
      <input
        className="w-full rounded-md border border-overlay/10 bg-overlay/5 px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-overlay/30 focus:border-cyan-400/30 focus:outline-none"
        placeholder="Brief title (e.g. Road flooded near market)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
      />

      {/* Description */}
      <textarea
        className="w-full rounded-md border border-overlay/10 bg-overlay/5 px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-overlay/30 focus:border-cyan-400/30 focus:outline-none"
        placeholder="Details (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        maxLength={500}
      />

      {/* Location search */}
      <LocationSearch
        selected={selectedLocation}
        onSelect={setSelectedLocation}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          className="rounded-md px-2.5 py-1 text-[10px] text-[var(--text-dim)] transition hover:text-[var(--text-primary)]"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          className="flex items-center gap-1 rounded-md bg-cyan-500/20 px-3 py-1 text-[10px] font-medium text-cyan-200 transition hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleSubmit}
        >
          <Send className="h-2.5 w-2.5" />
          Submit
        </button>
      </div>
    </div>
  );
}

// ── Report Card ──

function ReportCard({
  report,
  expanded,
  onToggle,
  onModerate,
  onRemove,
}: {
  report: CommunityReport;
  expanded: boolean;
  onToggle: () => void;
  onModerate: CommunityReportsProps["onModerate"];
  onRemove: () => void;
}) {
  const [moderationReason, setModerationReason] = useState("");
  const meta = CATEGORY_META[report.category];
  const vis = STATUS_VISUAL[report.status];
  const StatusIcon = vis.Icon;
  const CatIcon = meta.icon;

  return (
    <div className="rounded-md border border-overlay/6 bg-overlay/[0.02]">
      {/* Header — always visible */}
      <button
        type="button"
        className="flex w-full items-start gap-2 px-2.5 py-2 text-left"
        onClick={onToggle}
      >
        <CatIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-dim)]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[12px] text-[var(--text-primary)]">
              {report.title}
            </span>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${vis.dot}`} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]">
            <span>{meta.label}</span>
            <span className="text-overlay/10">·</span>
            <span>{report.locationLabel}</span>
            <span className="text-overlay/10">·</span>
            <span suppressHydrationWarning>
              {formatShortTime(report.createdAt)}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`mt-1 h-3 w-3 shrink-0 text-[var(--text-dim)] transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded detail + moderation */}
      {expanded && (
        <div className="border-t border-overlay/6 px-2.5 py-2 space-y-2">
          {/* Status + reporter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <StatusIcon className={`h-3 w-3 ${vis.tone}`} />
              <span className={`text-[10px] ${vis.tone}`}>{vis.label}</span>
            </div>
            <span className="text-[10px] text-[var(--text-dim)]">
              by {report.reporterName}
            </span>
          </div>

          {/* Description */}
          {report.description && (
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
              {report.description}
            </p>
          )}

          {/* Moderation outcome (if already moderated) */}
          {report.moderatedAt && (
            <div
              className="rounded-md border border-overlay/6 bg-overlay/[0.02] px-2 py-1.5 text-[10px] text-[var(--text-dim)]"
              suppressHydrationWarning
            >
              <span className="font-medium text-overlay/70">
                {report.status === "approved" ? "Approved" : "Rejected"}
              </span>{" "}
              by {report.moderatedBy} · {formatShortTime(report.moderatedAt)}
              {report.moderationReason && (
                <p className="mt-0.5 italic">{report.moderationReason}</p>
              )}
            </div>
          )}

          {/* Moderation controls (only for pending reports) */}
          {report.status === "pending" && (
            <div className="space-y-1.5">
              <input
                className="w-full rounded-md border border-overlay/10 bg-overlay/5 px-2 py-1 text-[10px] text-[var(--text-primary)] placeholder:text-overlay/30 focus:border-cyan-400/30 focus:outline-none"
                placeholder="Reason (optional)"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                maxLength={200}
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-[10px] text-emerald-300 transition hover:bg-emerald-500/25"
                  onClick={() => {
                    onModerate(report.id, {
                      status: "approved",
                      reason: moderationReason,
                      moderator: "Moderator",
                    });
                    setModerationReason("");
                  }}
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Approve
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md bg-red-500/15 px-2.5 py-1 text-[10px] text-red-300 transition hover:bg-red-500/25"
                  onClick={() => {
                    onModerate(report.id, {
                      status: "rejected",
                      reason: moderationReason,
                      moderator: "Moderator",
                    });
                    setModerationReason("");
                  }}
                >
                  <XCircle className="h-2.5 w-2.5" />
                  Reject
                </button>
                <button
                  type="button"
                  className="ml-auto rounded-md px-2 py-1 text-[10px] text-red-400/60 transition hover:text-red-300"
                  onClick={onRemove}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ──

export function CommunityReportsPanel({
  reports,
  onAddReport,
  onModerate,
  onRemove,
}: CommunityReportsProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="shrink-0">
      {/* Collapsible header */}
      <button
        className="flex w-full items-center justify-between rounded-lg border border-overlay/8 bg-[var(--bg-panel)] px-3 py-2 text-left"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Community Reports
        </span>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400/20 px-1 text-[9px] font-medium text-amber-300">
              {pendingCount}
            </span>
          )}
          <span className="text-[11px] text-[var(--text-dim)]">
            {reports.length} total
          </span>
          <ChevronDown
            className={`h-3 w-3 text-[var(--text-dim)] transition ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="mt-1 max-h-80 overflow-y-auto rounded-lg border border-overlay/8 bg-[var(--bg-panel)] p-2">
          {/* Internal prototype badge */}
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[8px] uppercase tracking-wider text-amber-300">
              Internal Prototype
            </span>
            <button
              type="button"
              className="flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-1 text-[10px] text-cyan-300 transition hover:bg-cyan-500/25"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? (
                <X className="h-2.5 w-2.5" />
              ) : (
                <Plus className="h-2.5 w-2.5" />
              )}
              {showForm ? "Cancel" : "New Report"}
            </button>
          </div>

          {/* Submission form */}
          {showForm && (
            <div className="mb-2">
              <ReportForm
                onSubmit={(r) => {
                  onAddReport(r);
                  setShowForm(false);
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Report list */}
          {reports.length > 0 ? (
            <div className="space-y-1">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  expanded={expandedId === report.id}
                  onToggle={() =>
                    setExpandedId(expandedId === report.id ? null : report.id)
                  }
                  onModerate={onModerate}
                  onRemove={() => onRemove(report.id)}
                />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-[11px] text-[var(--text-dim)]">
              No community reports yet. Tap &quot;New Report&quot; to submit
              one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
