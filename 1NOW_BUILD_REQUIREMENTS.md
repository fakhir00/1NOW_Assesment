# Build Requirements Document — Carisma Flag Inbox
**Product:** 1Now (assessment build) · **Author:** Muhammad Fakhir Baig · **Date:** 2026-10-15 · **Version:** 1.0

---

## 1. Problem

1Now gives Turo hosts a direct-booking business: their own storefront, calendar, renter verification, and payments with $0 platform fee. Carisma, the AI ops manager inside 1Now, "watches every booking and flags what needs you" and "nudges you only when a decision is needed."

The gap: the flags exist, but the operator has no single screen to triage them. A host running 10–25 cars starts the day across scattered views — the calendar, the booking list, payment records, verification statuses. Three failure modes cost real money every week:

1. **Double bookings.** A Turo trip and a direct booking land on the same car because the two calendars drift. The operator finds out at pickup time: a cancelled trip, a refund, a bad review.
2. **Unverified renters.** ID or insurance verification never completed, and the booking starts in hours. Keys can't go out, the car sits idle, the slot is lost.
3. **Uncollected payments.** Balances past due with no follow-up. Small leaks per booking, large leak per month.

There is no morning routine for this. The operator reacts instead of triaging.

## 2. Goals and non-goals

**Goals**
- One screen where the operator sees everything that needs attention, ordered by severity.
- Each flag explains itself: what is wrong, which bookings and car are involved, what to do next.
- One-click resolution with a note, and a visible record of the morning's cleared work.
- A working demo end to end in ~90 seconds.

**Non-goals**
- Replacing 1Now's calendar, booking flow, or verification system — this sits on top of them.
- Real AI triage — deterministic rules for the demo, with AI triage as the documented next step.
- Anything requiring auth, real money movement, or a database (see §8).

## 3. Solution overview

The Flag Inbox: a morning triage screen for Carisma-style booking flags.

User story: *As a fleet operator, I open the inbox each morning, see every booking that needs my attention ranked by severity, filter by problem type, open a flag to see exactly what's wrong, and clear it with one click — so nothing that costs me money slips through the day.*

Flow: open inbox → severity summary ("10 flags need you") → filter or scan → open flag detail → take action / mark resolved → flag moves to "Resolved today."

## 4. Functional requirements

**FR-1 — Flag engine.** Four deterministic rules evaluated over the booking set (exact conditions):
- FR-1.1 Overlap → *critical*. Two non-cancelled bookings, same car, intersecting date ranges (`a.start < b.end && b.start < a.end`).
- FR-1.2 Unverified renter → *high*. Booking starts within 48 hours, status confirmed/in-progress, ID or insurance unverified. Detail names what's missing.
- FR-1.3 Overdue payment → *medium*, escalating to *high* past 7 days. `amountPaid < totalAmount`, due date in the past, not cancelled.
- FR-1.4 No turnaround → *medium*. Consecutive non-cancelled bookings on one car with under 6 hours between return and next pickup.

**FR-2 — Inbox.** Flag cards showing severity indicator, title, car, booking reference(s), and relative time. Ordered by severity, then recency.

**FR-3 — Filters.** Filter by flag type (all four) and by severity (critical/high/medium). Counts visible on each filter.

**FR-4 — Flag detail.** On selection: the involved booking(s), renter name, amounts paid vs due, verification checklist, the exact reason the flag fired, and a suggested next action. Overlap flags show both bookings with a date strip making the conflict visible.

**FR-5 — Resolve.** "Mark resolved" with an optional note. Resolved flags leave the active list and appear in a "Resolved today" log with timestamp and note.

**FR-6 — Seed data.** 8 cars, ~30 bookings over a 3-week window, dates generated relative to the current date so flags fire on any run. Planted: 2 overlaps (cross-source: one Turo, one direct), 3 unverified renters, 3 overdue payments, 2 no-turnaround pairs; remainder clean.

**FR-7 — Empty states.** "All clear" state when no active flags; empty filter results state.

## 5. Non-functional requirements

