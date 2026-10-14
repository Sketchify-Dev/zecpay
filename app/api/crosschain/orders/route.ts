// app/api/crosschain/orders/route.ts
import { getSwapProvider } from "@/lib/crosschain";
import { json } from "@/lib/server/http";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body || typeof body.quoteId !== "string") {
    return json({ error: "quoteId is required" }, 400);
  }
  try {
    const order = await getSwapProvider().createOrder(body.quoteId);
    return json({ order }, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
