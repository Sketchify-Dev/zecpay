// app/api/merchants/route.ts
import { json } from "@/lib/server/http";
import { toPublicMerchant } from "@/lib/server/payments";
import { merchantStore } from "@/lib/zec/store";

function validWebhook(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const fields: Record<string, string> = {};
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  const ufvk = typeof body?.ufvk === "string" ? body.ufvk.trim() : "";
  const name = typeof body?.name === "string" && body.name.trim()
    ? body.name.trim().slice(0, 80)
    : "Merchant";
  const webhookUrl =
    typeof body?.webhookUrl === "string" && body.webhookUrl.trim()
      ? body.webhookUrl.trim()
      : undefined;

  if (!address || address.length < 10 || address.length > 300) {
    fields.address = "Paste a valid Zcash address.";
  }
  if (!ufvk || ufvk.length < 20 || ufvk.length > 2000) {
    fields.ufvk = "Paste the account viewing key.";
  }
  if (webhookUrl && !validWebhook(webhookUrl)) {
    fields.webhookUrl = "Use an http(s) URL.";
  }
  if (Object.keys(fields).length) {
    return json({ error: "invalid merchant", fields }, 400);
  }
  const merchant = merchantStore.create({
    name,
    network: body?.network === "main" ? "main" : "test",
    address,
    ufvk,
    webhookUrl,
  });
  return json({ merchant: toPublicMerchant(merchant) }, 201);
}

export async function GET(request: Request) {
  // Touch the URL so the handler is treated as dynamic, not statically cached.
  void new URL(request.url);
  return json({ merchants: merchantStore.list().map(toPublicMerchant) });
}
