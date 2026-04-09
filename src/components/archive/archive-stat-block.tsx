"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatBlockProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color?: string;
  note?: string;
}

export function ArchiveStatBlock({
  icon: Icon,
  label,
  value,
  color = "text-white",
  note,
}: StatBlockProps) {
  return (
    <motion.div
      className="glass-pane rounded-xl p-4 flex flex-col gap-1"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-1.5 text-[var(--text-dim)] mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-mono uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className={`text-xl font-bold font-mono ${color}`}>{value}</span>
      {note && (
        <span className="text-[9px] font-mono text-[var(--text-dim)]">
          {note}
        </span>
      )}
    </motion.div>
  );
}
