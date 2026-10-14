// app/api/invoices/[id]/disclosure/route.ts
// Create a shareable proof of payment for a settled invoice. The disclosure id
// is stored on the invoice so the checkout can link to the existing proof
// instead of minting a new one on every visit. If a proof already exists, the
// same one is returned.
import { json } from "@/lib/server/http";
import { getDisclosureProvider } from "@/lib/zec/disclosure";
import { invoiceStore, merchantStore } from "@/lib/zec/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = invoiceStore.get(id);
  if (!invoice) return json({ error: "not found" }, 404);
  if (invoice.status !== "confirmed") {
    return json({ error: "invoice is not settled yet" }, 409);
  }

  // Reuse an existing proof if one was already generated for this invoice.
  if (invoice.disclosureId) {
    const existing = await getDisclosureProvider().verify(invoice.disclosureId);
    if (existing.valid) {
      return json(
        {
          id: invoice.disclosureId,
          verifyPath: `/verify/${invoice.disclosureId}`,
          public: existing.disclosure,
        },
        200,
      );
    }
  }

  const network = merchantStore.get(invoice.merchantId)?.network ?? "test";
  try {
    const disclosure = await getDisclosureProvider().create(invoice, network);
    invoiceStore.update(id, { disclosureId: disclosure.id });
    return json(
      {
        id: disclosure.id,
        proof: disclosure.proof,
        verifyPath: `/verify/${disclosure.id}`,
        public: disclosure.public,
      },
      201,
    );
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
