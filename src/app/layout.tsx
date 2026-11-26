import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegistrar } from "@/components/disasterph/sw-registrar";
import { ServerLocaleProvider } from "@/hooks/useLocale";
import { LOCALE_KEY, normalizeLocale } from "@/lib/i18n";
import { THEME_KEY, type Theme } from "@/lib/theme";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-meta";
import "./globals.css";

export const metadata: Metadata = {
  // Never "affected" or "safe": the site shows official alerts near places,
  // not whether people there are okay.
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://disaster-ph.vercel.app"),
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://disaster-ph.vercel.app",
    siteName: "DisasterPH",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DisasterPH: official hazard information for the Philippines on a map",
      },
    ],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
  const locale = normalizeLocale((await cookies()).get(LOCALE_KEY)?.value);
  const themeScript = `(function(){try{var serverTheme='${theme}';var key='${THEME_KEY}';var stored=localStorage.getItem(key);var storedTheme=stored==='day'||stored==='night'?stored:null;var cookieMatch=document.cookie.match(/(?:^|; )disasterph-theme=(day|night)/);var cookieTheme=cookieMatch?cookieMatch[1]:null;var theme=cookieTheme||serverTheme;if(!cookieTheme&&storedTheme){document.cookie=key+'='+storedTheme+'; path=/; max-age=31536000; SameSite=Lax';}if(cookieTheme){localStorage.setItem(key,cookieTheme);}document.documentElement.setAttribute('data-theme',theme);document.documentElement.style.colorScheme=theme==='day'?'light':'dark';}catch(e){document.documentElement.setAttribute('data-theme','${theme}');document.documentElement.style.colorScheme='${theme}'==='day'?'light':'dark';}})();`;
  const localeScript = `(function(){try{var serverLocale='${locale}';var key='${LOCALE_KEY}';var stored=localStorage.getItem(key);var storedLocale=stored==='fil'||stored==='en'?stored:null;var cookieMatch=document.cookie.match(/(?:^|; )disasterph-locale=(fil|en)/);var cookieLocale=cookieMatch?cookieMatch[1]:null;var locale=cookieLocale||serverLocale;if(!cookieLocale&&storedLocale){document.cookie=key+'='+storedLocale+'; path=/; max-age=31536000; SameSite=Lax';}if(cookieLocale){localStorage.setItem(key,cookieLocale);}document.documentElement.setAttribute('data-locale',locale);}catch(e){document.documentElement.setAttribute('data-locale','${locale}');}})();`;

  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme={theme}
      data-locale={locale}
      style={{ colorScheme: theme === "day" ? "light" : "dark" }}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `${themeScript}${localeScript}`,
          }}
        />
        <meta name="theme-color" content="#040d16" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)]">
        <ServerLocaleProvider locale={locale}>{children}</ServerLocaleProvider>
        <Analytics />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
