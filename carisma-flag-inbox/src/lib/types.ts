// === Core domain types ===

export type Car = {
  id: string;
  name: string;
  plate: string;
  dailyRate: number;
  status: "active" | "maintenance";
};

export type Booking = {
  id: string;
  carId: string;
  renterName: string;
  start: string; // ISO date
  end: string; // ISO date
  source: "turo" | "direct";
  status: "confirmed" | "in-progress" | "completed" | "cancelled";
  totalAmount: number; // USD
  amountPaid: number; // USD
  paymentDueDate: string; // ISO date
  idVerified: boolean;
  insuranceVerified: boolean;
};

export type FlagType =
  | "overlap"
  | "unverified-renter"
  | "overdue-payment"
  | "no-turnaround";

export type Severity = "critical" | "high" | "medium";

export type Flag = {
  id: string;
  type: FlagType;
  severity: Severity;
  bookingIds: string[];
  carId: string;
  title: string;
  detail: string; // human-readable, names the specifics
  raisedAt: string; // ISO datetime
  resolved: boolean;
  resolvedAt?: string; // ISO datetime
  resolvedNote?: string;
};
