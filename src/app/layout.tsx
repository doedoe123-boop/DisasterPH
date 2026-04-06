import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegistrar } from "@/components/disasterph/sw-registrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "DisasterPH — Disaster Awareness for Filipinos",
  description:
    "Monitor disasters in the Philippines, check if your loved ones are affected, and know what to do next. Live data from PHIVOLCS, PAGASA, and NASA EONET.",
  metadataBase: new URL("https://disaster-ph.vercel.app"),
  openGraph: {
    title: "DisasterPH — Disaster Awareness for Filipinos",
    description:
      "Monitor disasters in the Philippines, check if your loved ones are affected, and know what to do next.",
    url: "https://disaster-ph.vercel.app",
    siteName: "DisasterPH",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DisasterPH — Real-time disaster monitoring for the Philippines",
      },
    ],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DisasterPH — Disaster Awareness for Filipinos",
    description:
      "Monitor disasters in the Philippines, check if your loved ones are affected, and know what to do next.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#040d16" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)]">
        {children}
        <Analytics />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
