// lib/zec/lifecycle.test.ts
// Tests for the invoice lifecycle: cancel, expiry sweep, and reconcile on
// terminal states. Node built-in runner. Run with: npm test.

import assert from "node:assert/strict";
import { test } from "node:test";

// Keep the tests hermetic: no file persistence side effects.
process.env.ZECPAY_DATA_DIR = ":memory:";

import { reconcileInvoice } from "../server/payments";
import { MockPaymentWatcher } from "./watcher";
import { getPaymentWatcher } from "./watcher";
import { InvoiceStore, invoiceStore } from "./store";
import type { Invoice } from "./types";

function pendingInvoice(store: InvoiceStore): Invoice {
  return store.create({
    merchantId: "mch_1",
    amountZat: 5000000n,
    address: "u1abc",
  });
}

test("lifecycle: cancel is terminal and survives the expiry sweep", () => {
  const store = new InvoiceStore();
  const inv = pendingInvoice(store);
  store.update(inv.id, { status: "cancelled" });
  const changed = store.sweepExpired(Date.now() + 1000 * 60 * 60 * 24);
  assert.ok(!changed.includes(inv.id));
  assert.equal(store.get(inv.id)?.status, "cancelled");
});

test("lifecycle: sweep expires only pending invoices", () => {
  const store = new InvoiceStore();
  const inv = store.create({
    merchantId: "mch_1",
    amountZat: 5000000n,
    address: "u1abc",
    ttlMs: 1,
  });
  const changed = store.sweepExpired(Date.now() + 1000);
  assert.deepEqual(changed, [inv.id]);
  assert.equal(store.get(inv.id)?.status, "expired");
});

test("lifecycle: reconcile leaves terminal invoices untouched", async () => {
  // The shared singleton is mock-backed by default; a terminal invoice must
  // come back unchanged with no payment attached either way.
  assert.ok(getPaymentWatcher() instanceof MockPaymentWatcher);
  const inv = invoiceStore.create({
    merchantId: "mch_1",
    amountZat: 5000000n,
    address: "u1abc",
  });
  invoiceStore.update(inv.id, { status: "cancelled" });
  const result = await reconcileInvoice(inv.id);
  assert.equal(result?.invoice.status, "cancelled");
  assert.equal(result?.payment, undefined);
});
