"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Radio, Rss, Building2 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Sentinel", sub: "Live Monitoring", href: "/", icon: Shield },
  { label: "Pulse", sub: "Alert Feed", href: "/pulse", icon: Rss },
  { label: "Sanctuary", sub: "Shelters", href: "/shelters", icon: Building2 },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b border-white/8 bg-[var(--bg-panel-strong)] px-4 py-2">
      {/* ── Left: Logo / branding ── */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/15">
          <Shield className="h-4 w-4 text-orange-400" />
        </div>
        <div className="leading-none">
          <span className="text-sm font-bold tracking-tight text-white uppercase">
            Sentinel
          </span>
          <p className="text-[10px] tracking-wider text-[var(--text-dim)] uppercase">
            Disaster Watch PH
          </p>
        </div>
      </div>

      {/* ── Center: Navigation ── */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
                active
                  ? "border border-orange-500/30 bg-orange-500/10 text-orange-400"
                  : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <div className="leading-tight">
                <span
                  className={`font-medium ${active ? "text-orange-400" : ""}`}
                >
                  {item.label}
                </span>
                <p className="text-[10px] text-[var(--text-dim)]">{item.sub}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Right: LIVE indicator ── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
