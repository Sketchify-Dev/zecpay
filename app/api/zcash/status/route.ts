// app/api/zcash/status/route.ts
// Reports real Zcash testnet connectivity from the Ledger light-client addon.
// Used by the UI to show a live "connected to testnet" signal, and to prove the
// integration is genuinely wired rather than only simulated.
import { json } from "@/lib/server/http";
import { zcashStatus } from "@/lib/zec/ledger-watcher";

export async function GET(request: Request) {
  void new URL(request.url);
  const status = await zcashStatus();
  return json(status);
}
