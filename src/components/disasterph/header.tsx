"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Radio, Rss, Building2 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Live", sub: "Live Monitoring", href: "/", icon: Radio },
  { label: "Pulse", sub: "Alert Feed", href: "/pulse", icon: Rss },
  { label: "Sanctuary", sub: "Shelters", href: "/shelters", icon: Building2 },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop Header ── */}
      <header className="hidden md:flex items-center justify-between border-b border-white/10 bg-[var(--bg-panel-strong)] px-5 py-2.5">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/15 shadow-[0_0_12px_rgba(255,140,66,0.15)] transition group-hover:shadow-[0_0_18px_rgba(255,140,66,0.25)]">
            <Shield className="h-[18px] w-[18px] text-orange-400" />
          </div>
          <div className="leading-none">
            <span className="text-[15px] font-extrabold tracking-tight text-white uppercase">
              Disaster<span className="text-orange-400"> PH</span>
            </span>
            <p className="text-[10px] font-medium tracking-[0.18em] text-[var(--text-dim)] uppercase mt-0.5">
              National Command Center
            </p>
          </div>
        </Link>

        {/* Center: Navigation tabs */}
        <nav className="flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm transition-all duration-200 ${
                  active
                    ? "bg-orange-500/12 text-orange-300"
                    : "text-[var(--text-muted)] hover:bg-white/6 hover:text-white"
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
                    className={`h-[18px] w-[18px] ${active ? "text-orange-400" : ""}`}
                  />
                  <div className="leading-tight">
                    <span
                      className={`text-[14px] font-semibold ${active ? "text-orange-300" : ""}`}
                    >
                      {item.label}
                    </span>
                    <p className="text-[10px] font-medium text-[var(--text-dim)] tracking-wide">
                      {item.sub}
                    </p>
                  </div>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: LIVE indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-4 py-1.5 shadow-[0_0_12px_rgba(57,217,138,0.08)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(57,217,138,0.5)]" />
            </span>
            <span className="text-[12px] font-bold tracking-[0.15em] text-emerald-300 uppercase">
              Live
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile Header (compact) ── */}
      <header className="flex md:hidden items-center justify-between border-b border-white/10 bg-[var(--bg-panel-strong)] px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/15">
            <Shield className="h-4 w-4 text-orange-400" />
          </div>
          <span className="text-[14px] font-extrabold tracking-tight text-white uppercase">
            Disaster<span className="text-orange-400"> PH</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-300 uppercase">
            Live
          </span>
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-[998] flex md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-md safe-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

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
                {item.label}
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
