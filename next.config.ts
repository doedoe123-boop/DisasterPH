import type { NextConfig } from "next";

// maplibre-gl v6 ships ESM and loads its worker via setWorkerUrl
// (src/lib/maplibre-loader.ts), so it no longer needs transpilePackages.
const nextConfig: NextConfig = {
  // Link-preview crawlers get the page's metadata in the <head> before the
  // body (not streamed). Next's default list plus Viber and Telegram, so a
  // shared map link shows its title, source and time there too.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Viber|TelegramBot/i,
  images: {
    // Only our relayed PHIVOLCS epicentre maps go through the image optimizer
    // (no query strings, no other local paths, no remote hosts).
    localPatterns: [{ pathname: "/api/quake-map/**", search: "" }],
  },
};

export default nextConfig;
