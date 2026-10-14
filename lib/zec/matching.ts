// lib/zec/matching.ts
// Shared payment-matching logic, kept separate from the watcher
// implementations so both the mock and the real (Ledger/zingolib) watchers can
// import it without creating an import cycle.
//
// The backend scanner stays dumb: it just returns decrypted incoming notes.
// Matching a note to an invoice (ZecPay order memo -> invoice id, exact
// amount) lives here, in pure, testable TypeScript.

import { parseOrderMemo } from "./memo";
import type { DetectedPayment, Invoice } from "./types";

/** Confirmations required before an invoice is treated as settled (demo value). */
export const REQUIRED_CONFIRMATIONS = 1;

export function statusFromPayment(p: DetectedPayment): "detected" | "confirmed" {
  return p.confirmations >= REQUIRED_CONFIRMATIONS ? "confirmed" : "detected";
}

/** A decrypted incoming note as returned by a scanner (mock or real). */
export interface RawNote {
  txid: string;
  amountZat: string;
  memo: string;
  height?: number;
  confirmations: number;
}

/**
 * Match raw decrypted notes to invoices by ZecPay order memo and exact amount.
 * Pure and shared; the exact-amount rule keeps the demo simple (over/underpay
 * handling can be added later).
 */
export function matchNotes(
  notes: RawNote[],
  invoices: Invoice[],
): DetectedPayment[] {
  const byId = new Map(invoices.map((i) => [i.id, i]));
  const out: DetectedPayment[] = [];
  for (const note of notes) {
    const parsed = parseOrderMemo(note.memo);
    if (!parsed) continue;
    const inv = byId.get(parsed.invoiceId);
    if (!inv) continue;
    if (note.amountZat !== inv.amountZat) continue;
    out.push({
      invoiceId: inv.id,
      txid: note.txid,
      amountZat: note.amountZat,
      memo: note.memo,
      height: note.height,
      confirmations: note.confirmations,
    });
  }
  return out;
}
