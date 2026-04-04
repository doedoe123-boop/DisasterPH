import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DisasterPH",
  description:
    "Map-first disaster awareness and alert dashboard for the Philippines.",
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
      </body>
    </html>
  );
}
