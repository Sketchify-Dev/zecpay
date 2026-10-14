// lib/zec/core.test.ts
// Behavior tests for the pure core libraries. Uses the Node built-in test
// runner so it adds no dependency and type-checks against @types/node.
// Run once a TS-capable runner is available, e.g.:
//   npm i -D tsx && node --import tsx --test lib/zec/core.test.ts
// (or add vitest and run `vitest`).

import assert from "node:assert/strict";
import { test } from "node:test";

import { formatZatoshiToZec, parseZecToZatoshi } from "./amount";
import {
  base64UrlToMemoBytes,
  encodeOrderMemo,
  memoBytesToBase64Url,
  memoBytesToText,
  parseOrderMemo,
  textToMemoBytes,
} from "./memo";
import { buildPaymentUri, parsePaymentUri } from "./zip321";
import { matchNotes, type RawNote } from "./watcher";
import type { Invoice } from "./types";

test("amount: parse and format round-trip", () => {
  const cases: Array<[string, bigint]> = [
    ["0", 0n],
    ["1", 100_000_000n],
    ["1.5", 150_000_000n],
    ["0.1", 10_000_000n],
    ["0.00000001", 1n],
    ["21000000", 21_000_000n * 100_000_000n],
  ];
  for (const [text, zat] of cases) {
    assert.equal(parseZecToZatoshi(text), zat, `parse ${text}`);
    assert.equal(formatZatoshiToZec(zat), text, `format ${text}`);
  }
});

test("amount: rejects bad input and overflow", () => {
  assert.throws(() => parseZecToZatoshi("1.123456789")); // 9 fractional digits
  assert.throws(() => parseZecToZatoshi("abc"));
  assert.throws(() => parseZecToZatoshi(""));
  assert.throws(() => parseZecToZatoshi("21000001")); // over the supply cap
});

test("memo: base64url and order token round-trip", () => {
  const token = encodeOrderMemo("inv_abc123");
  assert.equal(token, "zecpay:1:inv_abc123");
  const b64 = memoBytesToBase64Url(textToMemoBytes(token));
  const text = memoBytesToText(base64UrlToMemoBytes(b64));
  assert.equal(text, token);
  assert.deepEqual(parseOrderMemo(text), { invoiceId: "inv_abc123" });
});

test("memo: tolerates trailing NUL padding and rejects non-tokens", () => {
  assert.deepEqual(parseOrderMemo("zecpay:1:inv_x\u0000\u0000"), {
    invoiceId: "inv_x",
  });
  assert.equal(parseOrderMemo("just a note"), null);
  assert.equal(parseOrderMemo("zecpay:2:inv_x"), null); // unknown version
});

test("zip321: build then parse a single-recipient request", () => {
  const addr = "u1exampleunifiedaddress";
  const memoB64 = memoBytesToBase64Url(textToMemoBytes("zecpay:1:inv_1"));
  const uri = buildPaymentUri({
    address: addr,
    amountZat: 150_000_000n,
    memoBase64Url: memoB64,
    message: "Order 1",
  });
  assert.ok(uri.startsWith(`zcash:${addr}?`));
  const parsed = parsePaymentUri(uri);
  assert.equal(parsed.items.length, 1);
  const item = parsed.items[0];
  assert.equal(item.address, addr);
  assert.equal(item.amountZat, 150_000_000n);
  assert.equal(item.memoBase64Url, memoB64);
  assert.equal(item.message, "Order 1");
});

test("zip321: rejects unknown required (req-) params", () => {
  assert.throws(() => parsePaymentUri("zcash:u1abc?req-foo=bar"));
});

test("watcher: matchNotes ties a note to its invoice by memo and amount", () => {
  const invoice: Invoice = {
    id: "inv_1",
    merchantId: "mch_1",
    amountZat: "150000000",
    address: "u1abc",
    memoToken: "zecpay:1:inv_1",
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000).toISOString(),
  };
  const notes: RawNote[] = [
    { txid: "a", amountZat: "150000000", memo: "zecpay:1:inv_1", confirmations: 1 },
    { txid: "b", amountZat: "999", memo: "zecpay:1:inv_1", confirmations: 1 },
    { txid: "c", amountZat: "150000000", memo: "hello", confirmations: 1 },
  ];
  const matched = matchNotes(notes, [invoice]);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].txid, "a");
  assert.equal(matched[0].invoiceId, "inv_1");
});
