// scripts/zcash-scan.mjs
// Reproducible proof that ZecPay's real detection pipeline talks to Zcash
// testnet. Connects to a live lightwalletd node, reads the chain tip, and scans
// a block range with a watch-only viewing key, the exact calls that
// LedgerPaymentWatcher uses. No faucet or funds required: it proves the scan
// runs on real chain data.
//
// Zero matches on an unfunded demo wallet is the correct, honest result; it
// still demonstrates connect, fetch real compact blocks, and trial-decrypt.
//
// Usage:
//   npm run zcash:scan
//   ZECPAY_DEMO_UFVK=uview... npm run zcash:scan
//   ZECPAY_GRPC_URL=... ZECPAY_SCAN_BLOCKS=1000 npm run zcash:scan

import { getChainTip, startSync, testDeriveKeys } from "@ledgerhq/zcash-utils";

const grpcUrl = process.env.ZECPAY_GRPC_URL ?? "https://testnet.zec.rocks:443";
const blocks = Number(process.env.ZECPAY_SCAN_BLOCKS ?? 500);

// A well-known BIP-39 test vector. Testnet only, holds no funds. Used solely to
// obtain a valid UFVK so the scanner has something to trial-decrypt against.
const TEST_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

async function main() {
  const ufvk =
    process.env.ZECPAY_DEMO_UFVK ??
    testDeriveKeys(TEST_MNEMONIC, 0, "testnet").ufvk;

  console.log(`endpoint    ${grpcUrl}`);
  console.log(`viewing key ${ufvk.length} chars (watch-only, not printed)`);

  const tip = await getChainTip(grpcUrl);
  const start = Math.max(1, tip - blocks);
  console.log(`chain tip   ${tip.toLocaleString()}`);
  console.log(
    `scanning    ${start.toLocaleString()} to ${tip.toLocaleString()} (${blocks} blocks)`,
  );

  const stream = await startSync({
    grpcUrl,
    viewingKey: ufvk,
    startHeight: start,
    endHeight: tip,
    network: "testnet",
    orchardOnly: true,
  });

  let matched = 0;
  let tx = await stream.next();
  while (tx !== null) {
    matched += 1;
    tx = await stream.next();
  }
  const stats = await stream.stats();

  console.log("");
  console.log(
    `RESULT  blocks scanned ${stats.blocksScanned}, matched txs ${matched}, ${stats.elapsedMs}ms`,
  );
  console.log(
    matched === 0
      ? "0 matches is expected for an unfunded demo wallet. The scan ran on real testnet blocks: the detection pipeline is real."
      : "Matched real incoming notes on testnet.",
  );
}

main().catch((e) => {
  console.error("scan failed:", e.message);
  process.exit(1);
});
