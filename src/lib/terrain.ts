import type { Map as MlMap } from "maplibre-gl";

/**
 * Opt-in 3D terrain (audit PR 3). Disabled unless a licensed DEM tile source
 * is configured, so the default experience makes no DEM requests:
 *
 *   NEXT_PUBLIC_TERRAIN_DEM_TILES        https://…/{z}/{x}/{y}.png  (required)
 *   NEXT_PUBLIC_TERRAIN_DEM_ENCODING     "terrarium" (default) | "mapbox"
 *   NEXT_PUBLIC_TERRAIN_DEM_ATTRIBUTION  attribution text required by the provider
 *
 * Choosing a provider (licence, attribution, coverage, tile cost) is an owner
 * decision; see the PR notes.
 */

export interface TerrainConfig {
  tiles: string;
  encoding: "terrarium" | "mapbox";
  attribution: string;
}

export const TERRAIN_SOURCE = "terrain-dem";
export const TERRAIN_PITCH = 45;

export function parseTerrainConfig(env: {
  tiles?: string;
  encoding?: string;
  attribution?: string;
}): TerrainConfig | null {
  const tiles = env.tiles?.trim();
  if (!tiles || !tiles.includes("{z}") || !tiles.includes("{x}") || !tiles.includes("{y}")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(tiles.replace(/\{[xyz]\}/g, "0"));
  } catch {
    return null;
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return null;
  return {
    tiles,
    encoding: env.encoding === "mapbox" ? "mapbox" : "terrarium",
    attribution: env.attribution?.trim() ?? "",
  };
}

/** Build-time configuration (NEXT_PUBLIC_* values are inlined by Next.js). */
export const TERRAIN_CONFIG: TerrainConfig | null = parseTerrainConfig({
  tiles: process.env.NEXT_PUBLIC_TERRAIN_DEM_TILES,
  encoding: process.env.NEXT_PUBLIC_TERRAIN_DEM_ENCODING,
  attribution: process.env.NEXT_PUBLIC_TERRAIN_DEM_ATTRIBUTION,
});

/** Add the DEM source (lazily, on first use) and turn terrain on. */
export function enableTerrain(map: MlMap, config: TerrainConfig, animate = true): void {
  if (!map.getSource(TERRAIN_SOURCE)) {
    map.addSource(TERRAIN_SOURCE, {
      type: "raster-dem",
      tiles: [config.tiles],
      tileSize: 256,
      encoding: config.encoding,
      maxzoom: 15,
      ...(config.attribution && { attribution: config.attribution }),
    });
  }
  map.setTerrain({ source: TERRAIN_SOURCE, exaggeration: 1 });
  if (animate) map.easeTo({ pitch: TERRAIN_PITCH, duration: 600 });
}

/** Back to the flat, north-up map. */
export function disableTerrain(map: MlMap): void {
  map.setTerrain(null);
  map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
}
