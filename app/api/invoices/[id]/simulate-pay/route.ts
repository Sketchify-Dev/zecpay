// app/api/invoices/[id]/simulate-pay/route.ts
// Demo-only endpoint: makes the mock watcher report a payment for this invoice,
// so the full detected -> confirmed flow can be shown without a real wallet.
import { json } from "@/lib/server/http";
import { invoiceStore } from "@/lib/zec/store";
import { getPaymentWatcher, MockPaymentWatcher } from "@/lib/zec/watcher";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!invoiceStore.get(id)) return json({ error: "not found" }, 404);

  const watcher = getPaymentWatcher();
  if (!(watcher instanceof MockPaymentWatcher)) {
    return json(
      { error: "simulate-pay is only available with the mock watcher" },
      409,
    );
  }
  watcher.simulatePay(id);
  return json({ ok: true });
}
