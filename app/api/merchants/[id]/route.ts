// app/api/merchants/[id]/route.ts
// Lets the dashboard verify a stored merchant id still exists (the store is
// in-memory, so a server restart wipes it while localStorage keeps the id).
// Next 15+/16: the dynamic `params` is a Promise and must be awaited.
import { json } from "@/lib/server/http";
import { toPublicMerchant } from "@/lib/server/payments";
import { merchantStore } from "@/lib/zec/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const merchant = merchantStore.get(id);
  if (!merchant) return json({ error: "unknown merchant" }, 404);
  return json({ merchant: toPublicMerchant(merchant) });
}
