import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
