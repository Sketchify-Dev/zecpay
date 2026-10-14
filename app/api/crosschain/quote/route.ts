// app/api/crosschain/quote/route.ts
import { getSwapProvider } from "@/lib/crosschain";
import type { CrossChainAsset, SwapQuote } from "@/lib/crosschain";
import { json } from "@/lib/server/http";

// SwapQuote carries bigint fields; convert them to strings for JSON transport.
function serializeQuote(q: SwapQuote) {
  return {
    ...q,
    toAmountZat: q.toAmountZat.toString(),
    feeZat: q.feeZat.toString(),
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (
    !body ||
    typeof body.fromAmount !== "string" ||
    typeof body.toZecAddress !== "string" ||
    typeof body.asset !== "object" ||
    body.asset === null
  ) {
    return json(
      { error: "asset, fromAmount and toZecAddress are required" },
      400,
    );
  }
  try {
    const quote = await getSwapProvider().quote({
      from: body.asset as CrossChainAsset,
      fromAmount: body.fromAmount,
      toZecAddress: body.toZecAddress,
    });
    return json({ quote: serializeQuote(quote) });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
