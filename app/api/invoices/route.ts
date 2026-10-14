// app/api/invoices/route.ts
import { json } from "@/lib/server/http";
import { validateCreateInvoice } from "@/lib/server/invoices";
import { paymentUriForInvoice } from "@/lib/server/payments";
import { invoiceStore, merchantStore } from "@/lib/zec/store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const parsed = validateCreateInvoice(body);
  if (!parsed.ok) {
    return json({ error: "invalid invoice", fields: parsed.errors }, 400);
  }
  const merchant = merchantStore.get(parsed.value.merchantId);
  if (!merchant) return json({ error: "unknown merchant" }, 404);

  const invoice = invoiceStore.create({
    merchantId: merchant.id,
    amountZat: parsed.value.amountZat,
    address: merchant.address,
    title: parsed.value.title,
    reference: parsed.value.reference,
    description: parsed.value.description,
    fiatRef: parsed.value.fiatRef,
  });
  return json({ invoice, paymentUri: paymentUriForInvoice(invoice) }, 201);
}

export async function GET(request: Request) {
  const merchantId =
    new URL(request.url).searchParams.get("merchantId") ?? undefined;
  // Expire stale invoices on read so lists never show dead pending rows.
  invoiceStore.sweepExpired();
  return json({ invoices: invoiceStore.list(merchantId) });
}
