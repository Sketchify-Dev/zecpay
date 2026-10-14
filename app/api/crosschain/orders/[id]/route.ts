// app/api/crosschain/orders/[id]/route.ts
// Next 15+/16: the dynamic `params` is a Promise and must be awaited.
import { getSwapProvider } from "@/lib/crosschain";
import { json } from "@/lib/server/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const order = await getSwapProvider().getOrder(id);
    return json({ order });
  } catch (e) {
    return json({ error: (e as Error).message }, 404);
  }
}
