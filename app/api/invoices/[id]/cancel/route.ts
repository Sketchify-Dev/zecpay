// app/api/invoices/[id]/cancel/route.ts
// Cancel a pending invoice. Only pending invoices can be cancelled; anything
// else is a 409. Cancellation is terminal and never deletes history.
import { json } from "@/lib/server/http";
import { invoiceStore } from "@/lib/zec/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = invoiceStore.get(id);
  if (!invoice) return json({ error: "not found" }, 404);
  if (invoice.status !== "pending") {
    return json(
      { error: `cannot cancel an invoice that is ${invoice.status}` },
      409,
    );
  }
  return json({ invoice: invoiceStore.update(id, { status: "cancelled" }) });
}
