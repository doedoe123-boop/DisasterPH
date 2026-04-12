"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ClipboardList,
  MessageSquare,
  ChevronRight,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { AppHeader } from "@/components/disasterph/header";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

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

const STATUS_STYLE: Record<
  ShelterStatus,
  { text: string; bg: string; border: string; glow: string }
> = {
  open: {
    text: "text-emerald-400",
    bg: "bg-emerald-400",
    border: "border-emerald-500/30",
    glow: "shadow-[0_0_8px_rgba(57,217,138,0.1)]",
  },
  full: {
    text: "text-orange-400",
    bg: "bg-orange-400",
    border: "border-orange-500/30",
    glow: "shadow-[0_0_8px_rgba(255,140,66,0.1)]",
  },
  standby: {
    text: "text-cyan-400",
    bg: "bg-cyan-400",
    border: "border-cyan-500/30",
    glow: "",
  },
  closed: {
    text: "text-zinc-500",
    bg: "bg-zinc-500",
    border: "border-zinc-600/30",
    glow: "",
  },
};

function occupancyBarColor(pct: number): string {
  if (pct >= 90) return "bg-orange-400";
  if (pct >= 60) return "bg-amber-400";
  return "bg-emerald-400";
}

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  water: Droplets,
  food: Utensils,
  medical: Cross,
  electricity: Zap,
};

type DetailTab = "overview" | "guests" | "notices";

