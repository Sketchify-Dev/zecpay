// lib/zec/format.ts
// Small display helpers for the UI. Formatting stays separate from the money
// math in amount.ts so the latter has no presentational concerns.

import { formatZatoshiToZec } from "./amount";
import type { PaymentStatus } from "./types";

/** Render a zatoshi amount for display, e.g. "1.5 ZEC". */
export function formatZec(
  zat: string | bigint,
  opts: { symbol?: boolean } = {},
): string {
  const value = typeof zat === "bigint" ? zat : BigInt(zat);
  const text = formatZatoshiToZec(value);
  return opts.symbol === false ? text : `${text} ZEC`;
}

/** Truncate a long address (e.g. a Unified Address) for compact display. */
export function shortAddress(addr: string, lead = 10, tail = 6): string {
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}...${addr.slice(-tail)}`;
}

/** Human label and a semantic tone for an invoice status, for badges. */
export function statusLabel(status: PaymentStatus): {
  label: string;
  tone: "pending" | "progress" | "success" | "error" | "muted";
} {
  switch (status) {
    case "pending":
      return { label: "Awaiting payment", tone: "pending" };
    case "detected":
      return { label: "Payment detected", tone: "progress" };
    case "confirmed":
      return { label: "Paid", tone: "success" };
    case "expired":
      return { label: "Expired", tone: "error" };
    case "cancelled":
      return { label: "Cancelled", tone: "muted" };
    case "failed":
      return { label: "Failed", tone: "error" };
  }
}
