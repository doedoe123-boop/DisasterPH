import type { Incident } from "@/types/incident";

export type ListSort = "newest" | "severity";

/** Newest first (default), or highest level first. Applies to the list only. */
export function sortForList(incidents: Incident[], sort: ListSort): Incident[] {
  const rank: Record<string, number> = { critical: 3, warning: 2, watch: 1, advisory: 0 };
  const time = (i: Incident) => Date.parse(i.updated_at) || 0;
  return [...incidents].sort((a, b) =>
    sort === "severity"
      ? (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0) || time(b) - time(a)
      : time(b) - time(a) || (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0),
  );
}