/* ── Motion ── */
const listItemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export default function SheltersPage() {
  const { locale } = useLocale();
  const i18n = t(locale);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShelterStatus | "all">(
    "all",
  );
  const [selectedId, setSelectedId] = useState<string>(SHELTERS[0].id);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

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

  const selected = SHELTERS.find((s) => s.id === selectedId) ?? SHELTERS[0];
  const selectedPct =
    selected.capacity > 0
      ? Math.round((selected.occupancy / selected.capacity) * 100)
      : 0;
  const statusFilters: Array<{ label: string; value: ShelterStatus | "all" }> = [
    { label: i18n.shelters.filters.all, value: "all" },
    { label: i18n.shelters.filters.open, value: "open" },
    { label: i18n.shelters.filters.full, value: "full" },
    { label: i18n.shelters.filters.standby, value: "standby" },
    { label: i18n.shelters.filters.closed, value: "closed" },
  ];

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ══════════════════════════════════════════
            LEFT PANEL: Shelter List
        ══════════════════════════════════════════ */}
        <aside className="flex flex-1 lg:flex-none w-full lg:max-w-sm flex-col border-r border-overlay/10 bg-[var(--bg-panel-strong)] overflow-y-auto">
          {/* Title */}
          <div className="flex items-center justify-between border-b border-overlay/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10">
                <Building2 className="h-[18px] w-[18px] text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {i18n.shelters.title}
                </h1>
                <p className="text-[11px] font-medium text-[var(--text-dim)] uppercase tracking-wider mt-0.5">
                  {i18n.shelters.subtitle}
                </p>
              </div>
            </div>
            <span className="rounded-lg bg-overlay/6 px-2.5 py-1 text-[13px] font-semibold text-[var(--text-muted)]">
              {filtered.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative px-4 pt-4 pb-1">
            <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              type="text"
              placeholder={i18n.shelters.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-overlay/10 bg-[var(--bg-panel)] py-3 pl-10 pr-4 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none transition focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-2 px-4 md:px-5 py-3 overflow-x-auto scrollbar-none">
            <Filter className="h-4 w-4 shrink-0 text-[var(--text-dim)]" />
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`shrink-0 rounded-lg border px-3 py-2 md:py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                  statusFilter === f.value
                    ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                    : "text-[var(--text-dim)] border-transparent hover:bg-overlay/6 hover:text-[var(--text-primary)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Shelter cards */}
          <div className="flex-1 overflow-y-auto px-4 pb-20 md:pb-4">
            {filtered.length === 0 ? (
              <p className="mt-10 text-center text-[14px] text-[var(--text-dim)]">
                {locale === "fil"
                  ? "Walang silungang tugma sa iyong filter."
                  : "No shelters match your filters."}
              </p>
            ) : (
              <motion.div
                className="space-y-3"
                variants={listContainer}
                initial="hidden"
                animate="show"
              >
                {filtered.map((shelter) => (
                  <ShelterListCard
                    key={shelter.id}
                    shelter={shelter}
                    isSelected={selectedId === shelter.id}
                    locale={locale}
                    onSelect={() => {
                      setSelectedId(shelter.id);
                      setDetailTab("overview");
                      setMobileDetailOpen(true);
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </aside>

        {/* ══════════════════════════════════════════
            MAIN PANEL: Selected Shelter Detail
        ══════════════════════════════════════════ */}
        <div className="hidden flex-1 flex-col lg:flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* ── Detail Header ── */}
              <div className="border-b border-overlay/10 bg-[var(--bg-panel)] px-8 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-wider ${STATUS_STYLE[selected.status].text} ${STATUS_STYLE[selected.status].border} ${STATUS_STYLE[selected.status].glow}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${STATUS_STYLE[selected.status].bg} ${selected.status === "open" ? "pulse-dot" : ""}`}
                        />
                        {i18n.shelters.labels[selected.status]}
                      </span>
                      <span className="text-[12px] font-medium text-[var(--text-dim)] uppercase tracking-wider">
                        {i18n.shelters.labels.evacuationCenter}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      {selected.name}
                    </h2>
                    <div className="mt-2 flex items-center gap-1.5 text-[14px] text-[var(--text-muted)]">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{selected.address}</span>
                    </div>
                  </div>

                  {/* Capacity widget */}
                  <div className="ml-8 flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[var(--text-primary)]">
                        {selectedPct}
                      </span>
                      <span className="text-lg text-[var(--text-dim)]">%</span>
                    </div>
                    <p className="text-[12px] font-medium text-[var(--text-dim)] uppercase tracking-wider mt-0.5">
                      {i18n.shelters.labels.capacity}
                    </p>
                    <div className="mt-2 h-2 w-36 overflow-hidden rounded-full bg-overlay/10">
                      <motion.div
                        className={`h-full rounded-full ${occupancyBarColor(selectedPct)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(selectedPct, 100)}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <p className="mt-1.5 text-[13px] text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {selected.occupancy.toLocaleString()}
                      </span>
                      {" / "}
                      {selected.capacity.toLocaleString()}{" "}
                      {locale === "fil" ? "evacuees" : "evacuees"}
                    </p>
                  </div>
                </div>

                {/* ── Detail Grid ── */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {/* Operator */}
                  <div className="rounded-xl border border-overlay/8 bg-overlay/[0.03] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {i18n.shelters.labels.managingOffice}
                    </p>
                    <p className="mt-1.5 text-[15px] font-semibold text-[var(--text-primary)]">
                      {selected.operator}
                    </p>
                  </div>

                  {/* Hotline */}
                  <div className="rounded-xl border border-overlay/8 bg-overlay/[0.03] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {i18n.shelters.labels.hotline}
                    </p>
                    <a
                      href={`tel:${selected.phone.replace(/[^0-9+]/g, "")}`}
                      className="shelter-call-link mt-1.5 flex items-center gap-1.5 text-[15px] font-semibold text-cyan-400 transition hover:text-cyan-300"
                    >
                      <Phone className="h-4 w-4" />
                      {selected.phone}
                    </a>
                  </div>

                  {/* Amenities */}
                  <div className="rounded-xl border border-overlay/8 bg-overlay/[0.03] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {i18n.shelters.labels.services}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.amenities.map((amenity) => {
                        const AIcon = AMENITY_ICONS[amenity];
                        return (
                          <span
                            key={amenity}
                            className="flex items-center gap-1 rounded-md border border-overlay/10 bg-overlay/[0.04] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]"
                          >
                            {AIcon && <AIcon className="h-3 w-3" />}
                            {i18n.shelters.amenities[
                              amenity as keyof typeof i18n.shelters.amenities
                            ] ?? amenity}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="border-b border-overlay/8 bg-[var(--bg-panel)]">
                <div className="flex gap-0 px-8">
                  {(
                    [
                      {
                        key: "overview" as const,
                        label: i18n.shelters.tabs.overview,
                        icon: Info,
                      },
                      {
                        key: "guests" as const,
                        label: i18n.shelters.tabs.guests,
                        icon: ClipboardList,
                      },
                      {
                        key: "notices" as const,
                        label: i18n.shelters.tabs.notices,
                        icon: MessageSquare,
                      },
                    ] as const
                  ).map((tab) => {
                    const active = detailTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setDetailTab(tab.key)}
                        className={`shelter-tab relative flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold transition ${
                          active
                            ? "text-orange-400"
                            : "text-[var(--text-dim)] hover:text-[var(--text-primary)]"
                        } ${active ? "is-active" : ""}`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {active && (
                          <motion.div
                            layoutId="shelterTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400 rounded-full"
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.4,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Tab Content ── */}
              <div className="flex-1 overflow-y-auto bg-[var(--bg-base)]">
                <AnimatePresence mode="wait">
                  {detailTab === "overview" && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="p-8"
                    >
                      <div className="rounded-xl border border-overlay/10 bg-[var(--bg-panel)] p-6">
                        <h3 className="text-[16px] font-bold text-[var(--text-primary)]">
                          {i18n.shelters.labels.facilityOverview}
                        </h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-muted)]">
                          {locale === "fil"
                            ? "Ang evacuation center na ito ay kasalukuyang "
                            : "This evacuation center is currently "}
                          <span
                            className={`font-semibold ${STATUS_STYLE[selected.status].text}`}
                          >
                            {i18n.shelters.labels[selected.status]}
                          </span>
                          {locale === "fil"
                            ? ` at pinamamahalaan ng ${selected.operator}. Ang pasilidad ay may pinakamataas na kapasidad na ${selected.capacity.toLocaleString()} evacuees at kasalukuyang may ${selected.occupancy.toLocaleString()} na nakasilong.`
                            : ` and managed by ${selected.operator}. The facility has a maximum capacity of ${selected.capacity.toLocaleString()} evacuees with current occupancy at ${selected.occupancy.toLocaleString()}.`}
                        </p>

                        {/* Occupancy breakdown visual */}
                        <div className="mt-6 rounded-xl border border-overlay/8 bg-overlay/[0.02] p-5">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                              {i18n.shelters.labels.occupancyBreakdown}
                            </p>
                            <Users className="h-4 w-4 text-[var(--text-dim)]" />
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-[var(--text-primary)]">
                                {selected.occupancy.toLocaleString()}
                              </p>
                              <p className="text-[11px] text-[var(--text-dim)] mt-1">
                                {i18n.shelters.labels.current}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-emerald-400">
                                {(
                                  selected.capacity - selected.occupancy
                                ).toLocaleString()}
                              </p>
                              <p className="text-[11px] text-[var(--text-dim)] mt-1">
                                {i18n.shelters.labels.available}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-[var(--text-muted)]">
                                {selected.capacity.toLocaleString()}
                              </p>
                              <p className="text-[11px] text-[var(--text-dim)] mt-1">
                                {i18n.shelters.labels.maxCapacity}
                              </p>
                            </div>
                          </div>
                          <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-overlay/10">
                            <motion.div
                              className={`h-full rounded-full ${occupancyBarColor(selectedPct)}`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(selectedPct, 100)}%`,
                              }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {detailTab === "guests" && (
                    <motion.div
                      key="guests"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="p-8"
                    >
                      {/* Phase 2 restricted access notice */}
                      <div className="shelter-amber-panel rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mb-6">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="shelter-amber-title text-[14px] font-bold text-amber-300">
                              {locale === "fil"
                                ? "Limitadong Access — Phase 2"
                                : "Restricted Access — Phase 2"}
                            </h4>
                            <p className="shelter-amber-copy mt-1 text-[13px] leading-relaxed text-amber-200/70">
                              {locale === "fil"
                                ? "Ang guest registry ay para lamang sa mga awtorisadong shelter administrator. Ginagawa pa ang module na ito at ilalabas sa susunod na bersyon."
                                : "Guest registry features are restricted to authorized shelter administrators. This module is under active development and will be available in a future release."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-overlay/10 bg-[var(--bg-panel)] p-6 opacity-50 pointer-events-none select-none">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[16px] font-bold text-[var(--text-primary)]">
                            {locale === "fil" ? "Guest Registry" : "Guest Registry"}
                          </h3>
                          <span className="flex items-center gap-1.5 rounded-lg bg-overlay/6 px-2.5 py-1 text-[12px] font-semibold text-[var(--text-dim)]">
                            <Lock className="h-3 w-3" />
                            {locale === "fil" ? "Admin Lamang" : "Admin Only"}
                          </span>
                        </div>

                        {/* Disabled search */}
                        <div className="relative mt-4">
                          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]" />
                          <input
                            type="text"
                            placeholder={i18n.shelters.labels.searchGuest}
                            disabled
                            className="w-full rounded-xl border border-overlay/10 bg-[var(--bg-base)] py-3 pl-10 pr-4 text-[14px] text-overlay/30 placeholder-[var(--text-dim)] outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Locked state */}
                        <div className="mt-8 flex flex-col items-center py-8 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-overlay/8 bg-overlay/[0.03]">
                            <Lock className="h-7 w-7 text-[var(--text-dim)]" />
                          </div>
                          <p className="mt-4 text-[15px] font-medium text-[var(--text-muted)]">
                            {locale === "fil"
                              ? "Kailangan ng pagpapatunay"
                              : "Authentication required"}
                          </p>
                          <p className="mt-1.5 text-[13px] text-[var(--text-dim)]">
                            {locale === "fil"
                              ? "Makipag-ugnayan sa shelter operator para sa admin access."
                              : "Contact the shelter operator for administrator access."}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {detailTab === "notices" && (
                    <motion.div
                      key="notices"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="p-8"
                    >
                      {/* Phase 2 coming soon notice */}
                      <div className="shelter-cyan-panel rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 mb-6">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15">
                            <MessageSquare className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="shelter-cyan-title text-[14px] font-bold text-cyan-300">
                              {locale === "fil"
                                ? "Paparating — Phase 2"
                                : "Coming Soon — Phase 2"}
                            </h4>
                            <p className="shelter-cyan-copy mt-1 text-[13px] leading-relaxed text-cyan-200/70">
                              {locale === "fil"
                                ? "Maghahatid ang Notice Board ng real-time na anunsyo mula sa shelter operators, kasama ang evacuation updates, iskedyul ng ayuda, at safety advisories."
                                : "The Notice Board will deliver real-time announcements from shelter operators, including evacuation updates, relief schedules, and safety advisories."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-overlay/10 bg-[var(--bg-panel)] p-6 opacity-50 pointer-events-none select-none">
                        <h3 className="text-[16px] font-bold text-[var(--text-primary)]">
                          {i18n.shelters.tabs.notices}
                        </h3>
                        <p className="mt-2 text-[13px] text-[var(--text-dim)]">
                          {locale === "fil"
                            ? "Mga opisyal na anunsyo at update mula sa shelter management."
                            : "Official announcements and updates from shelter management."}
                        </p>

                        {/* Placeholder state */}
                        <div className="mt-8 flex flex-col items-center py-8 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-overlay/8 bg-overlay/[0.03]">
                            <Lock className="h-7 w-7 text-[var(--text-dim)]" />
                          </div>
                          <p className="mt-4 text-[15px] font-medium text-[var(--text-muted)]">
                            {locale === "fil"
                              ? "Hindi pa available"
                              : "Not yet available"}
                          </p>
                          <p className="mt-1.5 text-[13px] text-[var(--text-dim)]">
                            {locale === "fil"
                              ? "Ginagawa pa ang feature na ito."
                              : "This feature is under development."}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Mobile: Slide-over Detail Panel ── */}
        <AnimatePresence>
          {mobileDetailOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/50 lg:hidden"
                onClick={() => setMobileDetailOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex-col overflow-y-auto bg-[var(--bg-base)] lg:hidden flex"
              >
                {/* Mobile detail header */}
                <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-overlay/10 bg-[var(--bg-panel)] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setMobileDetailOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-overlay/10 bg-overlay/[0.04] text-[var(--text-primary)]"
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-bold text-[var(--text-primary)] truncate">
                      {selected.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[selected.status].text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[selected.status].bg}`}
                        />
                        {i18n.shelters.labels[selected.status]}
                      </span>
                      <span className="text-[12px] text-[var(--text-dim)]">
                        {selectedPct}% {i18n.shelters.labels.capacity.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="px-4 py-4 border-b border-overlay/8 bg-[var(--bg-panel)]">
                  <div className="flex items-center justify-between text-[13px] mb-2">
                    <span className="text-[var(--text-muted)]">
                      {selected.occupancy.toLocaleString()} /{" "}
                      {selected.capacity.toLocaleString()} evacuees
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">{selectedPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-overlay/10">
                    <motion.div
                      className={`h-full rounded-full ${occupancyBarColor(selectedPct)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(selectedPct, 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Info grid */}
                <div className="px-4 py-3 border-b border-overlay/8 bg-[var(--bg-panel)] space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-[var(--text-dim)] mt-0.5" />
                    <span className="text-[13px] text-[var(--text-muted)]">
                      {selected.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 shrink-0 text-[var(--text-dim)]" />
                    <a
                      href={`tel:${selected.phone.replace(/[^0-9+]/g, "")}`}
                      className="text-[13px] font-semibold text-cyan-400"
                    >
                      {selected.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 shrink-0 text-[var(--text-dim)]" />
                    <span className="text-[13px] text-[var(--text-muted)]">
                      {selected.operator}
                    </span>
                  </div>
                  {selected.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selected.amenities.map((amenity) => {
                        const AIcon = AMENITY_ICONS[amenity];
                        return (
                          <span
                            key={amenity}
                            className="flex items-center gap-1 rounded-md border border-overlay/10 bg-overlay/[0.04] px-2 py-1 text-[11px] text-[var(--text-muted)]"
                          >
                            {AIcon && <AIcon className="h-3 w-3" />}
                            {i18n.shelters.amenities[
                              amenity as keyof typeof i18n.shelters.amenities
                            ] ?? amenity}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="border-b border-overlay/8 bg-[var(--bg-panel)]">
                  <div className="flex px-4">
                    {(
                      [
                        {
                          key: "overview" as const,
                          label: i18n.shelters.tabsMobile.overview,
                          icon: Info,
                        },
                        {
                          key: "guests" as const,
                          label: i18n.shelters.tabsMobile.guests,
                          icon: ClipboardList,
                        },
                        {
                          key: "notices" as const,
                          label: i18n.shelters.tabsMobile.notices,
                          icon: MessageSquare,
                        },
                      ] as const
                    ).map((tab) => {
                      const active = detailTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                        onClick={() => setDetailTab(tab.key)}
                        className={`shelter-tab relative flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold transition ${
                            active
                              ? "text-orange-400"
                              : "text-[var(--text-dim)]"
                          } ${active ? "is-active" : ""}`}
                      >
                          <tab.icon className="h-3.5 w-3.5" />
                          {tab.label}
                          {active && (
                            <motion.div
                              layoutId="mShelterTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400 rounded-full"
                              transition={{
                                type: "spring",
                                bounce: 0.2,
                                duration: 0.4,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab content */}
                <div className="flex-1 pb-20">
                  <AnimatePresence mode="wait">
                    {detailTab === "overview" && (
                      <motion.div
                        key="m-overview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4"
                      >
                        <div className="rounded-xl border border-overlay/10 bg-[var(--bg-panel)] p-4">
                          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
                            {i18n.shelters.labels.facilityOverview}
                          </h3>
                          <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
                            {locale === "fil"
                              ? "Ang center na ito ay kasalukuyang "
                              : "This center is currently "}
                            <span
                              className={`font-semibold ${STATUS_STYLE[selected.status].text}`}
                            >
                              {i18n.shelters.labels[selected.status]}
                            </span>
                            {locale === "fil"
                              ? ` at pinamamahalaan ng ${selected.operator}. Ang kapasidad ay ${selected.capacity.toLocaleString()} at may ${selected.occupancy.toLocaleString()} kasalukuyang nakasilong.`
                              : ` and managed by ${selected.operator}. Capacity is ${selected.capacity.toLocaleString()} with ${selected.occupancy.toLocaleString()} currently sheltered.`}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {detailTab === "guests" && (
                      <motion.div
                        key="m-guests"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4"
                      >
                        <div className="shelter-amber-panel rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                            <div>
                              <h4 className="shelter-amber-title text-[13px] font-bold text-amber-300">
                                {locale === "fil"
                                  ? "Limitadong Access"
                                  : "Restricted Access"}
                              </h4>
                              <p className="shelter-amber-copy mt-1 text-[12px] text-amber-200/70">
                                {locale === "fil"
                                  ? "Kailangan ng admin authentication."
                                  : "Admin authentication required."}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl border border-overlay/10 bg-[var(--bg-panel)] p-4 opacity-50 pointer-events-none">
                          <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-dim)]">
                            <Lock className="h-3 w-3" />{" "}
                            {locale === "fil" ? "Admin Lamang" : "Admin Only"}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {detailTab === "notices" && (
                      <motion.div
                        key="m-notices"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4"
                      >
                        <div className="shelter-cyan-panel rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <MessageSquare className="h-5 w-5 shrink-0 text-cyan-400 mt-0.5" />
                            <div>
                              <h4 className="shelter-cyan-title text-[13px] font-bold text-cyan-300">
                                {locale === "fil" ? "Paparating" : "Coming Soon"}
                              </h4>
                              <p className="shelter-cyan-copy mt-1 text-[12px] text-cyan-200/70">
                                {locale === "fil"
                                  ? "Ginagawa pa ang notice board."
                                  : "Notice board under development."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Shelter List Card Component
══════════════════════════════════════════ */
function ShelterListCard({
  shelter,
  isSelected,
  onSelect,
  locale,
}: {
  shelter: Shelter;
  isSelected: boolean;
  onSelect: () => void;
  locale: "en" | "fil";
}) {
  const i18n = t(locale);
  const pct =
    shelter.capacity > 0
      ? Math.round((shelter.occupancy / shelter.capacity) * 100)
      : 0;
  const statusStyle = STATUS_STYLE[shelter.status];

  return (
    <motion.button
      type="button"
      variants={listItemVariants}
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        isSelected
          ? "border-orange-500/40 bg-orange-500/8 shadow-[0_0_16px_rgba(255,140,66,0.08)]"
          : "border-overlay/8 bg-[var(--bg-panel)] hover:border-overlay/15 hover:bg-[var(--bg-card-hover)]"
      }`}
    >
      {/* Status + capacity row */}
      <div className="flex items-center justify-between">
        <span
          className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${statusStyle.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.bg}`} />
          {i18n.shelters.labels[shelter.status]}
        </span>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-dim)]">
          <Users className="h-3.5 w-3.5" />
          <span className="font-medium">{pct}%</span>
        </div>
      </div>

      {/* Name + address */}
      <h3 className="mt-2 text-[15px] font-bold text-[var(--text-primary)] leading-snug">
        {shelter.name}
      </h3>
      <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{shelter.address}</span>
      </div>

      {/* Occupancy bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-dim)]">
            {shelter.occupancy.toLocaleString()}/
            {shelter.capacity.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-overlay/10">
          <div
            className={`h-full rounded-full transition-all ${occupancyBarColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Amenity icons */}
      {shelter.amenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {shelter.amenities.map((amenity) => {
            const AIcon = AMENITY_ICONS[amenity];
            return (
              <span
                key={amenity}
                className="flex items-center gap-1 rounded-md border border-overlay/8 bg-overlay/[0.03] px-2 py-0.5 text-[10px] text-[var(--text-dim)]"
                title={
                  i18n.shelters.amenities[
                    amenity as keyof typeof i18n.shelters.amenities
                  ] ?? amenity
                }
              >
                {AIcon && <AIcon className="h-2.5 w-2.5" />}
                {i18n.shelters.amenities[
                  amenity as keyof typeof i18n.shelters.amenities
                ] ?? amenity}
              </span>
            );
          })}
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-orange-400">
          <span>{i18n.shelters.labels.viewingDetails}</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      )}
    </motion.button>
  );
}
