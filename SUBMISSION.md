# ZECATHON submission

Account: @Sketchify (Telegram @xSketchify). Track: Shielded Payments.
Deadline: Oct 28, 2026, 23:59 UTC.

## Project name
ZecPay

## Track
Shielded Payments

## Description (paste into the form; about 1,600 characters, limit 2,000)

ZecPay is private invoicing on Zcash: get paid in shielded ZEC, then prove any single payment without revealing your rates, clients, or other income.

The problem: invoicing on a public chain publishes your rates, clients, and income. Zcash makes payments private, but then you cannot prove a specific payment when you need to, for a dispute, a refund, taxes, or a reference.

How it works: a payee registers a Unified Address and its viewing key (UFVK). ZecPay builds a ZIP 321 payment request with the amount and an encrypted memo (the order id), shown as a QR code. The payment arrives shielded; ZecPay detects it with the viewing key and matches it to the invoice by memo. From a settled invoice, the payee mints a shareable proof, and a public verify page shows only that one payment.

Why it does not leak: the server holds a viewing key only, never a spend key, so it can never move funds. Payments settle in the Orchard shielded pool. A proof discloses one payment (amount, memo, transaction, recipient) and never the viewing key, so balance, history, and other income stay private.

Real vs simulated: real and unit-tested (17 tests) are ZIP 321 requests, server-rendered QR, memo matching, the invoice lifecycle (expiry, cancellation), persistence, and webhooks. The detection pipeline is real: it scans live Zcash testnet blocks watch-only via @ledgerhq/zcash-utils, reproducible with npm run zcash:scan (no funds needed). Simulated for the demo: the payment itself (a Simulate button) and the proof cryptography, always labeled "Demo mode, simulated payments" in the UI.

## Code repository
https://github.com/Sketchify-Dev/zecpay

## Working demo
https://zecpay.onrender.com
(Free hosting: the first visit after idling can take about a minute to wake up.)

## Demo video
https://youtu.be/e3xrq4XDH-k

## Checklist before submit
- [x] Repo public
- [x] Build runs clean (`npm run build`), tests pass (`npm test`, 17/17)
- [x] Real Zcash integration, reproducible via `npm run zcash:scan`
- [x] Demo deployed and openable by judges
- [x] Demo video recorded and uploaded
- [x] Description states real vs simulated accurately
- [ ] Mainnet shielded ZEC payout address ready
- [ ] Form submitted on thezecathon.com
