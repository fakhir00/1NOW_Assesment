import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carisma Flag Inbox — 1Now",
  description:
    "Morning triage screen for fleet operators. See every booking that needs attention, ranked by severity, with one-click resolution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
