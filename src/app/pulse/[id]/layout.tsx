import type { Metadata } from "next";
import { cookies } from "next/headers";
import { buildIncidentsPayload } from "@/lib/incidents-payload";
import { LOCALE_KEY, normalizeLocale } from "@/lib/i18n";
import { eventPreview } from "@/lib/share-preview";

/**
 * Link preview for an event page (the page itself renders in the browser):
 * the event's title, its source and its time. An unknown id keeps the
 * site's default preview.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  let decoded = id;
  try {
    decoded = decodeURIComponent(id);
  } catch {
    return {};
  }
  const payload = await buildIncidentsPayload();
  const incident = payload.data.find((i) => i.id === decoded);
  if (!incident) return {};
  const locale = normalizeLocale((await cookies()).get(LOCALE_KEY)?.value);
  return eventPreview(incident, locale, `/pulse/${encodeURIComponent(incident.id)}`);
}

export default function PulseEventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
