"use client";

import { useState } from "react";
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
    <a
      href={`tel:${toDialable(contact.number)}`}
      className="block rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-dim)]">
        National
      </p>
      <p className="mt-1 text-[15px] font-bold leading-snug text-white">
        {contact.name}
      </p>
      <p className="mt-0.5 text-[14px] font-medium text-cyan-400">
        {contact.number}
      </p>
    </a>
  );
}

export function EmergencyContacts() {
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0">
      <button
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
            Emergency Hotlines
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-dim)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-white/8 bg-[var(--bg-panel)] px-4 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CONTACTS.map((contact) => (
              <ContactCard key={contact.number} contact={contact} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
