import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex h-screen items-center justify-center bg-[var(--bg-base)] p-4 text-[var(--text-primary)]">
      {/* Grid texture background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--ui-overlay) / 0.4) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ui-overlay) / 0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Map pin icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-overlay/8 bg-overlay/[0.03]">
          <MapPin className="h-7 w-7 text-[var(--text-dim)]" />
        </div>

        {/* 404 label */}
        <span className="mt-6 text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--text-dim)]">
          404
        </span>

        {/* Heading */}
        <h1 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
          Page not found
        </h1>

        {/* Description */}
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
          The page you&rsquo;re looking for is unavailable or may have moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-orange-500 px-5 py-2 text-[13px] font-medium text-white transition hover:bg-orange-600"
          >
            Go back home
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-overlay/10 px-5 py-2 text-[13px] text-[var(--text-muted)] transition hover:border-overlay/20 hover:text-[var(--text-primary)]"
          >
            Open live map
          </Link>
        </div>
      </div>
    </main>
  );
}
