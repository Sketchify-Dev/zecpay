# ZECATHON submission (draft)

Account: @Sketchify (Telegram @xSketchify). Track: Shielded Payments.
Deadline: Oct 28, 2026, 23:59 UTC.

## Project name
ZecPay

## Track
Shielded Payments

## Description (judges read this first; keep under 2000 chars)

ZecPay is private invoicing on Zcash.

The problem: the moment you invoice on a public chain, you publish your rates,
your clients, and your income. Freelancers and contractors cannot use on-chain
pay without leaking their whole book. Zcash makes the payment private, but then
you cannot prove a specific payment when you need to, for a dispute, a refund,
taxes, or a reference.

ZecPay does both: get paid in shielded ZEC, then generate a proof of exactly one
payment (for a client, a tax office, a landlord) that reveals nothing else.

How it works: a payee registers a Unified Address and its Unified Full Viewing
Key (UFVK). ZecPay builds a ZIP 321 payment request carrying the amount and an
encrypted memo (the order id). The payment arrives shielded; ZecPay detects it
with the viewing key (watch-only) and matches it to the invoice by the memo.
From a settled invoice, the payee mints a shareable proof; a public verify page
shows only that one payment.

Why it does not leak: the server holds only a viewing key, never a spend key, so
it can never move funds. Payments settle in the Orchard shielded pool, so
amounts and parties stay off the public ledger. A proof discloses exactly one
payment (amount, memo, transaction, recipient address) and never includes the
viewing key, so other income and history stay private.

What is real vs simulated (stated honestly): real and unit-tested are ZIP 321
request building, server-rendered QR, encrypted-memo order tokens, the
viewing-key detection and matching logic, invoice lifecycle with expiry,
persistence, and webhooks. The real detection pipeline connects to a live Zcash
testnet node and scans real compact blocks with a watch-only viewing key via
@ledgerhq/zcash-utils; a judge can reproduce it with `npm run zcash:scan` (reads
the live chain tip and scans real blocks, no funds needed). Simulated for the
demo: the positive payment match (a Simulate button) and the single-note
cryptographic disclosure, both behind interfaces and always shown under a "Demo
mode, simulated payments" badge. Nothing in the UI presents a mock as live.

## Code repository
https://github.com/Sketchify-Dev/zecpay
(Private until judging; will be made public by Oct 28, 2026.)

## Working demo
https://zecpay.onrender.com
(Open it, create a demo merchant, and run the two-minute flow in DEMO.md.)

## Demo video
(fill in: 2-minute link; script in DEMO.md)

## Checklist before submit
- [ ] Repo public
- [x] Build runs clean (`npm run build`), tests pass (`npm test`, 14/14)
- [x] Real Zcash integration, reproducible via `npm run zcash:scan`
- [ ] Demo deployed and openable by judges
- [ ] 2-minute video recorded
- [x] Description states real vs simulated accurately
