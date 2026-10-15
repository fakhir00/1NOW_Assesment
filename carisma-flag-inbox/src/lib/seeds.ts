import { Car, Booking } from "./types";

// ─── Helpers ───────────────────────────────────────────────────────
/** ISO date string for today + offsetDays */
function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** ISO datetime string for today + offsetDays at the given hour */
function isoDateTime(offsetDays: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── Cars ──────────────────────────────────────────────────────────
export const cars: Car[] = [
  { id: "CAR-01", name: "Tesla Model 3", plate: "TES-3001", dailyRate: 120, status: "active" },
  { id: "CAR-02", name: "Jeep Wrangler", plate: "JEP-4002", dailyRate: 95, status: "active" },
  { id: "CAR-03", name: "Toyota Camry", plate: "TOY-5003", dailyRate: 70, status: "active" },
  { id: "CAR-04", name: "Honda Civic", plate: "HON-6004", dailyRate: 65, status: "active" },
  { id: "CAR-05", name: "BMW 3 Series", plate: "BMW-7005", dailyRate: 110, status: "active" },
  { id: "CAR-06", name: "Ford Mustang", plate: "FRD-8006", dailyRate: 100, status: "active" },
  { id: "CAR-07", name: "Hyundai Elantra", plate: "HYN-9007", dailyRate: 55, status: "active" },
  { id: "CAR-08", name: "Nissan Altima", plate: "NIS-1008", dailyRate: 60, status: "active" },
];

// ─── Bookings ──────────────────────────────────────────────────────
// ~30 bookings over 3-week window. Planted scenarios first, then clean filler.

export const bookings: Booking[] = [
  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  OVERLAP 1: CAR-01 (Tesla Model 3) — days 1-3 overlap         ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-001", carId: "CAR-01", renterName: "Sarah Mitchell",
    start: isoDate(1), end: isoDate(4), source: "turo",
    status: "confirmed", totalAmount: 360, amountPaid: 360,
    paymentDueDate: isoDate(-1), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-002", carId: "CAR-01", renterName: "James Cooper",
    start: isoDate(2), end: isoDate(5), source: "direct",
    status: "confirmed", totalAmount: 360, amountPaid: 360,
    paymentDueDate: isoDate(0), idVerified: true, insuranceVerified: true,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  OVERLAP 2: CAR-02 (Jeep Wrangler) — days 0-2 overlap          ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-003", carId: "CAR-02", renterName: "Lisa Park",
    start: isoDate(0), end: isoDate(3), source: "turo",
    status: "confirmed", totalAmount: 285, amountPaid: 285,
    paymentDueDate: isoDate(-2), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-004", carId: "CAR-02", renterName: "David Kim",
    start: isoDate(1), end: isoDate(4), source: "direct",
    status: "in-progress", totalAmount: 285, amountPaid: 285,
    paymentDueDate: isoDate(-1), idVerified: true, insuranceVerified: true,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  UNVERIFIED RENTER 1: CAR-03 — missing ID only                  ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-005", carId: "CAR-03", renterName: "Amy Chen",
    start: isoDate(1), end: isoDate(4), source: "direct",
    status: "confirmed", totalAmount: 210, amountPaid: 210,
    paymentDueDate: isoDate(-1), idVerified: false, insuranceVerified: true,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  UNVERIFIED RENTER 2: CAR-04 — missing insurance only           ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-006", carId: "CAR-04", renterName: "Marcus Johnson",
    start: isoDate(0), end: isoDate(2), source: "turo",
    status: "confirmed", totalAmount: 130, amountPaid: 130,
    paymentDueDate: isoDate(-1), idVerified: true, insuranceVerified: false,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  UNVERIFIED RENTER 3: CAR-05 — missing both                     ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-007", carId: "CAR-05", renterName: "Nina Patel",
    start: isoDate(0), end: isoDate(3), source: "direct",
    status: "in-progress", totalAmount: 330, amountPaid: 330,
    paymentDueDate: isoDate(-2), idVerified: false, insuranceVerified: false,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  OVERDUE PAYMENT 1: CAR-06 — 3 days overdue (medium)            ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-008", carId: "CAR-06", renterName: "Tyler Brooks",
    start: isoDate(-5), end: isoDate(-2), source: "direct",
    status: "completed", totalAmount: 300, amountPaid: 100,
    paymentDueDate: isoDate(-3), idVerified: true, insuranceVerified: true,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  OVERDUE PAYMENT 2: CAR-07 — 5 days overdue (medium)            ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-009", carId: "CAR-07", renterName: "Rachel Torres",
    start: isoDate(-8), end: isoDate(-5), source: "turo",
    status: "completed", totalAmount: 165, amountPaid: 55,
    paymentDueDate: isoDate(-5), idVerified: true, insuranceVerified: true,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  OVERDUE PAYMENT 3: CAR-08 — 9 days overdue (high, >7 days)     ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-010", carId: "CAR-08", renterName: "Carlos Mendez",
    start: isoDate(-12), end: isoDate(-9), source: "direct",
    status: "completed", totalAmount: 180, amountPaid: 60,
    paymentDueDate: isoDate(-9), idVerified: true, insuranceVerified: true,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  NO-TURNAROUND 1: CAR-03 — return 10 AM, next pickup 1 PM       ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-011", carId: "CAR-03", renterName: "Derek Olson",
    start: isoDate(5), end: isoDateTime(8, 10), source: "turo",
    status: "confirmed", totalAmount: 210, amountPaid: 210,
    paymentDueDate: isoDate(3), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-012", carId: "CAR-03", renterName: "Hannah West",
    start: isoDateTime(8, 13), end: isoDate(11), source: "direct",
    status: "confirmed", totalAmount: 210, amountPaid: 210,
    paymentDueDate: isoDate(6), idVerified: true, insuranceVerified: true,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  NO-TURNAROUND 2: CAR-04 — return 2 PM, next pickup 5 PM        ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-013", carId: "CAR-04", renterName: "Eric Nguyen",
    start: isoDate(6), end: isoDateTime(9, 14), source: "direct",
    status: "confirmed", totalAmount: 195, amountPaid: 195,
    paymentDueDate: isoDate(4), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-014", carId: "CAR-04", renterName: "Sofia Ramirez",
    start: isoDateTime(9, 17), end: isoDate(12), source: "turo",
    status: "confirmed", totalAmount: 195, amountPaid: 195,
    paymentDueDate: isoDate(7), idVerified: true, insuranceVerified: true,
  },

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  CLEAN BOOKINGS — remainder to reach ~30                          ║
  // ╚══════════════════════════════════════════════════════════════════╝
  {
    id: "BK-015", carId: "CAR-01", renterName: "Olivia Chang",
    start: isoDate(7), end: isoDate(10), source: "direct",
    status: "confirmed", totalAmount: 360, amountPaid: 360,
    paymentDueDate: isoDate(5), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-016", carId: "CAR-02", renterName: "Ben Wallace",
    start: isoDate(6), end: isoDate(9), source: "turo",
    status: "confirmed", totalAmount: 285, amountPaid: 285,
    paymentDueDate: isoDate(4), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-017", carId: "CAR-05", renterName: "Julia Foster",
    start: isoDate(5), end: isoDate(8), source: "turo",
    status: "confirmed", totalAmount: 330, amountPaid: 330,
    paymentDueDate: isoDate(3), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-018", carId: "CAR-06", renterName: "Sam Patel",
    start: isoDate(1), end: isoDate(4), source: "turo",
    status: "confirmed", totalAmount: 300, amountPaid: 300,
    paymentDueDate: isoDate(-1), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-019", carId: "CAR-07", renterName: "Mia Rodriguez",
    start: isoDate(2), end: isoDate(5), source: "direct",
    status: "confirmed", totalAmount: 165, amountPaid: 165,
    paymentDueDate: isoDate(0), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-020", carId: "CAR-08", renterName: "Lucas Anderson",
    start: isoDate(3), end: isoDate(6), source: "turo",
    status: "confirmed", totalAmount: 180, amountPaid: 180,
    paymentDueDate: isoDate(1), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-021", carId: "CAR-01", renterName: "Emma Diaz",
    start: isoDate(-7), end: isoDate(-4), source: "turo",
    status: "completed", totalAmount: 360, amountPaid: 360,
    paymentDueDate: isoDate(-9), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-022", carId: "CAR-02", renterName: "Noah Singh",
    start: isoDate(-6), end: isoDate(-3), source: "direct",
    status: "completed", totalAmount: 285, amountPaid: 285,
    paymentDueDate: isoDate(-8), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-023", carId: "CAR-03", renterName: "Ava Tanaka",
    start: isoDate(-10), end: isoDate(-7), source: "turo",
    status: "completed", totalAmount: 210, amountPaid: 210,
    paymentDueDate: isoDate(-12), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-024", carId: "CAR-04", renterName: "Liam Brown",
    start: isoDate(-9), end: isoDate(-6), source: "direct",
    status: "completed", totalAmount: 195, amountPaid: 195,
    paymentDueDate: isoDate(-11), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-025", carId: "CAR-05", renterName: "Chloe Martin",
    start: isoDate(-8), end: isoDate(-5), source: "turo",
    status: "completed", totalAmount: 330, amountPaid: 330,
    paymentDueDate: isoDate(-10), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-026", carId: "CAR-06", renterName: "Ethan Lee",
    start: isoDate(6), end: isoDate(9), source: "direct",
    status: "confirmed", totalAmount: 300, amountPaid: 300,
    paymentDueDate: isoDate(4), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-027", carId: "CAR-07", renterName: "Grace Kim",
    start: isoDate(7), end: isoDate(10), source: "turo",
    status: "confirmed", totalAmount: 165, amountPaid: 165,
    paymentDueDate: isoDate(5), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-028", carId: "CAR-08", renterName: "Ryan Davis",
    start: isoDate(-5), end: isoDate(-2), source: "turo",
    status: "completed", totalAmount: 180, amountPaid: 180,
    paymentDueDate: isoDate(-7), idVerified: true, insuranceVerified: true,
  },
  {
    id: "BK-029", carId: "CAR-05", renterName: "Isabella White",
    start: isoDate(10), end: isoDate(13), source: "direct",
    status: "confirmed", totalAmount: 330, amountPaid: 330,
    paymentDueDate: isoDate(8), idVerified: true, insuranceVerified: true,
  },
  // Cancelled booking — should be excluded from all rules
  {
    id: "BK-030", carId: "CAR-01", renterName: "Daniel Harris",
    start: isoDate(1), end: isoDate(3), source: "direct",
    status: "cancelled", totalAmount: 240, amountPaid: 0,
    paymentDueDate: isoDate(-1), idVerified: false, insuranceVerified: false,
  },
];
