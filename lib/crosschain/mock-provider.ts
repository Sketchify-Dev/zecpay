// lib/crosschain/mock-provider.ts
// A deterministic mock SwapProvider for building and demoing the cross-chain
// funding path before (or instead of) a live provider. It fabricates a quote
// and advances an order through its lifecycle on a timer, so the full
// "pay with ETH, settle as shielded ZEC" UX can be exercised end to end with
// zero external infra. This is the demo-reliability hedge: even if the real
// swap provider is flaky on demo day, the flow still runs.

import { ZATOSHIS_PER_ZEC } from "../zec/amount";
import type {
  CrossChainAsset,
  SwapOrder,
  SwapProvider,
  SwapQuote,
  SwapQuoteRequest,
  SwapStatus,
} from "./types";

const ASSETS: CrossChainAsset[] = [
  { chain: "ethereum", symbol: "USDC", decimals: 6, label: "USDC on Ethereum" },
  { chain: "ethereum", symbol: "ETH", decimals: 18, label: "ETH on Ethereum" },
  { chain: "bitcoin", symbol: "BTC", decimals: 8, label: "BTC" },
  { chain: "near", symbol: "NEAR", decimals: 24, label: "NEAR" },
];

// Toy indicative prices in ZEC, only for the mock quote math.
const ZEC_PER_UNIT: Record<string, number> = {
  USDC: 1 / 45, // assume ~45 USD per ZEC for the demo
  ETH: 60,
  BTC: 1500,
  NEAR: 1 / 9,
};

// Simulated status timeline, in seconds since order creation.
const TIMELINE: Array<{ at: number; status: SwapStatus }> = [
  { at: 0, status: "awaiting_deposit" },
  { at: 4, status: "swapping" },
  { at: 9, status: "settling_shielded" },
  { at: 14, status: "completed" },
];

interface MockRecord {
  quote: SwapQuote;
  toZecAddress: string;
  order?: SwapOrder;
  startedAt: number;
}

function uuid(prefix: string): string {
  return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, "")}`;
}

export class MockSwapProvider implements SwapProvider {
  readonly id = "mock";
  readonly supportsShieldedDestination = true;

  private records = new Map<string, MockRecord>();

  async listAssets(): Promise<CrossChainAsset[]> {
    return ASSETS;
  }

  async quote(req: SwapQuoteRequest): Promise<SwapQuote> {
    const rate = ZEC_PER_UNIT[req.from.symbol];
    if (rate === undefined) {
      throw new Error(`unsupported asset: ${req.from.symbol}`);
    }
    const zec = Number(req.fromAmount) * rate;
    const grossZat = BigInt(Math.round(zec * Number(ZATOSHIS_PER_ZEC)));
    const feeZat = grossZat / 100n; // 1% mock fee
    const quote: SwapQuote = {
      id: uuid("q"),
      from: req.from,
      fromAmount: req.fromAmount,
      toAmountZat: grossZat - feeZat,
      feeZat,
      rateLabel: `1 ${req.from.symbol} = ${rate} ZEC`,
      estimatedSeconds: 15,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    this.records.set(quote.id, {
      quote,
      toZecAddress: req.toZecAddress,
      startedAt: 0,
    });
    return quote;
  }

  async createOrder(quoteId: string): Promise<SwapOrder> {
    const rec = this.records.get(quoteId);
    if (!rec) throw new Error(`unknown quote: ${quoteId}`);
    const order: SwapOrder = {
      id: uuid("ord"),
      quoteId,
      status: "awaiting_deposit",
      depositAddress: `0xMOCK${quoteId.slice(-8)}`,
      toZecAddress: rec.toZecAddress,
      settlement: "direct",
      updatedAt: new Date().toISOString(),
    };
    rec.order = order;
    rec.startedAt = Date.now();
    return order;
  }

  async getOrder(id: string): Promise<SwapOrder> {
    const rec = [...this.records.values()].find((r) => r.order?.id === id);
    if (!rec || !rec.order) throw new Error(`unknown order: ${id}`);
    const elapsed = (Date.now() - rec.startedAt) / 1000;
    let status: SwapStatus = "awaiting_deposit";
    for (const step of TIMELINE) {
      if (elapsed >= step.at) status = step.status;
    }
    const order: SwapOrder = {
      ...rec.order,
      status,
      depositTxid:
        elapsed >= 4 ? `0xdeposit${rec.order.id.slice(-6)}` : undefined,
      zecTxid: status === "completed" ? `zectx${rec.order.id.slice(-6)}` : undefined,
      updatedAt: new Date().toISOString(),
    };
    rec.order = order;
    return order;
  }
}
