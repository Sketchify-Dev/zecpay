// lib/server/webhooks.ts
// Best-effort merchant webhook delivery. Fires when an invoice moves to
// detected or confirmed. The payload carries only what a merchant needs to
// reconcile (ids, status, amount, tx). It never includes viewing keys, seed
// material, memos, or addresses. Failures are swallowed: a dead webhook URL
// must never break the payment flow.

import type { Invoice } from "@/lib/zec/types";

export interface WebhookPayload {
  event: "invoice.detected" | "invoice.confirmed";
  invoiceId: string;
  merchantId: string;
  status: "detected" | "confirmed";
  amountZat: string;
  txid?: string;
  occurredAt: string;
}

export function buildWebhookPayload(invoice: Invoice): WebhookPayload | null {
  if (invoice.status !== "detected" && invoice.status !== "confirmed") {
    return null;
  }
  return {
    event: invoice.status === "confirmed" ? "invoice.confirmed" : "invoice.detected",
    invoiceId: invoice.id,
    merchantId: invoice.merchantId,
    status: invoice.status,
    amountZat: invoice.amountZat,
    txid: invoice.txid,
    occurredAt: new Date().toISOString(),
  };
}

/** Fire-and-forget POST with a short timeout. Never throws. */
export function dispatchWebhook(url: string, payload: WebhookPayload): void {
  try {
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      // Dead endpoints must not break payments.
    });
  } catch {
    // Invalid URL or sync fetch failure: ignore.
  }
}