- **NFR-1 Demo reliability.** `clone → install → run` works on a fresh machine with no env config; the demo path (open inbox → filter → open → resolve) works first try, every time.
- **NFR-2 Honest data.** Every flag must be traceable to a rule and the bookings that triggered it — no hand-waved entries.
- **NFR-3 Usability.** An operator understands each flag without documentation: severity color, plain-language title, one clear action.
- **NFR-4 Performance.** Inbox renders instantly on the seeded dataset; the rule engine is O(n²) worst case on overlaps, trivial at this scale.

## 6. Data model

`Car`, `Booking`, `Flag` with `FlagType` (`overlap | unverified-renter | overdue-payment | no-turnaround`) and `Severity` (`critical | high | medium`). Full type definitions: `1NOW_PAPER_PLAN.md`.

## 7. Method

**Stack:** Next.js + TypeScript — the role's stack, one deployable app, no separate backend needed.

**Architecture (three layers):**
1. *Data layer* — seeded, typed JSON generated relative to today; in-memory, no database.
2. *Rule engine* — pure functions, one per flag type, each taking the booking set and returning flags. No side effects, trivially testable.
3. *UI layer* — inbox, filters, detail, resolve flow, resolved log. Server-rendered list, client interactivity for filters and resolve.

**AI-assisted workflow (per the assessment's rule — Claude/Claude Code only):**
1. Plan on paper first — data model, rules, screens — before opening the editor (this document and the paper plan are that step).
2. Build in small directed steps, one commit each: scaffold + seeds → rule engine → inbox UI → filters → detail → resolve → README → fresh-clone verification.
3. Review every diff before accepting; the commit history shows direction ("add overlap rule", "cut auth scope"), not just usage.

**Verification:**
- A sanity script asserts the seeds produce exactly the planted flag counts (2/3/3/2).
- Fresh-clone test: clone to a new directory, install, run, walk the demo path.
- README documents exact run commands and §8's scope cuts.

## 8. Out of scope (and why)

| Left out | Reason |
|---|---|
| Login/auth | 1Now has its own identity layer; adds nothing to a feature demo |
| Real payments | Mock amounts; no PCI surface in a demo |
| Database/persistence | In-memory seeds; a DB changes nothing the demo shows |
| Real Turo API sync | The conflict *logic* is what's demoed; the import is mocked |
| AI-based triage | Rules are honest and testable for the demo; Claude-assisted triage is the natural next step |

## 9. Acceptance criteria

- [ ] Fresh clone → install → run with no extra setup
- [ ] Inbox shows 10 flags with correct severity counts (2 critical, 4 high, 4 medium)
- [ ] Each flag's detail traces to the exact bookings and rule that raised it
- [ ] Filters narrow the list correctly by type and severity
- [ ] Resolving a flag moves it to "Resolved today" with note and timestamp
- [ ] Overlap detail visually shows the conflicting date ranges
- [ ] README lists run commands and the §8 scope cuts
- [ ] Loom ≤ 3 min: intro, problem, live demo, what's real vs left out

## 10. Demo script (≤ 3:00)

- 0:00–0:30 — Intro: who I am; why 1Now (hosts going direct off Turo's ~25% cut is a business worth building on).
- 0:30–1:00 — Problem: operators lose money to double bookings, unverified renters, uncollected payments; Carisma flags them, but there's no triage screen. This is that screen.
- 1:00–2:30 — Live: open inbox, severity summary, filter to critical, open the overlap, show both bookings, mark resolved with a note, watch it land in "Resolved today."
- 2:30–3:00 — What's real vs left out and why; what ships next (Claude-assisted triage, real Turo sync, persistence).

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Seed dates rot (flags stop firing) | Dates generated relative to today |
| Scope creep (auth, DB, "just one more flag") | §8 locked before building; cut list stated in README/Loom |
| Demo fails on reviewer's machine | Fresh-clone verification before recording; exact commands in README |
| AI output drift (wrong rule logic) | Sanity script asserts planted counts; every diff reviewed |

## 12. Future work (not in this build)

Claude-assisted flag triage and suggested resolutions; real Turo calendar import; persistent flag history per operator; notifications (SMS/email) for critical flags; per-car profit impact per flag ("this overlap risks $X").
