<div align="center">
  <img src="public/zecpay-tile.svg" alt="ZecPay logo" width="96" />
  <h1>ZecPay</h1>
  <p><strong>Private invoicing on Zcash.</strong> Get paid in shielded ZEC, then prove any single payment, without revealing your rates or your other income.</p>
  <p>Built for <strong>ZECATHON</strong>, Track 01: Shielded Payments.</p>
  <p><a href="https://zecpay.onrender.com"><strong>Live demo</strong></a> · <a href="https://youtu.be/e3xrq4XDH-k"><strong>Demo video</strong></a></p>
</div>

## The problem

The moment you invoice on a public blockchain, you publish your rates, your
clients, and your income. Freelancers and contractors cannot use on-chain pay
without leaking their whole book.

Zcash fixes the privacy, but creates a new gap: if a payment is shielded, how
do you prove you were paid when you need to, for a dispute, a refund, taxes,
or a reference, without deanonymizing yourself?

ZecPay does both: **private by default, provable on demand.**

## How it works

1. **Create an invoice.** Amount, title, reference, note. ZecPay builds a
   ZIP 321 payment request to your Unified Address with a unique encrypted
   memo (the order token) and a QR code.
2. **Get paid shielded.** Your client pays in ZEC. ZecPay detects the payment
   with your viewing key (watch-only, spend keys never touch the server) and
   matches it to the invoice by the memo. Status streams live.
3. **Prove one payment.** From a settled invoice, mint a shareable proof. A
   public verify page shows only that payment and states plainly that nothing
   else about the wallet is revealed.

## Two-minute demo

1. Dashboard: create a demo merchant, create an invoice.
2. Checkout: simulate the wallet payment, watch pending to detected to Paid.
3. Generate proof of payment, open the verify link in a new tab.
4. Terminal: `npm run zcash:scan` reads the live testnet tip and scans real
   blocks with a watch-only key. Full script in [DEMO.md](DEMO.md).

## What is real vs simulated

- **Real and unit-tested:** ZIP 321 requests, server-rendered QR, encrypted-memo
  order tokens, viewing-key detection and matching, invoice lifecycle with
  expiry and cancellation, file-backed persistence, webhooks.
- **Real and reproducible:** the detection pipeline connects to a live Zcash
  testnet node and scans real compact blocks watch-only via
  `@ledgerhq/zcash-utils`. Run `npm run zcash:scan`, no funds needed.
- **Simulated for the demo:** the positive payment match (the Simulate button)
  and the single-note cryptographic disclosure, behind interfaces and always
  under a "Demo mode, simulated payments" badge.
- **Deferred:** cross-chain "pay with any asset" funding (code present, UI removed).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000, mock mode, no setup needed
```

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm test` | Unit suite (money, memo, ZIP 321, matching, validation, webhooks) |
| `npm run build` / `npm start` | Production build and server |
| `npm run zcash:scan` | Live testnet scan proof, no funds needed |

## Configuration

Copy `.env.example` to `.env.local`. The app runs fully on mocks with no
configuration.

| Variable | Default | Purpose |
|---|---|---|
| `ZECPAY_NETWORK` | `test` | Display and scan network (`test` or `main`) |
| `ZECPAY_WATCHER` | mock | Set `ledger` for real testnet scanning |
| `ZECPAY_GRPC_URL` | public testnet node | lightwalletd/Zaino endpoint |
| `ZECPAY_DATA_DIR` | `./data` | Storage dir (`:memory:` disables persistence) |

## Architecture

- `app/` — landing, dashboard, checkout, public `/verify` proof page, API routes.
- `lib/zec/` — amount/memo/ZIP 321 primitives, file-backed stores, detection
  matcher, disclosure contract + mock, Ledger-backed real watcher.
- `lib/server/` — validation, payments orchestration, QR generation, webhooks.
- `lib/crosschain/` — deferred swap interface + mock (server side only).
- `components/` — shared design system (buttons, cards, badges, dialogs, toasts).

Privacy boundaries: viewing keys only on the server, never spend keys; no
viewing key in any public API response, webhook, URL, or log. See
[SECURITY.md](SECURITY.md).

## Zcash concepts used

- Unified Address (ZIP 316) and the Orchard shielded pool.
- Unified Full Viewing Key: detect payments without spend authority.
- Encrypted memo field: ties a payment to an invoice.
- ZIP 321: the payment-request URI behind the QR code.
- Selective disclosure: prove one payment without revealing the rest.

## Submission

Track: Shielded Payments. Deliverables and judges-first description live in
[SUBMISSION.md](SUBMISSION.md). Demo script in [DEMO.md](DEMO.md).

## License

MIT, see [LICENSE](LICENSE).
