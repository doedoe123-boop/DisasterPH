import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex h-screen items-center justify-center bg-background p-4 text-foreground">
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/30">
          <MapPin className="h-7 w-7 text-muted-foreground" />
        </div>

        {/* 404 label */}
        <span className="mt-6 text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--text-muted)]">
          4 0 4
        </span>

        {/* Heading */}
        <h1 className="mt-2 text-xl font-semibold text-foreground">
          Page not found
        </h1>

        {/* Description */}
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
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
            className="rounded-lg border border-border px-5 py-2 text-[13px] text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
          >
            Open live map
          </Link>
        </div>
      </div>
    </main>
  );
}
