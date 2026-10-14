// app/api/invoices/[id]/route.ts
// Next 15+/16: the dynamic `params` is a Promise and must be awaited.
import { json } from "@/lib/server/http";
import { paymentUriForInvoice, reconcileInvoice } from "@/lib/server/payments";
import { qrSvg } from "@/lib/server/qr";
import { getPaymentWatcher } from "@/lib/zec/watcher";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await reconcileInvoice(id);
  if (!result) return json({ error: "not found" }, 404);
  const uri = paymentUriForInvoice(result.invoice);
  return json({
    invoice: result.invoice,
    payment: result.payment ?? null,
    paymentUri: uri,
    paymentQrSvg: await qrSvg(uri),
    // If a proof was already generated, hand the checkout its link so it does
    // not ask the payee to generate another one.
    proofPath: result.invoice.disclosureId
      ? `/verify/${result.invoice.disclosureId}`
      : null,
    // Which scanner is active. The checkout shows this so a misconfigured
    // live-scan mode is visible instead of silently never settling.
    watcher: getPaymentWatcher().id,
  });
}
