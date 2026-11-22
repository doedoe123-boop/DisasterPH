"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Phone } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import {
  AGENCY_LINES,
  EMERGENCY_NUMBER,
  formatReviewedOn,
  type AgencyLine,
} from "@/lib/hotlines";

function AgencyCard({ line }: { line: AgencyLine }) {
  const { locale } = useLocale();
  const copy = t(locale).hotlines;
  return (
    <motion.a
      href={`tel:${line.dial}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="block rounded-xl border border-overlay/10 bg-overlay/[0.03] px-3 py-3 md:px-4 md:py-3.5 transition-colors hover:border-cyan-400/25 hover:bg-overlay/[0.06] active:bg-overlay/[0.06]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
        {copy.agencyLabel}
      </p>
      <p className="mt-1 md:mt-1.5 text-[14px] md:text-[16px] font-bold leading-snug text-[var(--text-primary)]">
        {line.name}
      </p>
      <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-dim)]">
        {copy.purpose[line.purpose]}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] md:text-[15px] font-semibold text-cyan-400">
        <Phone className="h-3.5 w-3.5" />
        {line.number}
      </p>
    </motion.a>
  );
}

export function EmergencyContacts() {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const copy = t(locale).hotlines;

  return (
    <>
      {/* Fixed bottom overlay — sits above mobile bottom tab bar */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-[999] flex flex-col">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-overlay/8 bg-[var(--bg-panel)] backdrop-blur-md max-h-[60vh] overflow-y-auto"
            >
              <div className="px-4 py-4 md:px-5 md:py-5">
                {/* The emergency number comes first and stands apart */}
                <a
                  href={`tel:${EMERGENCY_NUMBER.dial}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/12 px-4 py-3.5 transition hover:bg-red-500/20"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
                      {copy.emergencyTitle}
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-[var(--text-primary)]">
                      {copy.emergencyBody}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-[16px] font-bold text-white">
                    <Phone className="h-4 w-4" />
                    {copy.call} {EMERGENCY_NUMBER.number}
                  </span>
                </a>

                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  {copy.agencyTitle}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-[var(--text-dim)]">
                  {copy.agencyNote.replace("{date}", formatReviewedOn())}
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {AGENCY_LINES.map((line) => (
                    <AgencyCard key={line.id} line={line} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className="flex w-full items-center justify-between border-t border-overlay/10 bg-[var(--bg-panel)] backdrop-blur-sm px-4 py-3 md:px-5 text-left transition hover:bg-[var(--bg-panel-elevated)] active:bg-[var(--bg-panel-elevated)]"
          onClick={() => setOpen(!open)}
          type="button"
        >
          <div className="flex items-center gap-2.5">
            <Phone className="h-[18px] w-[18px] text-amber-400" />
            <span className="text-[12px] md:text-[13px] font-bold uppercase tracking-[0.18em] text-[var(--text-primary)]">
              {copy.title}
            </span>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-[var(--text-dim)]" />
          </motion.div>
        </button>
      </div>
    </>
  );
}
