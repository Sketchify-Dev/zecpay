// lib/zec/ledger-watcher.ts
// Real Zcash integration: detect incoming shielded payments on testnet using
// the Ledger-maintained `@ledgerhq/zcash-utils` NAPI addon.
//
// This is watch-only by construction. The addon is documented to read a
// Unified Full Viewing Key and never spend-key material, so the server can
// detect and reconcile payments but can never move funds. We only ever scan;
// payers send from their own wallets.
//
// The native addon is imported lazily so it stays out of the client bundle and
// out of the static server graph; next.config.ts also lists it under
// serverExternalPackages so Next keeps it external at runtime.

import { matchNotes, type RawNote } from "./matching";
import type { DetectedPayment, Invoice, MerchantAccount } from "./types";
import type { PaymentWatcher } from "./watcher";

const DEFAULT_GRPC_URL = "https://testnet.zec.rocks:443";
// How far back to scan when an invoice has no recorded start height. Testnet
// blocks are ~75s, so this is a few hours of headroom for a demo.
const LOOKBACK_BLOCKS = Number(process.env.ZECPAY_LOOKBACK_BLOCKS ?? 500);
// Minimum interval between real scans, so frequent SSE/GET polls do not each
// trigger a full block-range scan.
const MIN_SCAN_INTERVAL_MS = 15_000;

type ZcashModule = typeof import("@ledgerhq/zcash-utils");

let zcashModule: ZcashModule | null = null;
let zcashModuleFailed = false;

async function loadZcash(): Promise<ZcashModule | null> {
  if (zcashModule) return zcashModule;
  if (zcashModuleFailed) return null;
  try {
    zcashModule = await import("@ledgerhq/zcash-utils");
    return zcashModule;
  } catch {
    zcashModuleFailed = true;
    return null;
  }
}

function grpcUrl(): string {
  return process.env.ZECPAY_GRPC_URL ?? DEFAULT_GRPC_URL;
}

function networkName(): string {
  return process.env.ZECPAY_NETWORK === "main" ? "mainnet" : "testnet";
}

export interface ZcashStatus {
  connected: boolean;
  chainTip: number | null;
  grpcUrl: string;
  network: string;
  error?: string;
}

// Cache the status so frequent UI polls do not each trigger a slow remote
// getChainTip call (observed at several seconds per request).
let statusCache: { at: number; value: ZcashStatus } | null = null;
const STATUS_TTL_MS = 20_000;

/** Live connectivity probe: talks to a real testnet lightwalletd endpoint. */
export async function zcashStatus(): Promise<ZcashStatus> {
  if (statusCache && Date.now() - statusCache.at < STATUS_TTL_MS) {
    return statusCache.value;
  }
  const url = grpcUrl();
  const network = networkName();
  const zcash = await loadZcash();
  let value: ZcashStatus;
  if (!zcash) {
    value = {
      connected: false,
      chainTip: null,
      grpcUrl: url,
      network,
      error: "zcash-utils addon unavailable on this platform",
    };
  } else {
    try {
      const tip = await zcash.getChainTip(url);
      value = { connected: true, chainTip: tip, grpcUrl: url, network };
    } catch (e) {
      value = {
        connected: false,
        chainTip: null,
        grpcUrl: url,
        network,
        error: (e as Error).message,
      };
    }
  }
  statusCache = { at: Date.now(), value };
  return value;
}

export class LedgerPaymentWatcher implements PaymentWatcher {
  readonly id = "ledger";

  private cache: { key: string; at: number; notes: RawNote[] } | null = null;
  private inflight: Promise<RawNote[]> | null = null;

  async poll(
    merchant: MerchantAccount,
    invoices: Invoice[],
  ): Promise<DetectedPayment[]> {
    if (!invoices.length || !merchant.ufvk) return [];
    const notes = await this.scanNotes(merchant, invoices);
    return matchNotes(notes, invoices);
  }

  private async scanNotes(
    merchant: MerchantAccount,
    invoices: Invoice[],
  ): Promise<RawNote[]> {
    const zcash = await loadZcash();
    if (!zcash) return [];

    try {
      const tip = await zcash.getChainTip(grpcUrl());
      const floor = Math.min(
        ...invoices.map((i) => i.fromHeight ?? tip - LOOKBACK_BLOCKS),
      );
      const startHeight = Math.max(1, floor);
      const key = `${merchant.id}:${startHeight}`;

      const now = Date.now();
      if (this.cache && this.cache.key === key && now - this.cache.at < MIN_SCAN_INTERVAL_MS) {
        return this.cache.notes;
      }
      // Coalesce concurrent polls into a single scan.
      if (this.inflight) return this.inflight;

      this.inflight = this.runScan(zcash, merchant, startHeight, tip);
      try {
        const notes = await this.inflight;
        this.cache = { key, at: Date.now(), notes };
        return notes;
      } finally {
        this.inflight = null;
      }
    } catch {
      // Network/endpoint failure: fall back to the last good result, or none.
      return this.cache?.notes ?? [];
    }
  }

  private async runScan(
    zcash: ZcashModule,
    merchant: MerchantAccount,
    startHeight: number,
    tip: number,
  ): Promise<RawNote[]> {
    const stream = await zcash.startSync({
      grpcUrl: grpcUrl(),
      viewingKey: merchant.ufvk,
      startHeight,
      endHeight: tip,
      network: networkName(),
      orchardOnly: true,
    });

    const notes: RawNote[] = [];
    let tx = await stream.next();
    while (tx !== null) {
      const incoming = [...tx.orchardNotes, ...tx.ironwoodNotes].filter(
        (n) => n.transferType === "incoming",
      );
      for (const n of incoming) {
        notes.push({
          txid: tx.txid,
          amountZat: BigInt(Math.round(n.amount)).toString(),
          memo: n.memo,
          height: tx.blockHeight,
          confirmations: Math.max(0, tip - tx.blockHeight + 1),
        });
      }
      tx = await stream.next();
    }
    return notes;
  }
}
