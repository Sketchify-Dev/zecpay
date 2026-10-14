# ZecPay demo

## 10-second pitch

"Get paid in private ZEC, then prove any single payment, to a client, a tax
office, a landlord, without revealing your rates or your other income."

## The problem (one sentence)

On any public chain, getting paid publishes your rates, clients, and income;
Zcash makes payments private but then you cannot prove one when you need to.
ZecPay does both: private by default, provable on demand.

## 2-minute demo script (timed)

Record at 1280x720 or 1080p, dark UI. Keep the "demo mode" badge visible; it is
part of the honesty story, not a flaw.

- 0:00 to 0:15. Landing. Read the hero line. Scroll once to the "a proof shows /
  never shows" panels so the privacy model is instantly legible. Point to the
  top-right pill: "that is a live connection to a Zcash testnet node, the block
  number is real and current."
- 0:15 to 0:40. Dashboard. Create a demo merchant. Create an invoice: amount
  0.05 ZEC, title "Logo design", reference ORD-001. Say: ZecPay builds a ZIP 321
  request carrying an encrypted memo, the order id, and the server only ever
  holds a viewing key, never a spend key.
- 0:40 to 1:10. Checkout. Show the QR (server-rendered, so the request never
  leaves our server) and the amount and title. Click "Simulate wallet payment"
  (labeled demo; it stands in for scanning in a Zcash wallet). Watch the status
  stream pending, detected, Paid. Say: detected by the viewing key, matched to
  the invoice by the encrypted memo.
- 1:10 to 1:35. The hero. Click "Generate proof of payment". Open the /verify
  link in a new tab, as if sending it to a client or an auditor. It shows only
  this one payment, and states plainly that balance, other income, and history
  stay private.
- 1:35 to 1:55. Real integration. Cut to a terminal and run `npm run zcash:scan`.
  Show it read the live chain tip and scan 500 real testnet blocks with a
  watch-only viewing key. Say: this is the exact detection code path against
  live testnet; zero matches because this demo wallet is unfunded, and we say so
  rather than fake a hit.
- 1:55 to 2:00. Punchline: "Private by default, provable on demand. Only Zcash
  can do this, with viewing keys and encrypted memos."

## What is real vs simulated (state this to judges)

- Real and unit-tested: ZIP 321 request building, server-rendered QR,
  encrypted-memo order tokens, the viewing-key detection and matching logic,
  invoice lifecycle with expiry, file-backed persistence, and webhooks.
- Real and reproducible: the detection pipeline connects to a live Zcash testnet
  node and scans real compact blocks with a watch-only viewing key via
  @ledgerhq/zcash-utils. Run `npm run zcash:scan` to see it, no funds needed.
- Simulated for the demo: the positive payment match (the Simulate button) and
  the single-note cryptographic disclosure. Both sit behind interfaces and are
  always shown under a "demo mode, simulated payments" badge.
- Deferred (post-hack): cross-chain "pay with any asset" funding.

## One-line architecture

A Next.js app with a watch-only Zcash testnet scanner (@ledgerhq/zcash-utils)
behind PaymentWatcher, DisclosureProvider, and SwapProvider interfaces that each
have a working mock, so the demo runs with zero infra and the real scanner turns
on with one env var (ZECPAY_WATCHER=ledger) and is reproducible with
`npm run zcash:scan`.
