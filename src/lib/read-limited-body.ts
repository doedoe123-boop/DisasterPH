/**
 * Read a JSON request body with a hard byte limit enforced while reading.
 *
 * - A declared Content-Length above the limit is rejected before reading.
 * - Otherwise bytes are counted as chunks arrive. As soon as the total
 *   exceeds the limit the stream is cancelled and nothing more is read, so
 *   bodies without Content-Length (chunked) and multibyte text are bounded by
 *   bytes, not characters.
 */

export type LimitedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: "invalid_json" | "payload_too_large" };

const TOO_LARGE = { ok: false, status: 413, error: "payload_too_large" } as const;
const INVALID = { ok: false, status: 400, error: "invalid_json" } as const;

export async function readJsonWithLimit(
  request: Request,
  maxBytes: number,
): Promise<LimitedJsonResult> {
  const declared = request.headers.get("content-length");
  if (declared !== null && /^\d+$/.test(declared) && Number(declared) > maxBytes) {
    try {
      await request.body?.cancel();
    } catch {
      /* already closed */
    }
    return TOO_LARGE;
  }

  const body = request.body;
  if (!body) return INVALID;

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return TOO_LARGE;
      }
      chunks.push(value);
    }
  } catch {
    return INVALID;
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return INVALID;
  }
}
