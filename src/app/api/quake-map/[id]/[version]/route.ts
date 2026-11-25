import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getIncidentById } from "@/lib/ingest/store";
import { bulletinVersion, loadEqBulletin } from "@/lib/ingest/phivolcs-eq-bulletin";
import { fetchPhivolcs } from "@/lib/ingest/https-text";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

/**
 * The PHIVOLCS epicentre map for one earthquake, relayed from PHIVOLCS.
 *
 * Browsers would load it from PHIVOLCS directly, but that server leaves out
 * part of its certificate chain (some in-app browsers then show a broken
 * image) and the file is ~800 KB; this route fetches it over verified HTTPS
 * and the page shows it through next/image, which resizes and caches it.
 *
 * Only the map named in the current bulletin of an earthquake we list is
 * served: `id` must be a listed PHIVOLCS earthquake and `version` its current
 * bulletin file name, so the route cannot be pointed at any other URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; version: string }> },
) {
  const { id: rawId, version } = await params;
  const id = decodeURIComponent(rawId);
  if (!/^PHIVOLCS:[\w.-]{1,80}$/.test(id) || !/^[\w-]{1,64}$/.test(version)) return notFound();

  await ensureFreshData();
  const incident = getIncidentById(id);
  if (!incident || incident.event_type !== "earthquake") return notFound();
  const bulletinUrl = incident.metadata.bulletin_url;
  if (typeof bulletinUrl !== "string" || bulletinVersion(bulletinUrl) !== version) return notFound();

  const bulletin = await loadEqBulletin(bulletinUrl);
  if (!bulletin?.mapUrl) return notFound();

  try {
    const res = await fetchPhivolcs(bulletin.mapUrl, {
      accept: "image/jpeg",
      timeoutMs: 15_000,
      maxBytes: MAX_IMAGE_BYTES,
    });
    const body = res.body;
    const isJpeg = body.length > 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
    if (res.status !== 200 || !/^image\/jpe?g\b/i.test(res.contentType) || !isJpeg) {
      return new Response("Map unavailable", { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(body.length),
        // One bulletin version = one image; revisions get a new URL.
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Map unavailable", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
