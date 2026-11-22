import type { NextConfig } from "next";

// maplibre-gl v6 ships ESM and loads its worker via setWorkerUrl
// (src/lib/maplibre-loader.ts), so it no longer needs transpilePackages.
const nextConfig: NextConfig = {};

export default nextConfig;
