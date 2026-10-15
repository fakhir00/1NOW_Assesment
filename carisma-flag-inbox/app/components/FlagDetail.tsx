"use client";

import { useState, useMemo } from "react";
import { Flag, Booking, Car } from "@/src/lib/types";

interface FlagDetailProps {
  flag: Flag;
  bookings: Booking[];
  cars: Car[];
  onClose: () => void;
  onResolve: (flagId: string, note: string) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

// ─── Suggested actions by flag type ────────────────────────────────
function getSuggestedAction(flag: Flag, bookings: Booking[]): string {
  switch (flag.type) {
    case "overlap":
      return "Contact one renter to reschedule or move them to a different vehicle. Check which booking was confirmed first and honor that one.";
    case "unverified-renter": {
      const b = bookings[0];
      const missing: string[] = [];
      if (b && !b.idVerified) missing.push("ID");
      if (b && !b.insuranceVerified) missing.push("insurance");
      return `Send ${b?.renterName ?? "the renter"} a verification reminder for ${missing.join(" and ")}. Keys cannot go out until verification is complete.`;
    }
    case "overdue-payment": {
      const b = bookings[0];
      const unpaid = b ? b.totalAmount - b.amountPaid : 0;
      return `Follow up with ${b?.renterName ?? "the renter"} on the outstanding $${unpaid}. Send a payment reminder or process a charge on file.`;
    }
    case "no-turnaround":
      return "Delay the next pickup by at least 2 hours, or arrange expedited cleaning between trips. Confirm the new time with the incoming renter.";
    default:
      return "Review and take appropriate action.";
  }
}

// ─── Date strip for overlaps ───────────────────────────────────────
function DateStrip({ bookings }: { bookings: Booking[] }) {
  const [a, b] = bookings;
  if (!a || !b) return null;

  // Find the overall range
  const allDates = [a.start, a.end, b.start, b.end].map(
    (d) => new Date(d).getTime()
  );
  const min = Math.min(...allDates);
  const max = Math.max(...allDates);
  const range = max - min || 1;

  const pct = (iso: string) =>
    ((new Date(iso).getTime() - min) / range) * 100;

  return (
    <div className="date-strip">
      <div className="date-strip-title">Date conflict</div>
      <div className="date-strip-bars">
        <div className="date-bar">
          <span className="date-bar-label">{a.id}</span>
          <div className="date-bar-track">
            <div
              className="date-bar-fill bar-a"
              style={{
                left: `${pct(a.start)}%`,
                width: `${Math.max(pct(a.end) - pct(a.start), 5)}%`,
              }}
            >
              {formatDate(a.start).split(", ")[0]}
            </div>
          </div>
        </div>
        <div className="date-bar">
          <span className="date-bar-label">{b.id}</span>
          <div className="date-bar-track">
            <div
              className="date-bar-fill bar-b"
              style={{
                left: `${pct(b.start)}%`,
                width: `${Math.max(pct(b.end) - pct(b.start), 5)}%`,
              }}
            >
              {formatDate(b.start).split(", ")[0]}
            </div>
          </div>
        </div>
      </div>
      <div className="date-strip-legend">
        <div className="legend-item">
          <div className="legend-dot a" />
          <span>
            {a.id} ({a.source})
          </span>
        </div>
        <div className="legend-item">
          <div className="legend-dot b" />
          <span>
            {b.id} ({b.source})
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────
export default function FlagDetail({
  flag,
  bookings,
  cars,
  onClose,
  onResolve,
}: FlagDetailProps) {
  const [note, setNote] = useState("");
  const car = useMemo(
    () => cars.find((c) => c.id === flag.carId),
    [cars, flag.carId]
  );

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div
        className="detail-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Flag detail: ${flag.title}`}
      >
        {/* ── Header ────────────────────────── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <span className={`detail-severity-badge ${flag.severity}`}>
              <span className="dot" />
              {flag.severity}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {flag.id}
            </span>
          </div>
          <button className="detail-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <h2 className="detail-title">{flag.title}</h2>

        {/* ── Reason ────────────────────────── */}
        <div className="detail-description">{flag.detail}</div>

        {/* ── Date strip (overlaps only) ────── */}
        {flag.type === "overlap" && <DateStrip bookings={bookings} />}

        {/* ── Verification checklist (unverified only) ── */}
        {flag.type === "unverified-renter" && bookings[0] && (
          <>
            <div className="detail-section-label">Verification status</div>
            <div className="verification-list">
              <div
                className={`verification-item ${
                  bookings[0].idVerified ? "verified" : "missing"
                }`}
              >
                <span className="verification-icon">
                  {bookings[0].idVerified ? "✓" : "✗"}
                </span>
                ID verification
              </div>
              <div
                className={`verification-item ${
                  bookings[0].insuranceVerified ? "verified" : "missing"
                }`}
              >
                <span className="verification-icon">
                  {bookings[0].insuranceVerified ? "✓" : "✗"}
                </span>
                Insurance verification
              </div>
            </div>
          </>
        )}

        {/* ── Involved bookings ─────────────── */}
        <div className="detail-section-label">
          Involved booking{bookings.length > 1 ? "s" : ""}
        </div>
        <div className="booking-cards">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card">
              <div className="booking-card-header">
                <span className="booking-id">{b.id}</span>
                <span className={`booking-source ${b.source}`}>
                  {b.source}
                </span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Renter</span>
                <span className="booking-row-value">{b.renterName}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Vehicle</span>
                <span className="booking-row-value">
                  {car?.name ?? flag.carId}
                </span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Dates</span>
                <span className="booking-row-value">
                  {formatDate(b.start)} → {formatDate(b.end)}
                </span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Status</span>
                <span className="booking-row-value">{b.status}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Payment</span>
                <span className="booking-row-value">
                  ${b.amountPaid} / ${b.totalAmount}
                  {b.amountPaid < b.totalAmount && (
                    <span style={{ color: "var(--critical-text)", marginLeft: 6 }}>
                      (${b.totalAmount - b.amountPaid} unpaid)
                    </span>
                  )}
                </span>
              </div>
              {flag.type === "overdue-payment" && (
                <div className="booking-row">
                  <span className="booking-row-label">Due date</span>
                  <span
                    className="booking-row-value"
                    style={{ color: "var(--critical-text)" }}
                  >
                    {formatDate(b.paymentDueDate)} (
                    {daysBetween(
                      b.paymentDueDate,
                      new Date().toISOString().slice(0, 10)
                    )}{" "}
                    days ago)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Suggested action ──────────────── */}
        <div className="suggested-action">
          <div className="suggested-action-label">Suggested next step</div>
          <div className="suggested-action-text">
            {getSuggestedAction(flag, bookings)}
          </div>
        </div>

        {/* ── Resolve ───────────────────────── */}
        {!flag.resolved && (
          <div className="resolve-section">
            <textarea
              className="resolve-textarea"
              placeholder="Add a note (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="resolve-btn"
              onClick={() => onResolve(flag.id, note)}
            >
              ✓ Mark resolved
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
