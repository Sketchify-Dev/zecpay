// app/api/disclosures/[id]/route.ts
// Verify a disclosure (by id or proof token) and return only the public fields.
import { json } from "@/lib/server/http";
import { getDisclosureProvider } from "@/lib/zec/disclosure";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getDisclosureProvider().verify(id);
  if (!result.valid) {
    return json({ valid: false, reason: result.reason ?? "invalid" }, 404);
  }
  return json({ valid: true, disclosure: result.disclosure });
}
