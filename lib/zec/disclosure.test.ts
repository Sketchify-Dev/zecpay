// lib/zec/disclosure.test.ts
// Behavior tests for the proof-of-payment hero. Node built-in runner, no deps.
// Run with a TS-capable runner (see core.test.ts for the command).

import assert from "node:assert/strict";
import { test } from "node:test";

import { MockDisclosureProvider } from "./disclosure";
import type { Invoice } from "./types";

// Keep the tests hermetic: no file persistence side effects.
process.env.ZECPAY_DATA_DIR = ":memory:";

function confirmedInvoice(): Invoice {
  const now = new Date().toISOString();
  return {
    id: "inv_1",
    merchantId: "mch_1",
    amountZat: "150000000",
    address: "u1abc",
    memoToken: "zecpay:1:inv_1",
    status: "confirmed",
    txid: "tx_abc",
    paidAt: now,
    createdAt: now,
    expiresAt: now,
  };
}

test("disclosure: create then verify by proof token and by id", async () => {
  const provider = new MockDisclosureProvider();
  const d = await provider.create(confirmedInvoice(), "test");

  const byToken = await provider.verify(d.proof);
  assert.equal(byToken.valid, true);
  assert.equal(byToken.disclosure?.invoiceId, "inv_1");
  assert.equal(byToken.disclosure?.amountZat, "150000000");

  const byId = await provider.verify(d.id);
  assert.equal(byId.valid, true);
});

test("disclosure: rejects an unsettled invoice and unknown proofs", async () => {
  const provider = new MockDisclosureProvider();
  const pending: Invoice = {
    ...confirmedInvoice(),
    status: "pending",
    txid: undefined,
  };
  await assert.rejects(() => provider.create(pending, "test"));

  const bad = await provider.verify("not-a-real-proof");
  assert.equal(bad.valid, false);
});
