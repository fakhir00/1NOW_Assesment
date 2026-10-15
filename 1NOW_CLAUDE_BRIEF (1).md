# Build Brief for Claude Code — Carisma Flag Inbox

You are building a take-home assessment project. Read this whole brief before writing any code.

## Mission
Build "Flag Inbox" — a morning triage screen for a car-rental fleet operator. 1Now is direct-booking SaaS for Turo hosts (their own storefront, calendar, renter verification, payments, $0 platform fee). Carisma is their AI ops-manager agent that "watches every booking and flags what needs you." This feature is the operator-facing screen for those flags: everything needing attention, ranked by severity, with one-click resolution.

## How we work — follow strictly
1. Build in the 8 steps listed below, **one step at a time**. Complete a step, commit it, then **stop and report** what was done. Do not start the next step until directed.
2. One commit per step, with a clear message (e.g. `seed data + types`, `flag engine: four rules`).
3. TypeScript strict. No `any` leaks, no placeholder logic — every flag must trace to a real rule and real seed bookings.
4. Seed dates must be generated **relative to today** so the demo works on any run date. Never hardcode absolute dates in seeds.
5. Do not add anything in "Out of scope." If a step tempts you to add auth, a database, or real API calls — stop, that's scope creep.
6. Keep the UI clean and minimal: severity color dot, plain-language titles, one clear action per flag. No design-system overengineering.

## Build steps
1. Scaffold Next.js + TypeScript app. Create the types (below). Write the seed generator (8 cars, ~30 bookings, planted scenarios per spec). Include a sanity script that prints flag counts per scenario. Commit: `seed data + types`.
2. Flag engine: four pure functions (one per rule), each taking bookings and returning flags with severity. Commit: `flag engine: four rules`.
3. Inbox list UI: flag cards (severity dot, title, car, booking ref, relative time), severity summary chips in the header. Ordered by severity, then recency. Commit: `inbox list UI`.
4. Filters: by flag type and by severity, with counts on each filter. Commit: `inbox filters`.
5. Flag detail view: involved booking(s), renter, amounts paid vs due, verification checklist, exact reason the flag fired, suggested next action. Overlap flags show both bookings with a date strip. Commit: `flag detail view`.
6. Resolve flow: "Mark resolved" + optional note; resolved flags move to a "Resolved today" log with timestamp and note. Commit: `resolve flow`.
7. README: exact commands to install and run, plus the "Out of scope" list with reasons. Commit: `readme + docs`.
8. Self-verification: fresh install in a clean directory, run, walk the demo path (open inbox → filter to critical → open overlap → resolve with note → check "Resolved today"). Report any failure instead of committing.

## Data model
```ts
type Car = { id: string; name: string; plate: string; dailyRate: number; status: "active" | "maintenance" };
type Booking = {
  id: string; carId: string; renterName: string;
  start: string; end: string;              // ISO dates
  source: "turo" | "direct";
  status: "confirmed" | "in-progress" | "completed" | "cancelled";
  totalAmount: number; amountPaid: number; // USD
  paymentDueDate: string;                  // ISO date
  idVerified: boolean; insuranceVerified: boolean;
};
type FlagType = "overlap" | "unverified-renter" | "overdue-payment" | "no-turnaround";
type Severity = "critical" | "high" | "medium";
type Flag = {
  id: string; type: FlagType; severity: Severity;
  bookingIds: string[]; carId: string;
  title: string; detail: string;           // human-readable, names the specifics
  raisedAt: string; resolved: boolean; resolvedNote?: string;
};
```

## Seed data
8 cars (Tesla Model 3, Jeep Wrangler, Toyota Camry, Honda Civic, BMW 3 Series, Ford Mustang, Hyundai Elantra, Nissan Altima). ~30 bookings over a 3-week window around today. Plant exactly:
- 2 overlaps: same car, intersecting ranges, cross-source (one `turo`, one `direct`)
- 3 unverified renters: start within 48h, one missing ID, one missing insurance, one missing both
- 3 overdue payments: 2 recent, 1 more than 7 days late
- 2 no-turnaround pairs: next pickup under 6h after previous return
- remainder: clean bookings (verified, paid, spaced)

## Flag rules (exact)
1. **overlap → critical.** Same car, both not cancelled, `a.start < b.end && b.start < a.end`. Detail example: "BK-014 (Turo) and BK-022 (direct) both claim the Jeep Wrangler, Oct 16–18."
2. **unverified-renter → high.** Starts within 48h, status confirmed/in-progress, `!idVerified || !insuranceVerified`. Detail names what's missing: "ID verified · insurance pending."
3. **overdue-payment → medium, high if > 7 days late.** `amountPaid < totalAmount`, due date past, not cancelled. Detail: "$180 of $540 unpaid · 9 days overdue."
4. **no-turnaround → medium.** Consecutive non-cancelled bookings on one car, `next.start - prev.end < 6h`. Detail: "Return 10:00 AM · next pickup 1:30 PM — no cleaning buffer."

## Screens
1. **Inbox** — header with today's date + "N flags need you", severity summary chips, filter bar (All / 4 types / 3 severities), flag cards.
2. **Flag detail** — everything about the flag (see step 5).
3. **Resolved today** — cleared flags with timestamp + note. Empty states for "all clear" and empty filters.

## Out of scope — do not build
- Login/auth (1Now has its own identity layer)
- Real payments or PCI surface (mock amounts only)
- Database/persistence (in-memory seeds)
- Real Turo API (mock the import; the conflict logic is what's demoed)
- AI-based triage (deterministic rules; AI triage is documented future work)

## Definition of done
- Fresh `install → run` works with no env config
- Sanity script confirms planted counts: 2 overlaps, 3 unverified, 3 overdue, 2 no-turnaround (10 flags: 2 critical, 4 high, 4 medium)
- Every flag detail traces to the bookings and rule that raised it
- Filters, resolve flow, and "Resolved today" all work first try
- README has exact run commands and the out-of-scope list

## Begin
Do **Step 1 only**. When done, commit and report back: what was scaffolded, the file layout, and the sanity script's output. Then wait for direction.
