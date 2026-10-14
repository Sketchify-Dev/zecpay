# ZecPay

Private invoicing on Zcash. Get paid in shielded ZEC and prove any single
payment, to a client, a tax office, a landlord, without revealing your rates or
your other income.

Built for ZECATHON, Track 01: Shielded Payments.

## The problem (a workflow that breaks today)

The moment you invoice or get paid on a public blockchain, you publish your
rates, your clients, and your income to the world. Freelancers, contractors, and
teams cannot use on-chain pay without leaking their whole book.

Zcash fixes the privacy, but creates a new gap: if a payment is shielded, how do
you PROVE you were paid when you need to (a refund, a dispute, taxes, a
reference) without deanonymizing yourself?

## The solution

ZecPay pairs private invoicing with selective disclosure, the thing only Zcash
does well:

- Get paid in shielded ZEC. Amounts and parties stay off the public ledger.
- Payments are detected and reconciled with a viewing key (watch-only). Spend
  keys never touch the server.
- Each payment can be turned into a verifiable proof that reveals exactly one
  payment and nothing else.

## How it works

1. Create an invoice (amount, title, reference, note). ZecPay builds a ZIP 321
   payment-request URI to your Unified Address, carrying the amount and a unique
   encrypted memo (the order token). You get a checkout link with a QR code.
2. Your client pays. The payment arrives shielded; ZecPay detects it with your
   viewing key and matches it to the invoice by the memo. Status streams live:
   pending, detected, paid.
3. Prove it. From the settled invoice, generate a shareable proof. Anyone with
   the link verifies that one payment at `/verify/[id]`, and learns nothing else
   about your wallet.

Deferred (post-hack): "pay with any asset" cross-chain funding, so a client
without ZEC can still pay and you still receive shielded ZEC. The code is present
behind a provider interface but is not the focus.

## What is real vs simulated (read this before judging)

- Real: ZIP 321 request building and server-rendered QR, encrypted-memo order
  tokens, the viewing-key detection model, invoice lifecycle with expiry,
  file-backed storage, webhook delivery, and the selective-disclosure data flow.
  invoices, merchants, and proofs persist across server restarts in `data/`.
- Real Zcash integration: `LedgerPaymentWatcher` scans Zcash testnet watch-only
  via `@ledgerhq/zcash-utils` (a maintained Ledger NAPI addon, no Rust toolchain
  needed) against a public lightwalletd endpoint. Verified: testnet tip read
  live and a 201-block scan completed through the exact watcher API. Reproduce
  it yourself with `npm run zcash:scan` (no funds needed). Enabled in the app
  with `ZECPAY_WATCHER=ledger`.
- Simulated by default: payment detection runs on `MockPaymentWatcher`
  (simulate a wallet payment from the checkout) and proofs on
  `MockDisclosureProvider`, so the full journey demos with zero infrastructure.
  The UI always shows a "demo mode, simulated payments" badge in this mode.
- Never simulated silently: mocks are labeled in the UI, and the submission
  description states this boundary.

## Architecture

- `app/` - landing, dashboard, checkout, public `/verify` proof page, API.
- `lib/zec/` - amount/memo/ZIP 321 primitives, file-backed stores, detection
  matcher, disclosure contract + mock, Ledger-backed real watcher.
- `lib/server/` - validation, payments orchestration, QR generation, webhooks.
- `lib/crosschain/` - deferred swap interface + mock.
- `components/` - shared design-system primitives (buttons, cards, badges).

Privacy boundaries: the server stores viewing keys, never spend keys. Merchant
API responses never include the viewing key. Webhook payloads carry only
reconciling fields (ids, status, amount, tx). Viewing keys never appear in URLs,
logs, or client storage.

## Development

```bash
npm install
npm run dev        # http://localhost:3000, mock mode, no infra needed
npm test           # unit tests (money, memo, ZIP 321, matching, validation)
npm run build      # production build
```

Environment: copy `.env.example` to `.env.local`. Key knobs:

- `ZECPAY_NETWORK=test` - testnet (default) or mainnet display/scan network.
- `ZECPAY_WATCHER=ledger` - real testnet scanning (default: mock).
- `ZECPAY_GRPC_URL` - lightwalletd endpoint (defaults to a public testnet node).
- `ZECPAY_DATA_DIR` - storage directory (default `./data`; `:memory:` disables).

## Demo in two minutes

1. Open the dashboard, create a demo merchant, create an invoice.
2. Open its checkout, click "Simulate wallet payment", watch it settle live.
3. Click "Generate proof of payment", open the verify link in a new tab.
4. Point at the live "Zcash testnet #block" pill for the real node connection.

## Zcash concepts used

- Unified Address (UA, ZIP 316); Orchard shielded pool.
- Unified Full Viewing Key (UFVK): detect payments without spend authority.
- Encrypted memo: ties a payment to an invoice.
- ZIP 321: the payment-request URI behind the QR code.
- Selective disclosure: prove one payment without revealing the rest (the hero).
