"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Tv, Radio, Landmark, Sun, Moon } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { useTheme } from "@/hooks/useTheme";

const NAV_ITEMS = [
  { labelKey: "live", subKey: "liveSub", href: "/", icon: Tv },
  { labelKey: "pulse", subKey: "pulseSub", href: "/pulse", icon: Radio },
  {
    labelKey: "sanctuary",
    subKey: "sanctuarySub",
    href: "/shelters",
    icon: Landmark,
  },
  // { label: "Archive", sub: "Event History", href: "/archive", icon: BookOpen },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const i18n = t(locale);

  return (
    <>
      {/* ── Desktop Header ── */}
      <header className="hidden md:flex items-center justify-between border-b border-overlay/10 bg-[var(--bg-base)] px-5 py-1.5">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/15 shadow-[0_0_12px_rgba(255,140,66,0.15)] transition group-hover:shadow-[0_0_18px_rgba(255,140,66,0.25)]">
            <Shield className="h-[18px] w-[18px] text-orange-400" />
          </div>
          <div className="leading-none">
            <span className="text-[15px] font-extrabold tracking-tight text-[var(--text-primary)] uppercase">
              Disaster<span className="text-orange-400"> PH</span>
            </span>
            <p className="text-[10px] font-medium tracking-[0.18em] text-[var(--text-dim)] uppercase mt-0.5">
              {i18n.nav.commandCenter}
            </p>
          </div>
        </Link>

        {/* Center: Navigation tabs */}
        <nav className="flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm transition-all duration-200 ${
                  active
                    ? "bg-orange-500/12 text-orange-300"
                    : "text-[var(--text-muted)] hover:bg-overlay/6 hover:text-[var(--text-primary)]"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg border border-orange-500/40 bg-orange-500/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  <Icon
                    className={`h-[20px] w-[20px] ${active ? "text-orange-400" : ""}`}
                  />
                  <div className="leading-tight">
                    <span
                      className={`text-md font-semibold ${active ? "text-orange-300" : ""}`}
                    >
                      {i18n.nav[item.labelKey]}
                    </span>
                    <p className="text-sm font-medium text-[var(--text-dim)] tracking-wide">
                      {i18n.nav[item.subKey]}
                    </p>
                  </div>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: LIVE indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 items-center rounded-full border border-overlay/10 bg-overlay/[0.04] p-1">
            {(["en", "fil"] as const).map((mode) => (
              <button
                key={mode}
                className={`h-7 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                  locale === mode
                    ? "bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.1)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
                onClick={() => setLocale(mode)}
                type="button"
              >
                {mode === "fil" ? "Fil" : "Eng"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "day" ? "night" : "day")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-overlay/10 bg-overlay/[0.04] text-[var(--text-muted)] transition hover:bg-overlay/8 hover:text-[var(--text-primary)]"
            title={`Switch to ${theme === "day" ? "night" : "day"} mode`}
          >
            {theme === "day" ? (
              <Moon className="h-[18px] w-[18px]" />
            ) : (
              <Sun className="h-[18px] w-[18px]" />
            )}
          </button>
          <div className="flex items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-4 py-1.5 shadow-[0_0_12px_rgba(57,217,138,0.08)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(57,217,138,0.5)]" />
            </span>
            <span className="text-[12px] font-bold tracking-[0.15em] text-emerald-300 uppercase">
              {i18n.nav.live}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile Header (compact) ── */}
      <header className="flex md:hidden items-center justify-between border-b border-overlay/10 bg-[var(--bg-base)] px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/15">
            <Shield className="h-4 w-4 text-orange-400" />
          </div>
          <span className="text-[14px] font-extrabold tracking-tight text-[var(--text-primary)] uppercase">
            Disaster<span className="text-orange-400"> PH</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-300 uppercase">
            {i18n.nav.live}
          </span>
        </div>
        <button
          className="flex h-8 min-w-12 items-center justify-center rounded-lg border border-overlay/10 bg-overlay/[0.04] px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:bg-overlay/8 hover:text-[var(--text-primary)]"
          onClick={() => setLocale(locale === "fil" ? "en" : "fil")}
          title={`Switch to ${locale === "fil" ? "English" : "Filipino"}`}
          type="button"
        >
          {locale === "fil" ? "Fil" : "Eng"}
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-overlay/10 bg-overlay/[0.04] text-[var(--text-muted)] transition hover:bg-overlay/8 hover:text-[var(--text-primary)]"
          onClick={() => setTheme(theme === "day" ? "night" : "day")}
          title={`Switch to ${theme === "day" ? "night" : "day"} mode`}
          type="button"
        >
          {theme === "day" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>
      </header>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-[998] flex md:hidden border-t border-overlay/10 bg-[var(--bg-panel)] backdrop-blur-md safe-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-colors ${
                active ? "text-orange-400" : "text-[var(--text-dim)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {i18n.nav[item.labelKey]}
              </span>
              {active && (
                <motion.div
                  layoutId="mobileTab"
                  className="absolute top-0 h-[2px] w-12 rounded-full bg-orange-400"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
