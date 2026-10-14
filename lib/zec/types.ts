// lib/zec/types.ts
// Shared domain types for ZecPay. Monetary amounts are zatoshi. Where they
// cross a JSON boundary they are decimal-integer strings (BigInt is not
// JSON-serializable); in compute they are converted to BigInt.

export type ZecNetwork = "main" | "test";

export type PaymentStatus =
  | "pending" // invoice created, awaiting payment
  | "detected" // matching note seen but not yet confirmed
  | "confirmed" // note confirmed at the required depth
  | "expired" // not paid before expiry
  | "cancelled" // cancelled by the merchant before payment
  | "failed"; // detected but could not be reconciled

export interface Invoice {
  id: string;
  merchantId: string;
  /** Amount owed, in zatoshi, as a decimal-integer string. */
  amountZat: string;
  /** Optional human title shown on the invoice, e.g. "Logo design". */
  title?: string;
  /** Optional payer-facing reference, e.g. "ORD-001". */
  reference?: string;
  /** Optional longer note shown on the checkout page. */
  description?: string;
  /** Optional fiat reference captured at creation, e.g. "USD 5.00". */
  fiatRef?: string;
  /** Unified Address the funds should arrive at. */
  address: string;
  /** Memo order token embedded in the ZIP 321 request. */
  memoToken: string;
  status: PaymentStatus;
  /** Chain height when the invoice was created; scans start here. */
  fromHeight?: number;
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  /** Set once a matching payment is found. */
  txid?: string;
  /** Set when the payment reaches confirmed status. */
  paidAt?: string; // ISO 8601
  /** Id of the proof-of-payment disclosure generated for this invoice, if any. */
  disclosureId?: string;
}

export interface MerchantAccount {
  id: string;
  name: string;
  network: ZecNetwork;
  /** Unified Address shown to payers. */
  address: string;
  /** Unified Full Viewing Key, held watch-only to detect payments. */
  ufvk: string;
  /** URL to POST payment events to. */
  webhookUrl?: string;
  createdAt: string;
}

export interface DetectedPayment {
  invoiceId: string;
  txid: string;
  amountZat: string;
  memo: string;
  /** Height at which the note was mined; undefined while unconfirmed. */
  height?: number;
  confirmations: number;
}

export interface Receipt {
  invoiceId: string;
  txid: string;
  amountZat: string;
  paidAt: string; // ISO 8601
  memoToken: string;
  network: ZecNetwork;
}
