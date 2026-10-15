# Carisma Flag Inbox — 1Now Assessment

A morning triage screen for fleet operators running 10–25 cars on 1Now. Carisma (the AI ops-manager) watches every booking and flags what needs attention — this is the operator-facing inbox for those flags.

## Quick Start

```bash
git clone <repo-url>
cd carisma-flag-inbox
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the inbox loads with 10 flags ready to triage.

### Verify the flag engine

```bash
npm run sanity
```

Asserts the seed data produces exactly:
- **2** overlaps (critical)
- **3** unverified renters (high)
- **3** overdue payments (1 high, 2 medium)
- **2** no-turnaround pairs (medium)
- **10 total** — 2 critical · 4 high · 4 medium

## Demo Path

1. Open the inbox — see "10 flags need your attention" with severity summary chips
2. Filter to **Critical** — see 2 double-booking flags
3. Click an overlap flag — see both bookings with a date strip showing the conflict, renter details, and a suggested next action
4. Type a note and click **Mark resolved** — the flag moves to the "Resolved today" log with timestamp and note
5. Return to **All** — see the remaining 9 flags

## Architecture

Three layers, one deployable Next.js app:

| Layer | Location | Purpose |
|---|---|---|
| Data | `src/lib/types.ts`, `src/lib/seeds.ts` | Typed domain model; 8 cars, 30 bookings with dates relative to today |
| Engine | `src/lib/flag-engine.ts` | Four pure rule functions — overlap, unverified-renter, overdue-payment, no-turnaround |
| UI | `app/page.tsx`, `app/components/` | Inbox list, filters, flag detail panel, resolve flow, resolved-today log |

### Flag Rules

| Rule | Severity | Condition |
|---|---|---|
| **Overlap** | Critical | Same car, both non-cancelled, `a.start < b.end && b.start < a.end` |
| **Unverified renter** | High | Starts within 48h, confirmed/in-progress, ID or insurance not verified |
| **Overdue payment** | Medium (High if >7 days) | `amountPaid < totalAmount`, due date past, not cancelled |
| **No turnaround** | Medium | Consecutive bookings on one car, gap < 6 hours |

## Tech Stack

- **Next.js 16** + TypeScript (strict mode)
- Vanilla CSS — dark mode, severity color system, staggered card animations
- In-memory seed data — no database, no env config

## Out of Scope (and why)

| Left out | Reason |
|---|---|
| Login / auth | 1Now has its own identity layer; adds nothing to a feature demo |
| Real payments | Mock amounts only; no PCI surface in a demo |
| Database / persistence | In-memory seeds; a DB changes nothing the demo shows |
| Real Turo API sync | The conflict *logic* is what's demoed; the import is mocked |
| AI-based triage | Deterministic rules are honest and testable; Claude-assisted triage is the documented next step |

## Future Work

- Claude-assisted flag triage and suggested resolutions
- Real Turo calendar import
- Persistent flag history per operator
- Notifications (SMS/email) for critical flags
- Per-car profit impact per flag ("this overlap risks $X")

## File Layout

```
carisma-flag-inbox/
├── app/
│   ├── components/
│   │   └── FlagDetail.tsx      # Detail panel with booking cards, date strip, resolve
│   ├── globals.css              # Design system: dark mode, severity colors, animations
│   ├── layout.tsx               # Root layout with SEO metadata
│   └── page.tsx                 # Inbox: flag list, filters, severity summary, resolved log
├── src/lib/
│   ├── types.ts                 # Car, Booking, Flag, FlagType, Severity
│   ├── seeds.ts                 # 8 cars, 30 bookings (dates relative to today)
│   └── flag-engine.ts           # Four pure detection rules + combined generator
├── scripts/
│   └── sanity.ts                # Asserts planted flag counts match spec
├── package.json
├── tsconfig.json
└── README.md
```
