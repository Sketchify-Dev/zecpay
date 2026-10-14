// app/api/crosschain/assets/route.ts
import { getSwapProvider } from "@/lib/crosschain";
import { json } from "@/lib/server/http";

export async function GET(request: Request) {
  void new URL(request.url);
  const provider = getSwapProvider();
  const assets = await provider.listAssets();
  return json({
    provider: provider.id,
    supportsShieldedDestination: provider.supportsShieldedDestination,
    assets,
  });
}
