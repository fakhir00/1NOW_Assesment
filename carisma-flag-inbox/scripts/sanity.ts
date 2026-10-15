/**
 * Sanity script — verifies the seed data produces exactly the expected flag counts.
 *
 * Run:  npx tsx scripts/sanity.ts
 */

import { bookings } from "../src/lib/seeds";
import {
  detectOverlaps,
  detectUnverifiedRenters,
  detectOverduePayments,
  detectNoTurnaround,
  generateAllFlags,
  resetFlagCounter,
} from "../src/lib/flag-engine";

const now = new Date();

// ── Run each rule independently ──────────────────────────────────
resetFlagCounter();

const overlaps = detectOverlaps(bookings, now);
const unverified = detectUnverifiedRenters(bookings, now);
const overdue = detectOverduePayments(bookings, now);
const noTurnaround = detectNoTurnaround(bookings, now);

console.log("\n╔═══════════════════════════════════════════════════╗");
console.log("║          CARISMA FLAG INBOX — SANITY CHECK        ║");
console.log("╚═══════════════════════════════════════════════════╝\n");

const results = [
  { label: "Overlaps", got: overlaps.length, expected: 2 },
  { label: "Unverified renters", got: unverified.length, expected: 3 },
  { label: "Overdue payments", got: overdue.length, expected: 3 },
  { label: "No-turnaround", got: noTurnaround.length, expected: 2 },
];

let allPassed = true;

for (const { label, got, expected } of results) {
  const pass = got === expected;
  const icon = pass ? "✓" : "✗";
  const color = pass ? "\x1b[32m" : "\x1b[31m";
  console.log(`  ${color}${icon}\x1b[0m ${label}: ${got} (expected ${expected})`);
  if (!pass) allPassed = false;
}

// ── Check severity breakdown ─────────────────────────────────────
resetFlagCounter();
const allFlags = generateAllFlags(bookings, now);
const total = allFlags.length;
const critical = allFlags.filter((f) => f.severity === "critical").length;
const high = allFlags.filter((f) => f.severity === "high").length;
const medium = allFlags.filter((f) => f.severity === "medium").length;

console.log("");
console.log(`  Total flags: ${total} (expected 10)`);
console.log(`  Critical: ${critical} (expected 2) · High: ${high} (expected 4) · Medium: ${medium} (expected 4)`);

if (total !== 10 || critical !== 2 || high !== 4 || medium !== 4) {
  allPassed = false;
}

console.log("");
if (allPassed) {
  console.log("  \x1b[32m✓ ALL CHECKS PASSED\x1b[0m\n");
} else {
  console.log("  \x1b[31m✗ SOME CHECKS FAILED\x1b[0m\n");
  process.exit(1);
}

// ── Print flag details for inspection ────────────────────────────
console.log("  ─── Flag details ───\n");
for (const flag of allFlags) {
  console.log(`  [${flag.severity.toUpperCase()}] ${flag.title}`);
  console.log(`    ${flag.detail}`);
  console.log(`    Bookings: ${flag.bookingIds.join(", ")} | Car: ${flag.carId}\n`);
}
