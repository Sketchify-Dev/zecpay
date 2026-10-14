// lib/zec/zip321.ts
// Minimal, dependency-free builder and parser for ZIP 321 payment request
// URIs (https://zips.z.cash/zip-0321). ZecPay issues single-recipient
// requests for checkout, but the parser also understands indexed
// multi-recipient URIs so it can round-trip anything a wallet produces.

import { formatZatoshiToZec, parseZecToZatoshi } from "./amount";
import { base64UrlToMemoBytes, MAX_MEMO_BYTES } from "./memo";

export interface PaymentItem {
  address: string;
  amountZat?: bigint;
  /** base64url (unpadded) memo value, exactly as it appears in the URI. */
  memoBase64Url?: string;
  label?: string;
  message?: string;
}

export interface PaymentRequest {
  items: PaymentItem[];
}

const SCHEME = "zcash:";

/** Build a single-recipient ZIP 321 URI. */
export function buildPaymentUri(item: PaymentItem): string {
  if (!item.address) throw new Error("address is required");
  const params: string[] = [];
  if (item.amountZat !== undefined) {
    params.push(`amount=${formatZatoshiToZec(item.amountZat)}`);
  }
  if (item.memoBase64Url !== undefined) {
    // base64url is already URI-safe; validate the decoded length only.
    const bytes = base64UrlToMemoBytes(item.memoBase64Url);
    if (bytes.length > MAX_MEMO_BYTES) {
      throw new Error(`memo exceeds ${MAX_MEMO_BYTES} bytes`);
    }
    params.push(`memo=${item.memoBase64Url}`);
  }
  if (item.label !== undefined) {
    params.push(`label=${encodeURIComponent(item.label)}`);
  }
  if (item.message !== undefined) {
    params.push(`message=${encodeURIComponent(item.message)}`);
  }
  const query = params.length ? `?${params.join("&")}` : "";
  return `${SCHEME}${item.address}${query}`;
}

interface RawParam {
  base: string;
  index: number;
  value: string;
}

function splitKey(key: string): { base: string; index: number } {
  const dot = key.lastIndexOf(".");
  if (dot === -1) return { base: key, index: 0 };
  const suffix = key.slice(dot + 1);
  // A numeric suffix with no leading zero is a ZIP 321 paramindex; otherwise
  // the dot is part of the parameter name.
  if (/^[1-9][0-9]*$/.test(suffix)) {
    return { base: key.slice(0, dot), index: Number(suffix) };
  }
  return { base: key, index: 0 };
}

/** Parse a ZIP 321 URI into recipients. Throws on malformed input. */
export function parsePaymentUri(uri: string): PaymentRequest {
  if (!uri.startsWith(SCHEME)) {
    throw new Error("not a zcash: URI");
  }
  const rest = uri.slice(SCHEME.length);
  const qIndex = rest.indexOf("?");
  const pathAddress = (qIndex === -1 ? rest : rest.slice(0, qIndex)).trim();
  const queryStr = qIndex === -1 ? "" : rest.slice(qIndex + 1);

  const raw: RawParam[] = [];
  if (queryStr.length) {
    for (const pair of queryStr.split("&")) {
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const rawKey = eq === -1 ? pair : pair.slice(0, eq);
      const rawVal = eq === -1 ? "" : pair.slice(eq + 1);
      const { base, index } = splitKey(rawKey);
      if (base.startsWith("req-")) {
        throw new Error(`unsupported required parameter: ${base}`);
      }
      raw.push({ base, index, value: rawVal });
    }
  }

  const indices = new Set<number>();
  for (const p of raw) indices.add(p.index);
  if (pathAddress) indices.add(0);

  const items: PaymentItem[] = [];
  for (const index of [...indices].sort((a, b) => a - b)) {
    const forIndex = raw.filter((p) => p.index === index);
    const get = (name: string): string | undefined => {
      const matches = forIndex.filter((p) => p.base === name);
      if (matches.length > 1) {
        throw new Error(`duplicate ${name} for recipient ${index}`);
      }
      return matches[0]?.value;
    };

    let address = get("address");
    if (index === 0 && pathAddress) {
      if (address) throw new Error("address given in both path and query");
      address = pathAddress;
    }
    if (!address) throw new Error(`missing address for recipient ${index}`);

    const item: PaymentItem = { address };

    const amount = get("amount");
    if (amount !== undefined) item.amountZat = parseZecToZatoshi(amount);

    const memo = get("memo");
    if (memo !== undefined) {
      const bytes = base64UrlToMemoBytes(memo);
      if (bytes.length > MAX_MEMO_BYTES) {
        throw new Error(`memo exceeds ${MAX_MEMO_BYTES} bytes`);
      }
      item.memoBase64Url = memo;
    }

    const label = get("label");
    if (label !== undefined) item.label = decodeURIComponent(label);
    const message = get("message");
    if (message !== undefined) item.message = decodeURIComponent(message);

    items.push(item);
  }

  if (!items.length) throw new Error("no recipients in payment request");
  return { items };
}
