/**
 * Load MapLibre GL JS v6 in the browser.
 *
 * v6 is ESM-only and runs its tile worker from a separate module file. With a
 * bundler, the worker URL must be set once before creating a map. Next.js
 * (Turbopack and webpack) emits the referenced file as a hashed static asset.
 */
let loading: Promise<typeof import("maplibre-gl")> | null = null;

export function loadMapLibre(): Promise<typeof import("maplibre-gl")> {
  loading ??= import("maplibre-gl")
    .then((maplibregl) => {
      maplibregl.setWorkerUrl(
        new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
      );
      return maplibregl;
    })
    .catch((error: unknown) => {
      loading = null; // allow a retry after a failed chunk load
      throw error;
    });
  return loading;
}
