"use client";

import { Landmark } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

/** DisasterPH is a convenience layer; the official agencies are the authority. */
export function SiteDisclaimer({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  return (
    <p className={`flex items-start gap-2 text-[11.5px] leading-5 text-[var(--text-dim)] ${className}`}>
      <Landmark aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{t(locale).disclaimer}</span>
    </p>
  );
}
