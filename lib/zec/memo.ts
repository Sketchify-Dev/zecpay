// lib/zec/memo.ts
// Helpers for the Zcash shielded memo field (max 512 bytes) and for the
// compact order token ZecPay embeds in a memo so a payment can be matched
// back to an invoice. These run server-side (Node), where Buffer is available.

export const MAX_MEMO_BYTES = 512;

const ORDER_PREFIX = "zecpay";
const ORDER_VERSION = 1;
// Invoice ids are URL-safe tokens; constrained so they are safe in a memo.
const INVOICE_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

/** Encode UTF-8 text into memo bytes, enforcing the 512-byte cap. */
export function textToMemoBytes(text: string): Uint8Array {
  const bytes = Buffer.from(text, "utf8");
  if (bytes.length > MAX_MEMO_BYTES) {
    throw new Error(`Memo is ${bytes.length} bytes; max is ${MAX_MEMO_BYTES}`);
  }
  return new Uint8Array(bytes);
}

/** Base64url (unpadded) encode memo bytes for use in a ZIP 321 URI. */
export function memoBytesToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

/** Decode a base64url memo value back into raw bytes. */
export function base64UrlToMemoBytes(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

/** Decode memo bytes as UTF-8 text, trimming trailing NUL padding. */
export function memoBytesToText(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("utf8").replace(/\u0000+$/, "");
}

/**
 * Build the compact order token ZecPay writes into the memo, e.g.
 * "zecpay:1:inv_abc123". Kept short so it always fits the memo field.
 */
export function encodeOrderMemo(invoiceId: string): string {
  if (!INVOICE_ID_RE.test(invoiceId)) {
    throw new Error(`Unsafe invoice id for memo: ${JSON.stringify(invoiceId)}`);
  }
  return `${ORDER_PREFIX}:${ORDER_VERSION}:${invoiceId}`;
}

/**
 * Extract the invoice id from a decrypted memo, or null if the memo is not a
 * ZecPay order token. Tolerates surrounding whitespace and trailing NUL
 * padding that wallets may add to the fixed-size memo field.
 */
export function parseOrderMemo(memo: string): { invoiceId: string } | null {
  const trimmed = memo.replace(/\u0000+$/, "").trim();
  const parts = trimmed.split(":");
  if (parts.length !== 3) return null;
  const [prefix, version, invoiceId] = parts;
  if (prefix !== ORDER_PREFIX) return null;
  if (version !== String(ORDER_VERSION)) return null;
  if (!INVOICE_ID_RE.test(invoiceId)) return null;
  return { invoiceId };
}
