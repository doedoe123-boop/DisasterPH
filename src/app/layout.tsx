import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

export const metadata: Metadata = {
  title: "DisasterPh",
  description: "Disaster awareness and emergency support for the Philippines.",
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
