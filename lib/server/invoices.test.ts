// lib/server/invoices.test.ts
// Tests for invoice validation and webhook payloads. Node built-in runner.
// Run with: npm test (requires the tsx dev dependency).

import assert from "node:assert/strict";
import { test } from "node:test";

import { validateCreateInvoice } from "./invoices";
import { buildWebhookPayload } from "./webhooks";
import type { Invoice } from "../zec/types";

test("invoices: accepts a complete valid input", () => {
  const r = validateCreateInvoice({
    merchantId: "mch_1",
    amountZec: "0.05",
    title: "Logo design",
    reference: "ORD-001",
    description: "Due Friday.",
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.amountZat, 5_000_000n);
    assert.equal(r.value.title, "Logo design");
    assert.equal(r.value.reference, "ORD-001");
  }
});

test("invoices: reports per-field errors", () => {
  const r = validateCreateInvoice({ merchantId: "", amountZec: "abc", reference: "!!!" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.merchantId);
    assert.ok(r.errors.amount);
    assert.ok(r.errors.reference);
  }
});

test("invoices: rejects zero and negative amounts", () => {
  for (const amountZec of ["0", "0.00000000", "-1"]) {
    const r = validateCreateInvoice({ merchantId: "mch_1", amountZec });
    assert.equal(r.ok, false, amountZec);
  }
});

test("webhooks: payload carries only reconciling fields", () => {
  const invoice: Invoice = {
    id: "inv_1",
    merchantId: "mch_1",
    amountZat: "5000000",
    address: "u1abc",
    memoToken: "zecpay:1:inv_1",
    status: "confirmed",
    txid: "tx_1",
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
  };
  const p = buildWebhookPayload(invoice);
  assert.ok(p);
  assert.equal(p?.event, "invoice.confirmed");
  assert.equal(p?.txid, "tx_1");
  // No viewing keys, memos, or addresses ever leave in a webhook.
  assert.ok(!("ufvk" in (p as object)));
  assert.ok(!("memo" in (p as object)));
  assert.ok(!("address" in (p as object)));
});

test("webhooks: no payload for unsettled invoices", () => {
  const invoice: Invoice = {
    id: "inv_1",
    merchantId: "mch_1",
    amountZat: "5000000",
    address: "u1abc",
    memoToken: "zecpay:1:inv_1",
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
  };
  assert.equal(buildWebhookPayload(invoice), null);
});
