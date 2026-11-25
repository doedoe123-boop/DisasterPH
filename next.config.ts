import type { NextConfig } from "next";

// maplibre-gl v6 ships ESM and loads its worker via setWorkerUrl
// (src/lib/maplibre-loader.ts), so it no longer needs transpilePackages.
const nextConfig: NextConfig = {
  images: {
    // Only our relayed PHIVOLCS epicentre maps go through the image optimizer
    // (no query strings, no other local paths, no remote hosts).
    localPatterns: [{ pathname: "/api/quake-map/**", search: "" }],
  },
};

export default nextConfig;
