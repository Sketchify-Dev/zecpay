// lib/server/invoices.ts
// Pure validation for invoice creation. Kept separate from the route handler so
// it is unit-testable and reusable. Field problems are returned per-field so
// the UI can show errors beside the right inputs.

import { MAX_MONEY_ZAT, parseZecToZatoshi } from "@/lib/zec/amount";

export interface ValidInvoiceInput {
  merchantId: string;
  amountZat: bigint;
  title?: string;
  reference?: string;
  description?: string;
  fiatRef?: string;
}

export type FieldErrors = Partial<Record<"merchantId" | "amount" | "title" | "reference" | "description", string>>;

const TITLE_MAX = 120;
const REFERENCE_MAX = 64;
const DESCRIPTION_MAX = 500;
// Payer-facing reference: short, URL- and memo-safe.
const REFERENCE_RE = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/;

function clean(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export function validateCreateInvoice(
  body: Record<string, unknown> | null,
): { ok: true; value: ValidInvoiceInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (!body || typeof body.merchantId !== "string" || !body.merchantId) {
    errors.merchantId = "Pick or create a merchant first.";
  }

  let amountZat: bigint | undefined;
  const rawAmount = body?.amountZec ?? body?.amountZat;
  if (typeof rawAmount !== "string" || !rawAmount.trim()) {
    errors.amount = "Enter an amount in ZEC.";
  } else {
    try {
      amountZat = typeof body?.amountZec === "string"
        ? parseZecToZatoshi(body.amountZec)
        : BigInt(rawAmount as string);
      if (amountZat <= 0n) {
        errors.amount = "Amount must be greater than zero.";
        amountZat = undefined;
      } else if (amountZat > MAX_MONEY_ZAT) {
        errors.amount = "Amount is larger than the ZEC supply.";
        amountZat = undefined;
      }
    } catch {
      errors.amount = "Enter a valid amount, up to 8 decimals.";
    }
  }

  const title = clean(body?.title, TITLE_MAX);
  const description = clean(body?.description, DESCRIPTION_MAX);
  let reference = clean(body?.reference, REFERENCE_MAX);
  if (body?.reference !== undefined && typeof body.reference === "string" && body.reference.trim() && !reference) {
    errors.reference = "Reference cannot be blank.";
  } else if (reference && !REFERENCE_RE.test(reference)) {
    errors.reference = "Use letters, numbers, spaces, - or _.";
    reference = undefined;
  }

  if (Object.keys(errors).length || !body || amountZat === undefined) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      merchantId: body.merchantId as string,
      amountZat,
      title,
      reference,
      description,
      fiatRef: typeof body.fiatRef === "string" ? body.fiatRef : undefined,
    },
  };
}
