// lib/server/payments.ts
// Server-side payment helpers shared by the API routes: build an invoice's
// ZIP 321 URI, reconcile it against the watcher, and expose a safe merchant
// view (never leaking the viewing key).

import { memoBytesToBase64Url, textToMemoBytes } from "@/lib/zec/memo";
import { invoiceStore, merchantStore } from "@/lib/zec/store";
import type { DetectedPayment, Invoice, MerchantAccount } from "@/lib/zec/types";
import { getPaymentWatcher, statusFromPayment } from "@/lib/zec/watcher";
import { buildPaymentUri } from "@/lib/zec/zip321";
import { buildWebhookPayload, dispatchWebhook } from "@/lib/server/webhooks";

/** Build the ZIP 321 payment URI (QR / wallet link) for an invoice. */
export function paymentUriForInvoice(invoice: Invoice): string {
  const memoBase64Url = memoBytesToBase64Url(textToMemoBytes(invoice.memoToken));
  return buildPaymentUri({
    address: invoice.address,
    amountZat: BigInt(invoice.amountZat),
    memoBase64Url,
    message: `ZecPay invoice ${invoice.id}`,
  });
}

/**
 * Poll the watcher for a single invoice and fold any detected payment into the
 * store. Returns the (possibly updated) invoice, or null if it does not exist.
 */
export async function reconcileInvoice(invoiceId: string): Promise<{
  invoice: Invoice;
  payment?: DetectedPayment;
} | null> {
  const invoice = invoiceStore.get(invoiceId);
  if (!invoice) return null;

  if (
    invoice.status === "pending" &&
    Date.parse(invoice.expiresAt) < Date.now()
  ) {
    return { invoice: invoiceStore.update(invoiceId, { status: "expired" }) };
  }
  if (
    invoice.status === "confirmed" ||
    invoice.status === "expired" ||
    invoice.status === "cancelled"
  ) {
    return { invoice };
  }

  const merchant = merchantStore.get(invoice.merchantId);
  if (!merchant) return { invoice };

  const payments = await getPaymentWatcher().poll(merchant, [invoice]);
  const payment = payments.find((p) => p.invoiceId === invoiceId);
  if (!payment) return { invoice };

  const status = statusFromPayment(payment);
  const patch: Partial<Pick<Invoice, "status" | "txid" | "paidAt">> = {
    status,
    txid: payment.txid,
  };
  if (status === "confirmed" && !invoice.paidAt) {
    patch.paidAt = new Date().toISOString();
  }
  const statusChanged = invoice.status !== status;
  const updated = invoiceStore.update(invoiceId, patch);
  if (statusChanged) {
    const payload = buildWebhookPayload(updated);
    if (payload && merchant.webhookUrl) {
      dispatchWebhook(merchant.webhookUrl, payload);
    }
  }
  return { invoice: updated, payment };
}

/** A merchant view safe to return over the API (no viewing key). */
export function toPublicMerchant(m: MerchantAccount) {
  return {
    id: m.id,
    name: m.name,
    network: m.network,
    address: m.address,
    createdAt: m.createdAt,
  };
}
