import type { Metadata } from "next";
import { cache } from "react";
import { cookies } from "next/headers";
import { DisasterPHCommand } from "@/components/disasterph/disasterph-command";
import { buildIncidentsPayload } from "@/lib/incidents-payload";
import { LOCALE_KEY, normalizeLocale } from "@/lib/i18n";
import { parseViewParams } from "@/lib/view-url";
import { viewPreview } from "@/lib/share-preview";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// One read of the data per request, shared by the page and its link preview.
const getPayload = cache(() => buildIncidentsPayload());

/** Link previews for shared views (?view=bicol, ?event=…): title, source, time. */
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const view = parseViewParams(await searchParams);
  const locale = normalizeLocale((await cookies()).get(LOCALE_KEY)?.value);
  return viewPreview(view, await getPayload(), locale);
}

/**
 * Rendered on the server with the current alerts, so the status summary and
 * the event list arrive as text in the first response. The map (MapLibre)
 * loads afterwards in the browser, with a placeholder meanwhile. A shared
 * link's view (allowed parameters only, see view-url.ts) is applied here too.
 */
export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const [initial, params] = await Promise.all([getPayload(), searchParams]);
  return <DisasterPHCommand initial={initial} initialView={parseViewParams(params)} />;
}
