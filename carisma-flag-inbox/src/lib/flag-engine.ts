import { Booking, Flag, Severity } from "./types";
import { cars } from "./seeds";

// ─── Helpers ───────────────────────────────────────────────────────
let flagCounter = 0;
function nextFlagId(): string {
  flagCounter++;
  return `FLG-${String(flagCounter).padStart(3, "0")}`;
}

/** Reset the counter (useful for deterministic IDs across runs) */
export function resetFlagCounter(): void {
  flagCounter = 0;
}

function carName(carId: string): string {
  return cars.find((c) => c.id === carId)?.name ?? carId;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function hoursBetween(dtA: string, dtB: string): number {
  const a = new Date(dtA).getTime();
  const b = new Date(dtB).getTime();
  return (b - a) / (1000 * 60 * 60);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
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

// ─── Rule 1: Overlap → critical ────────────────────────────────────
export function detectOverlaps(bookings: Booking[], now: Date): Flag[] {
  const flags: Flag[] = [];
  const active = bookings.filter((b) => b.status !== "cancelled");

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (a.carId !== b.carId) continue;

      const aStart = new Date(a.start).getTime();
      const aEnd = new Date(a.end).getTime();
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();

      if (aStart < bEnd && bStart < aEnd) {
        flags.push({
          id: nextFlagId(),
          type: "overlap",
          severity: "critical",
          bookingIds: [a.id, b.id],
          carId: a.carId,
          title: `Double booking on ${carName(a.carId)}`,
          detail: `${a.id} (${a.source}) and ${b.id} (${b.source}) both claim the ${carName(a.carId)}, ${formatDate(a.start)}–${formatDate(a.end)} and ${formatDate(b.start)}–${formatDate(b.end)}.`,
          raisedAt: now.toISOString(),
          resolved: false,
        });
      }
    }
  }
  return flags;
}

// ─── Rule 2: Unverified renter → high ──────────────────────────────
export function detectUnverifiedRenters(bookings: Booking[], now: Date): Flag[] {
  const flags: Flag[] = [];
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h from now

  for (const b of bookings) {
    if (b.status !== "confirmed" && b.status !== "in-progress") continue;
    const startDate = new Date(b.start);
    if (startDate > cutoff) continue;
    if (b.idVerified && b.insuranceVerified) continue;

    const missing: string[] = [];
    if (!b.idVerified) missing.push("ID not verified");
    if (!b.insuranceVerified) missing.push("insurance not verified");

    const verified: string[] = [];
    if (b.idVerified) verified.push("ID verified");
    if (b.insuranceVerified) verified.push("insurance verified");

    const detail = [...verified.map((v) => `✓ ${v}`), ...missing.map((m) => `✗ ${m}`)].join(" · ");

    flags.push({
      id: nextFlagId(),
      type: "unverified-renter",
      severity: "high",
      bookingIds: [b.id],
      carId: b.carId,
      title: `Unverified renter for ${carName(b.carId)}`,
      detail: `${b.renterName} (${b.id}) starts ${formatDate(b.start)} — ${detail}.`,
      raisedAt: now.toISOString(),
      resolved: false,
    });
  }
  return flags;
}

// ─── Rule 3: Overdue payment → medium / high if >7 days ────────────
export function detectOverduePayments(bookings: Booking[], now: Date): Flag[] {
  const flags: Flag[] = [];
  const today = new Date(now.getTime());
  today.setHours(0, 0, 0, 0);

  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    if (b.amountPaid >= b.totalAmount) continue;
    const dueDate = new Date(b.paymentDueDate);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate >= today) continue;

    const daysLate = daysBetween(b.paymentDueDate, today.toISOString().slice(0, 10));
    const severity: Severity = daysLate > 7 ? "high" : "medium";
    const unpaid = b.totalAmount - b.amountPaid;

    flags.push({
      id: nextFlagId(),
      type: "overdue-payment",
      severity,
      bookingIds: [b.id],
      carId: b.carId,
      title: `Overdue payment — ${carName(b.carId)}`,
      detail: `$${unpaid} of $${b.totalAmount} unpaid · ${daysLate} day${daysLate > 1 ? "s" : ""} overdue. Renter: ${b.renterName} (${b.id}).`,
      raisedAt: now.toISOString(),
      resolved: false,
    });
  }
  return flags;
}

// ─── Rule 4: No turnaround → medium ────────────────────────────────
export function detectNoTurnaround(bookings: Booking[], now: Date): Flag[] {
  const flags: Flag[] = [];
  const active = bookings.filter((b) => b.status !== "cancelled");

  // Group by car
  const byCar = new Map<string, Booking[]>();
  for (const b of active) {
    const arr = byCar.get(b.carId) ?? [];
    arr.push(b);
    byCar.set(b.carId, arr);
  }

  for (const [carId, carBookings] of byCar) {
    // Sort by start date
    const sorted = [...carBookings].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const prev = sorted[i];
      const next = sorted[i + 1];
      const gap = hoursBetween(prev.end, next.start);

      if (gap >= 0 && gap < 6) {
        flags.push({
          id: nextFlagId(),
          type: "no-turnaround",
          severity: "medium",
          bookingIds: [prev.id, next.id],
          carId,
          title: `No cleaning buffer — ${carName(carId)}`,
          detail: `Return ${formatTime(prev.end)} · next pickup ${formatTime(next.start)} — ${gap.toFixed(1)}h gap, no time for cleaning. (${prev.id} → ${next.id})`,
          raisedAt: now.toISOString(),
          resolved: false,
        });
      }
    }
  }
  return flags;
}

// ─── Run all rules ─────────────────────────────────────────────────
export function generateAllFlags(bookings: Booking[], now?: Date): Flag[] {
  const timestamp = now ?? new Date();
  resetFlagCounter();
  const all = [
    ...detectOverlaps(bookings, timestamp),
    ...detectUnverifiedRenters(bookings, timestamp),
    ...detectOverduePayments(bookings, timestamp),
    ...detectNoTurnaround(bookings, timestamp),
  ];

  // Sort: critical first, then high, then medium; within same severity, most recent first
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };
  return all.sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    if (sev !== 0) return sev;
    return new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime();
  });
}
