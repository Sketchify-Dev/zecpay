// lib/zec/watcher.ts
// Payment detection: the contract, a mock, an HTTP client, and the factory
// that selects the active implementation.
//
//  - MockPaymentWatcher: simulates a payment and advances confirmations on a
//    timer. The default, so the whole app runs and demos with zero infra.
//  - LedgerPaymentWatcher: real testnet scanning via @ledgerhq/zcash-utils
//    (see ledger-watcher.ts). Selected with ZECPAY_WATCHER=ledger.
//  - HttpPaymentWatcher: client for a separate scanner service
//    (ZECPAY_WATCHER_URL), kept for a custom zingolib service.

import { LedgerPaymentWatcher } from "./ledger-watcher";
import { matchNotes, type RawNote } from "./matching";
import type { DetectedPayment, Invoice, MerchantAccount } from "./types";

// Re-export the shared matching API so existing imports from "./watcher" keep
// working (tests, server helpers).
export {
  REQUIRED_CONFIRMATIONS,
  matchNotes,
  statusFromPayment,
  type RawNote,
} from "./matching";

export interface PaymentWatcher {
  readonly id: string;
  /** Return payments detected for the given pending invoices of one merchant. */
  poll(merchant: MerchantAccount, invoices: Invoice[]): Promise<DetectedPayment[]>;
}

export class MockPaymentWatcher implements PaymentWatcher {
  readonly id = "mock";
  private paidAt = new Map<string, number>();
  private txids = new Map<string, string>();
  private static CONFIRM_INTERVAL_MS = 2500;

  /** Demo hook: pretend the buyer just paid this invoice. */
  simulatePay(invoiceId: string): void {
    if (this.paidAt.has(invoiceId)) return;
    this.paidAt.set(invoiceId, Date.now());
    const rand = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    this.txids.set(invoiceId, `mocktx_${rand}`);
  }

  async poll(
    _merchant: MerchantAccount,
    invoices: Invoice[],
  ): Promise<DetectedPayment[]> {
    const out: DetectedPayment[] = [];
    for (const inv of invoices) {
      const at = this.paidAt.get(inv.id);
      if (at === undefined) continue;
      const elapsed = Date.now() - at;
      const confirmations = Math.min(
        10,
        Math.floor(elapsed / MockPaymentWatcher.CONFIRM_INTERVAL_MS),
      );
      out.push({
        invoiceId: inv.id,
        txid: this.txids.get(inv.id)!,
        amountZat: inv.amountZat,
        memo: inv.memoToken,
        confirmations,
      });
    }
    return out;
  }
}

/** Client for a separate scanner service. Contract defined; service TBD. */
export class HttpPaymentWatcher implements PaymentWatcher {
  readonly id = "http";
  private watching = new Set<string>();

  constructor(private readonly baseUrl: string) {}

  private async ensureWatching(merchant: MerchantAccount): Promise<void> {
    if (this.watching.has(merchant.id)) return;
    const res = await fetch(`${this.baseUrl}/watch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        account: merchant.id,
        ufvk: merchant.ufvk,
        network: merchant.network,
      }),
    });
    if (!res.ok) throw new Error(`watcher /watch failed: ${res.status}`);
    this.watching.add(merchant.id);
  }

  async poll(
    merchant: MerchantAccount,
    invoices: Invoice[],
  ): Promise<DetectedPayment[]> {
    if (!invoices.length) return [];
    await this.ensureWatching(merchant);
    const since = Math.min(...invoices.map((i) => i.fromHeight ?? 0));
    const url = `${this.baseUrl}/payments?account=${encodeURIComponent(
      merchant.id,
    )}&since=${since}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`watcher /payments failed: ${res.status}`);
    const data = (await res.json()) as { payments: RawNote[] };
    return matchNotes(data.payments ?? [], invoices);
  }
}

// Shared, HMR-safe singleton. Default is the mock (zero infra). Set
// ZECPAY_WATCHER=ledger for real testnet scanning, or ZECPAY_WATCHER_URL for a
// custom scanner service.
const cache = globalThis as unknown as { __zecpayWatcher?: PaymentWatcher };

export function getPaymentWatcher(): PaymentWatcher {
  if (cache.__zecpayWatcher) return cache.__zecpayWatcher;
  const mode = process.env.ZECPAY_WATCHER;
  let watcher: PaymentWatcher;
  if (mode === "ledger") {
    watcher = new LedgerPaymentWatcher();
  } else if (process.env.ZECPAY_WATCHER_URL) {
    watcher = new HttpPaymentWatcher(process.env.ZECPAY_WATCHER_URL);
  } else {
    watcher = new MockPaymentWatcher();
  }
  cache.__zecpayWatcher = watcher;
  return watcher;
}
