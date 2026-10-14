# Security Policy

## Scope

ZecPay is a hackathon demo for Zcash **testnet**. It is not audited and is not
intended to hold real funds.

## Rules the project follows

- The server accepts **viewing keys only**, never spending keys or seed phrases.
- Viewing keys never appear in URLs, logs, client storage, webhooks, or API
  responses that do not need them. Merchant API views exclude them.
- Webhook payloads carry only reconciling fields (ids, status, amount, tx).
- Do not use a mainnet seed, mainnet viewing key, or real funds with any
  deployment of this project.

## Reporting a vulnerability

Open a private security advisory on GitHub or email the maintainer via the
profile listed on the repository. Please include steps to reproduce, the
expected behavior, and the actual behavior. Do not open a public issue for a
live vulnerability.
