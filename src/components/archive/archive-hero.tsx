"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export function ArchiveHero() {
  return (
    <div className="relative border-b border-white/8 py-10 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-base)] via-[var(--bg-base)] to-white/[0.02] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <motion.div
        className="relative max-w-5xl mx-auto"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-orange-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400">
            Disaster Archive
          </span>
          <span className="text-[10px] font-mono text-[var(--text-dim)] ml-2 hidden sm:inline">
            {"// Historical Intelligence"}
          </span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2">
          Event History
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-lg leading-relaxed">
          Structured archive of significant Philippine disaster events — sourced
          from NDRRMC, PHIVOLCS, PAGASA, and international agencies.
        </p>
      </motion.div>
    </div>
  );
}
