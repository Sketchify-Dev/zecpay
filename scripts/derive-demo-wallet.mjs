// scripts/derive-demo-wallet.mjs
// Offline helper: derive a TESTNET-only demo wallet's viewing key and Orchard
// receive address from a mnemonic, so the server can hold a real UFVK without
// ever seeing spend-key material.
//
// The mnemonic is used here, in a separate offline step, and is NOT part of the
// running server. Only the printed UFVK is put into the server environment,
// which preserves the "spend keys never touch the server" property.
//
// Usage:
//   DEMO_MNEMONIC="word1 word2 ..." node scripts/derive-demo-wallet.mjs

import { orchardAddressFromUfvk, testDeriveKeys } from "@ledgerhq/zcash-utils";

const mnemonic = process.env.DEMO_MNEMONIC;
if (!mnemonic) {
  console.error("Set DEMO_MNEMONIC to a testnet-only BIP-39 phrase.");
  process.exit(1);
}

const { ufvk } = testDeriveKeys(mnemonic, 0, "testnet");
const address = orchardAddressFromUfvk(ufvk);

console.log("# Testnet-only demo wallet (do not use on mainnet)");
console.log(`ZECPAY_DEMO_UFVK=${ufvk}`);
console.log(`Address (fund this from a testnet faucet): ${address}`);
