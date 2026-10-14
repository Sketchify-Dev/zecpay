// lib/crosschain/types.ts
// Provider-agnostic interface for the "pay with any asset, settle as shielded
// ZEC" funding path. Concrete providers (a NEAR Intents / Maya / THORChain
// adapter, to be verified in Phase 0) implement SwapProvider. The checkout UI
// and the settlement relay depend only on this interface, so the real provider
// can be dropped in without touching product code.

export interface CrossChainAsset {
  /** Chain id or short name, e.g. "ethereum", "near", "bitcoin". */
  chain: string;
  /** Token symbol, e.g. "USDC", "ETH", "BTC". */
  symbol: string;
  /** Token decimals on its native chain. */
  decimals: number;
  /** Optional contract address for tokens. */
  contract?: string;
  /** Human label for the UI. */
  label: string;
}

export interface SwapQuoteRequest {
  from: CrossChainAsset;
  /** Amount of the source asset, as a decimal string in its own units. */
  fromAmount: string;
  /** Target shielded ZEC amount in zatoshi, when the merchant prices in ZEC. */
  toAmountZat?: bigint;
  /** Destination: the merchant's Unified Address (shielded). */
  toZecAddress: string;
}

export interface SwapQuote {
  id: string;
  from: CrossChainAsset;
  fromAmount: string;
  /** Expected ZEC delivered, in zatoshi. */
  toAmountZat: bigint;
  /** Provider plus network fees, summarized for display, in zatoshi. */
  feeZat: bigint;
  /** Indicative rate string for the UI, e.g. "1 ETH = 42.1 ZEC". */
  rateLabel: string;
  estimatedSeconds: number;
  expiresAt: string; // ISO 8601
}

export type SwapStatus =
  | "quoted"
  | "awaiting_deposit" // waiting for the payer to send the source asset
  | "swapping" // provider is converting to ZEC
  | "settling_shielded" // ZEC received; shielding/forwarding to the UA
  | "completed"
  | "failed"
  | "refunded";

export interface SwapOrder {
  id: string;
  quoteId: string;
  status: SwapStatus;
  /** Address the payer must send the source asset to. */
  depositAddress: string;
  /** Final shielded destination (merchant Unified Address). */
  toZecAddress: string;
  /**
   * How ZEC reaches the shielded destination:
   *  - "direct": the provider delivers straight to the shielded UA.
   *  - "relay": the provider delivers to a transparent t-address we control,
   *    then ZecPay auto-shields into the UA (see services/zec-watcher /shield).
   * This is the single knob Phase 0 verification sets per provider.
   */
  settlement: "direct" | "relay";
  /** Source-chain deposit tx, once seen. */
  depositTxid?: string;
  /** Final ZEC tx that funds the merchant, once settled. */
  zecTxid?: string;
  updatedAt: string; // ISO 8601
}

export interface SwapProvider {
  /** Stable provider id, e.g. "mock", "near-intents". */
  readonly id: string;
  /** True if the provider can deliver straight to a shielded UA. */
  readonly supportsShieldedDestination: boolean;
  /** Assets a payer can fund with. */
  listAssets(): Promise<CrossChainAsset[]>;
  quote(req: SwapQuoteRequest): Promise<SwapQuote>;
  createOrder(quoteId: string): Promise<SwapOrder>;
  getOrder(id: string): Promise<SwapOrder>;
}
