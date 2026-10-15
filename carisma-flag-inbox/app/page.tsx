"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Flag, FlagType, Severity, Booking } from "@/src/lib/types";
import { bookings, cars } from "@/src/lib/seeds";
import { generateAllFlags } from "@/src/lib/flag-engine";
import FlagDetail from "@/app/components/FlagDetail";

// ─── Helpers ───────────────────────────────────────────────────────
function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const flagTypeLabels: Record<FlagType, string> = {
  overlap: "Overlap",
  "unverified-renter": "Unverified",
  "overdue-payment": "Overdue",
  "no-turnaround": "No buffer",
};

type FilterType = "all" | FlagType | Severity;

export default function InboxPage() {
  // ─── State ─────────────────────────────────────────────────────
  const [allFlags, setAllFlags] = useState<Flag[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [todayHeader, setTodayHeader] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  // Initialize flags on the client side only (avoids Next.js prerender issues with new Date())
  useEffect(() => {
    const now = new Date();
    setAllFlags(generateAllFlags(bookings, now));
    setTodayHeader(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
    setHydrated(true);
  }, []);

  // ─── Derived ───────────────────────────────────────────────────
  const activeFlags = useMemo(() => allFlags.filter((f) => !f.resolved), [allFlags]);
  const resolvedFlags = useMemo(
    () =>
      allFlags
        .filter((f) => f.resolved)
        .sort(
          (a, b) =>
            new Date(b.resolvedAt ?? b.raisedAt).getTime() -
            new Date(a.resolvedAt ?? a.raisedAt).getTime()
        ),
    [allFlags]
  );

  const filteredFlags = useMemo(() => {
    if (activeFilter === "all") return activeFlags;
    if (activeFilter === "critical" || activeFilter === "high" || activeFilter === "medium") {
      return activeFlags.filter((f) => f.severity === activeFilter);
    }
    return activeFlags.filter((f) => f.type === activeFilter);
  }, [activeFlags, activeFilter]);

  // Counts
  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0 };
    activeFlags.forEach((f) => counts[f.severity]++);
    return counts;
  }, [activeFlags]);

  const typeCounts = useMemo(() => {
    const counts: Record<FlagType, number> = {
      overlap: 0,
      "unverified-renter": 0,
      "overdue-payment": 0,
      "no-turnaround": 0,
    };
    activeFlags.forEach((f) => counts[f.type]++);
    return counts;
  }, [activeFlags]);

  const filterCount = (filter: FilterType): number => {
    if (filter === "all") return activeFlags.length;
    if (filter === "critical" || filter === "high" || filter === "medium")
      return severityCounts[filter];
    return typeCounts[filter as FlagType];
  };

  // ─── Handlers ──────────────────────────────────────────────────
  const selectedFlag = useMemo(
    () => allFlags.find((f) => f.id === selectedFlagId) ?? null,
    [allFlags, selectedFlagId]
  );

  const getBookingsForFlag = useCallback(
    (flag: Flag): Booking[] => {
      return flag.bookingIds
        .map((id) => bookings.find((b) => b.id === id))
        .filter((b): b is Booking => b !== undefined);
    },
    []
  );

  const handleResolve = useCallback((flagId: string, note: string) => {
    setAllFlags((prev) =>
      prev.map((f) =>
        f.id === flagId
          ? {
              ...f,
              resolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedNote: note || undefined,
            }
          : f
      )
    );
    setSelectedFlagId(null);
  }, []);

  // ─── Render ────────────────────────────────────────────────────
  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "overlap", label: "Overlaps" },
    { key: "unverified-renter", label: "Unverified" },
    { key: "overdue-payment", label: "Overdue" },
    { key: "no-turnaround", label: "No buffer" },
    { key: "critical", label: "Critical" },
    { key: "high", label: "High" },
    { key: "medium", label: "Medium" },
  ];

  // Show a minimal loading state during SSR/hydration
  if (!hydrated) {
    return (
      <div className="app-shell">
        <header className="header">
          <div className="header-top">
            <div className="header-brand">
              <div className="header-logo">C</div>
              <h1 className="header-title">Flag Inbox</h1>
            </div>
          </div>
          <p className="header-summary">Loading flags…</p>
        </header>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ── Header ──────────────────────────── */}
      <header className="header">
        <div className="header-top">
          <div className="header-brand">
            <div className="header-logo">C</div>
            <h1 className="header-title">Flag Inbox</h1>
          </div>
          <span className="header-date">{todayHeader}</span>
        </div>

        {activeFlags.length > 0 ? (
          <>
            <p className="header-summary">
              <strong>
                {activeFlags.length} flag{activeFlags.length !== 1 ? "s" : ""}
              </strong>{" "}
              need your attention
            </p>
            <div className="severity-chips">
              {severityCounts.critical > 0 && (
                <span className="severity-chip critical">
                  <span className="dot" />
                  {severityCounts.critical} critical
                </span>
              )}
              {severityCounts.high > 0 && (
                <span className="severity-chip high">
                  <span className="dot" />
                  {severityCounts.high} high
                </span>
              )}
              {severityCounts.medium > 0 && (
                <span className="severity-chip medium">
                  <span className="dot" />
                  {severityCounts.medium} medium
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="header-summary">All clear — no flags need attention.</p>
        )}
      </header>

      {/* ── Filters ─────────────────────────── */}
      {activeFlags.length > 0 && (
        <div className="filter-bar">
          {filters.map(({ key, label }) => {
            const count = filterCount(key);
            return (
              <button
                key={key}
                className={`filter-btn ${activeFilter === key ? "active" : ""}`}
                onClick={() => setActiveFilter(key)}
              >
                {label}
                <span className="count">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Flag list ───────────────────────── */}
      {activeFlags.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">All clear</div>
          <div className="empty-subtitle">No flags need your attention right now.</div>
        </div>
      ) : filteredFlags.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No matching flags</div>
          <div className="empty-subtitle">Try a different filter to see other flags.</div>
        </div>
      ) : (
        <div className="flag-list">
          {filteredFlags.map((flag) => (
            <div
              key={flag.id}
              className={`flag-card ${selectedFlagId === flag.id ? "selected" : ""}`}
              onClick={() => setSelectedFlagId(flag.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedFlagId(flag.id);
                }
              }}
            >
              <div className={`flag-dot ${flag.severity}`} />
              <div className="flag-content">
                <div className="flag-title">{flag.title}</div>
                <div className="flag-meta">
                  <span className="flag-type-badge">{flagTypeLabels[flag.type]}</span>
                  <span className="sep">·</span>
                  <span>{cars.find((c) => c.id === flag.carId)?.name ?? flag.carId}</span>
                  <span className="sep">·</span>
                  <span>{flag.bookingIds.join(", ")}</span>
                  <span className="sep">·</span>
                  <span>{relativeTime(flag.raisedAt)}</span>
                </div>
              </div>
              <span className="flag-arrow">›</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail modal ────────────────────── */}
      {selectedFlag && (
        <FlagDetail
          flag={selectedFlag}
          bookings={getBookingsForFlag(selectedFlag)}
          cars={cars}
          onClose={() => setSelectedFlagId(null)}
          onResolve={handleResolve}
        />
      )}

      {/* ── Resolved today ──────────────────── */}
      {resolvedFlags.length > 0 && (
        <section className="resolved-section">
          <div className="resolved-header">
            <h2>Resolved today</h2>
            <span className="resolved-count">{resolvedFlags.length}</span>
          </div>
          <div className="resolved-list">
            {resolvedFlags.map((flag) => (
              <div key={flag.id} className="resolved-card">
                <div className={`resolved-dot ${flag.severity}`} />
                <div className="resolved-content">
                  <div className="resolved-title">{flag.title}</div>
                  <div className="resolved-meta">
                    Resolved{" "}
                    {flag.resolvedAt
                      ? new Date(flag.resolvedAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                  {flag.resolvedNote && (
                    <div className="resolved-note">&ldquo;{flag.resolvedNote}&rdquo;</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
