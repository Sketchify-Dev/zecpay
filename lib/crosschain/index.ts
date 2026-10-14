// lib/crosschain/index.ts
// Factory for the active cross-chain swap provider. Defaults to the mock so the
// demo runs without external infra; a real provider (near-intents / maya /
// thorchain adapter) is wired in here after Phase 0 verification.

import { MockSwapProvider } from "./mock-provider";
import type { SwapProvider } from "./types";

const cache = globalThis as unknown as { __zecpaySwap?: SwapProvider };

export function getSwapProvider(): SwapProvider {
  if (cache.__zecpaySwap) return cache.__zecpaySwap;
  // When ZECPAY_SWAP_PROVIDER names a verified provider, construct it here.
  cache.__zecpaySwap = new MockSwapProvider();
  return cache.__zecpaySwap;
}

export * from "./types";
