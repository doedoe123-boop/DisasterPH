"use client";

import { useState } from "react";
import { ChevronDown, Phone, Copy, Check } from "lucide-react";

interface EmergencyContact {
  name: string;
  number: string;
  category: "national" | "rescue" | "health" | "utility";
}

const CONTACTS: EmergencyContact[] = [
  // National emergency
  { name: "National Emergency (NDRRMC)", number: "911", category: "national" },
  {
    name: "NDRRMC Operations Center",
    number: "(02) 8911-5061",
    category: "national",
  },
  { name: "Philippine Red Cross", number: "143", category: "national" },

  // Rescue
  { name: "PNP Hotline", number: "117", category: "rescue" },
  {
    name: "Bureau of Fire Protection",
    number: "(02) 8426-0219",
    category: "rescue",
  },
  {
    name: "Philippine Coast Guard",
    number: "(02) 8527-8481",
    category: "rescue",
  },

  // Health
  { name: "DOH Hotline", number: "1555", category: "health" },

  // Utilities
  { name: "PAGASA (Weather)", number: "(02) 8284-0800", category: "utility" },
  {
    name: "PHIVOLCS (Earthquake/Volcano)",
    number: "(02) 8929-9254",
    category: "utility",
  },
];

const categoryLabel: Record<EmergencyContact["category"], string> = {
  national: "National Emergency",
  rescue: "Rescue & Security",
  health: "Health",
  utility: "Information",
};

const categoryOrder: EmergencyContact["category"][] = [
  "national",
  "rescue",
  "health",
  "utility",
];

function toDialable(number: string): string {
  return number.replace(/[^0-9+]/g, "");
}

function ContactRow({ contact }: { contact: EmergencyContact }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(contact.number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-white/6 bg-white/[0.02] px-2.5 py-2">
      <div className="min-w-0">
        <p className="truncate text-[12px] text-white">{contact.name}</p>
        <p className="text-[11px] text-[var(--text-dim)]">{contact.number}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={`tel:${toDialable(contact.number)}`}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-300 transition hover:bg-cyan-500/25"
          title={`Call ${contact.name}`}
        >
          <Phone className="h-3.5 w-3.5" />
        </a>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-dim)] transition hover:bg-white/8 hover:text-white"
          onClick={handleCopy}
          title="Copy number"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

export function EmergencyContacts() {
  const [open, setOpen] = useState(false);

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabel[cat],
      contacts: CONTACTS.filter((c) => c.category === cat),
    }))
    .filter((g) => g.contacts.length > 0);

  return (
    <div className="shrink-0">
      <button
        className="flex w-full items-center justify-between rounded-lg border border-white/8 bg-[var(--bg-panel)] px-3 py-2 text-left"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Emergency Contacts
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[var(--text-dim)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-1 max-h-72 overflow-y-auto rounded-lg border border-white/8 bg-[var(--bg-panel)] p-2">
          {grouped.map((group) => (
            <div key={group.category} className="mb-2 last:mb-0">
              <p className="mb-1 px-0.5 text-[9px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.contacts.map((contact) => (
                  <ContactRow key={contact.number} contact={contact} />
                ))}
              </div>
            </div>
          ))}
          <p className="mt-2 text-center text-[9px] text-[var(--text-dim)]">
            Available offline · Tap phone icon to call
          </p>
        </div>
      )}
    </div>
  );
}
