"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Phone } from "lucide-react";

interface EmergencyContact {
  name: string;
  number: string;
  category: "national";
}

const CONTACTS: EmergencyContact[] = [
  { name: "NDRRMC", number: "(02) 8911-5061", category: "national" },
  { name: "Philippine Red Cross", number: "143", category: "national" },
  { name: "PHIVOLCS", number: "(02) 8426-1468", category: "national" },
  { name: "PAGASA", number: "(02) 8284-0800", category: "national" },
  { name: "PNP Emergency", number: "117", category: "national" },
  { name: "BFP (Fire)", number: "(02) 8426-0219", category: "national" },
  { name: "DOH Hotline", number: "1555", category: "national" },
  { name: "Coast Guard", number: "(02) 8527-8481", category: "national" },
];

function toDialable(number: string): string {
  return number.replace(/[^0-9+]/g, "");
}

function ContactCard({ contact }: { contact: EmergencyContact }) {
  return (
    <motion.a
      href={`tel:${toDialable(contact.number)}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="block rounded-xl border border-overlay/10 bg-overlay/[0.03] px-3 py-3 md:px-4 md:py-3.5 transition-colors hover:border-cyan-400/25 hover:bg-overlay/[0.06] active:bg-overlay/[0.06]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
        National
      </p>
      <p className="mt-1 md:mt-1.5 text-[14px] md:text-[16px] font-bold leading-snug text-[var(--text-primary)]">
        {contact.name}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] md:text-[15px] font-semibold text-cyan-400">
        <Phone className="h-3.5 w-3.5" />
        {contact.number}
      </p>
    </motion.a>
  );
}

export function EmergencyContacts() {
  const [open, setOpen] = useState(false);

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
                <div className="grid grid-cols-2 gap-2.5 md:gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {CONTACTS.map((contact) => (
                    <ContactCard key={contact.number} contact={contact} />
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
              Emergency Hotlines
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
