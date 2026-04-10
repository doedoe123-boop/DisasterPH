import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegistrar } from "@/components/disasterph/sw-registrar";
import { THEME_KEY, type Theme } from "@/lib/theme";
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
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

function normalizeTheme(value: string | undefined): Theme {
  return value === "day" || value === "night" ? value : "night";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = normalizeTheme(
    (await cookies()).get(THEME_KEY)?.value,
  );
  const themeScript = `(function(){try{var serverTheme='${theme}';var key='${THEME_KEY}';var stored=localStorage.getItem(key);var storedTheme=stored==='day'||stored==='night'?stored:null;var cookieMatch=document.cookie.match(/(?:^|; )disasterph-theme=(day|night)/);var cookieTheme=cookieMatch?cookieMatch[1]:null;var theme=cookieTheme||serverTheme;if(!cookieTheme&&storedTheme){document.cookie=key+'='+storedTheme+'; path=/; max-age=31536000; SameSite=Lax';}if(cookieTheme){localStorage.setItem(key,cookieTheme);}document.documentElement.setAttribute('data-theme',theme);document.documentElement.style.colorScheme=theme==='day'?'light':'dark';}catch(e){document.documentElement.setAttribute('data-theme','${theme}');document.documentElement.style.colorScheme='${theme}'==='day'?'light':'dark';}})();`;

  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme={theme}
      style={{ colorScheme: theme === "day" ? "light" : "dark" }}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
        <meta name="theme-color" content="#040d16" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)]">
        {children}
        <Analytics />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
