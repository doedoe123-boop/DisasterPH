"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Building2,
  MapPin,
  Phone,
  Users,
  Wifi,
  Droplets,
  Utensils,
  Cross,
  Zap,
  Info,
} from "lucide-react";
import { AppHeader } from "@/components/disasterph/header";

/* ── Shelter types ── */
type ShelterStatus = "open" | "full" | "standby" | "closed";

interface Shelter {
  id: string;
  name: string;
  address: string;
  status: ShelterStatus;
  occupancy: number;
  capacity: number;
  operator: string;
  phone: string;
  amenities: string[];
}

/* ── Demo shelter data ── */
const SHELTERS: Shelter[] = [
  {
    id: "s1",
    name: "Tacloban City Astrodome",
    address: "Real Street, Tacloban City, Leyte",
    status: "open",
    occupancy: 1450,
    capacity: 2000,
    operator: "DSWD Region VIII",
    phone: "(053) 321-2345",
    amenities: ["water", "food", "medical", "electricity", "WiFi"],
  },
  {
    id: "s2",
    name: "Catbalogan City Covered Court",
    address: "San Bartolome, Catbalogan City, Samar",
    status: "full",
    occupancy: 490,
    capacity: 500,
    operator: "LGU Catbalogan",
    phone: "(055) 251-3456",
    amenities: ["water", "food", "medical"],
  },
  {
    id: "s3",
    name: "Borongan Evacuation Center",
    address: "Brgy. Cabong, Borongan, Eastern Samar",
    status: "open",
    occupancy: 320,
    capacity: 800,
    operator: "DSWD Region VIII",
    phone: "(055) 560-7890",
    amenities: ["water", "food", "electricity"],
  },
  {
    id: "s4",
    name: "Ormoc City Sports Complex",
    address: "Brgy. Cogon, Ormoc City, Leyte",
    status: "standby",
    occupancy: 0,
    capacity: 1500,
    operator: "LGU Ormoc",
    phone: "(053) 255-4567",
    amenities: ["water", "food", "medical", "electricity", "WiFi"],
  },
  {
    id: "s5",
    name: "Palo Municipal Gym",
    address: "Palo, Leyte",
    status: "open",
    occupancy: 180,
    capacity: 600,
    operator: "LGU Palo",
    phone: "(053) 323-1234",
    amenities: ["water", "food"],
  },
  {
    id: "s6",
    name: "Guiuan Community Center",
    address: "Guiuan, Eastern Samar",
    status: "closed",
    occupancy: 0,
    capacity: 400,
    operator: "LGU Guiuan",
    phone: "(055) 214-5678",
    amenities: ["water"],
  },
];

const STATUS_FILTERS: Array<{ label: string; value: ShelterStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Full", value: "full" },
  { label: "Standby", value: "standby" },
  { label: "Closed", value: "closed" },
];

const STATUS_STYLE: Record<ShelterStatus, { text: string; bg: string }> = {
  open: { text: "text-emerald-400", bg: "bg-emerald-400" },
  full: { text: "text-orange-400", bg: "bg-orange-400" },
  standby: { text: "text-cyan-400", bg: "bg-cyan-400" },
  closed: { text: "text-zinc-500", bg: "bg-zinc-500" },
};

function occupancyBarColor(pct: number): string {
  if (pct >= 90) return "bg-orange-400";
  if (pct >= 60) return "bg-amber-400";
  return "bg-cyan-400";
}

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  water: Droplets,
  food: Utensils,
  medical: Cross,
  electricity: Zap,
};

export default function SheltersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShelterStatus | "all">(
    "all",
  );

  const filtered = useMemo(() => {
    let result = SHELTERS;
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q),
      );
    }
    return result;
  }, [statusFilter, search]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />

      <div className="flex min-h-0 flex-1">
        {/* ── Left: Shelter list ── */}
        <aside className="flex w-full max-w-md flex-col border-r border-white/8 bg-[var(--bg-panel-strong)]">
          {/* Title */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-orange-400" />
              <h1 className="text-lg font-bold text-white">Sanctuary</h1>
            </div>
            <span className="text-sm text-[var(--text-dim)]">
              {filtered.length} shelter{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search */}
          <div className="relative px-4 pt-3">
            <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              type="text"
              placeholder="Search shelters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[var(--bg-panel)] py-2 pl-10 pr-4 text-sm text-white placeholder-[var(--text-dim)] outline-none transition focus:border-orange-500/40"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-2 px-4 py-3">
            <Filter className="h-3.5 w-3.5 text-[var(--text-dim)]" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider transition ${
                  statusFilter === f.value
                    ? "bg-orange-500/15 text-orange-400"
                    : "text-[var(--text-dim)] hover:bg-white/5 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Shelter cards */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filtered.length === 0 ? (
              <p className="mt-8 text-center text-xs text-[var(--text-dim)]">
                No shelters match your filters.
              </p>
            ) : (
              <div className="space-y-3">
                {filtered.map((shelter) => (
                  <ShelterCard key={shelter.id} shelter={shelter} />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Right: Map placeholder + Coming Soon overlay ── */}
        <div className="relative hidden flex-1 lg:block">
          {/* Dark map placeholder */}
          <div className="h-full w-full bg-[#040d16]" />

          {/* Coming soon overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(4,13,22,0.85)]">
            <div className="max-w-md rounded-xl border border-white/10 bg-[var(--bg-panel)] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10">
                <Info className="h-7 w-7 text-orange-400" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-white">Coming Soon</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                Shelter management and real-time occupancy tracking are coming
                soon (requires admin verification).
              </p>
              <p className="mt-3 text-xs text-[var(--text-dim)]">
                The shelter map will show live locations, capacity, and
                navigation routes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shelter Card Component ── */
function ShelterCard({ shelter }: { shelter: Shelter }) {
  const pct =
    shelter.capacity > 0
      ? Math.round((shelter.occupancy / shelter.capacity) * 100)
      : 0;
  const statusStyle = STATUS_STYLE[shelter.status];

  return (
    <div className="rounded-xl border border-white/8 bg-[var(--bg-panel)] p-4">
      {/* Status + capacity icon */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${statusStyle.text}`}
        >
          {shelter.status}
        </span>
        <Users className="h-4 w-4 text-[var(--text-dim)]" />
      </div>

      {/* Name + address */}
      <h3 className="mt-1.5 text-[14px] font-semibold text-white">
        {shelter.name}
      </h3>
      <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
        <MapPin className="h-3 w-3 shrink-0" />
        <span>{shelter.address}</span>
      </div>

      {/* Occupancy bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-dim)]">
            {shelter.occupancy}/{shelter.capacity}
          </span>
          <span
            className={pct >= 90 ? "text-orange-400" : "text-[var(--text-dim)]"}
          >
            {pct}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${occupancyBarColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Operator + phone */}
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-dim)]">{shelter.operator}</span>
        <a
          href={`tel:${shelter.phone.replace(/[^0-9+]/g, "")}`}
          className="flex items-center gap-1 text-emerald-400 transition hover:text-emerald-300"
        >
          <Phone className="h-3 w-3" />
          {shelter.phone}
        </a>
      </div>

      {/* Amenity tags */}
      {shelter.amenities.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {shelter.amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--text-dim)]"
            >
              {amenity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
