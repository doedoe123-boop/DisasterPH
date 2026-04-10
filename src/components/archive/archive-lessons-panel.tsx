"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface ArchiveLessonsPanelProps {
  lessons: string[];
}

export function ArchiveLessonsPanel({ lessons }: ArchiveLessonsPanelProps) {
  return (
    <section>
      <h2 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)] mb-3">
        Lessons &amp; Preparedness
      </h2>
      <div className="glass-pane rounded-xl p-5 space-y-3">
        {lessons.map((lesson, i) => (
          <motion.div
            key={i}
            className="flex gap-3"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {lesson}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
