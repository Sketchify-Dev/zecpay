// lib/zec/disclosure.ts
// Selective-disclosure "proof of payment": ZecPay's hero capability.
//
// A Zcash payment is private: amounts and parties are shielded. But someone who
// gets paid often needs to PROVE a single payment (to a client, a tax office, a
// landlord) WITHOUT exposing their rates or their other income. A Disclosure
// reveals exactly one payment and nothing else about the wallet.
//
// Mock-first, like the rest of ZecPay. The mock encodes and checks the payment
// facts we already hold, and persists them to disk so a shared /verify link
// keeps working across server restarts. The real provider (zingolib-backed)
// will instead reveal the note's plaintext and let a verifier confirm its
// commitment against the chain. Both satisfy this interface.

import * as fs from "node:fs";
import * as path from "node:path";

import type { Invoice, ZecNetwork } from "./types";

/** The only fields a verifier is meant to see. Nothing else is disclosed. */
export interface PublicDisclosure {
  invoiceId: string;
  txid: string;
  amountZat: string;
  memo: string;
  /** Optional invoice title the payee chose to share as part of the proof. */
  title?: string;
  /** Optional invoice reference the payee chose to share. */
  reference?: string;
  paidAt: string; // ISO 8601
  network: ZecNetwork;
  /** Recipient Unified Address (the payee proving they were paid). */
  recipient: string;
}

export interface Disclosure {
  id: string;
  /** Opaque, shareable token that proves the payment. */
  proof: string;
  public: PublicDisclosure;
  createdAt: string;
}

export interface VerifyResult {
  valid: boolean;
  disclosure?: PublicDisclosure;
  reason?: string;
}

export interface DisclosureProvider {
  readonly id: string;
  /** Create a shareable proof for a settled invoice. */
  create(invoice: Invoice, network: ZecNetwork): Promise<Disclosure>;
  /** Verify a disclosure id or proof token; return only public fields. */
  verify(proofOrId: string): Promise<VerifyResult>;
}

const PROOF_PREFIX = "zpd1.";

function dataDir(): string | null {
  if (process.env.ZECPAY_DATA_DIR === ":memory:") return null;
  return process.env.ZECPAY_DATA_DIR ?? path.join(process.cwd(), "data");
}

function uuid(prefix: string): string {
  return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, "")}`;
}

export class MockDisclosureProvider implements DisclosureProvider {
  readonly id = "mock";
  private byId = new Map<string, Disclosure>();
  private byProof = new Map<string, string>();

  constructor() {
    this.load();
  }

  async create(invoice: Invoice, network: ZecNetwork): Promise<Disclosure> {
    if (invoice.status !== "confirmed" || !invoice.txid) {
      throw new Error("invoice is not settled");
    }
    const pub: PublicDisclosure = {
      invoiceId: invoice.id,
      txid: invoice.txid,
      amountZat: invoice.amountZat,
      memo: invoice.memoToken,
      title: invoice.title,
      reference: invoice.reference,
      paidAt: invoice.paidAt ?? new Date().toISOString(),
      network,
      recipient: invoice.address,
    };
    // Mock proof: a self-contained token of the public facts. The real provider
    // replaces this with a note-plaintext + on-chain commitment proof.
    const payload = Buffer.from(JSON.stringify(pub), "utf8").toString(
      "base64url",
    );
    const disclosure: Disclosure = {
      id: uuid("disc"),
      proof: `${PROOF_PREFIX}${payload}`,
      public: pub,
      createdAt: new Date().toISOString(),
    };
    this.byId.set(disclosure.id, disclosure);
    this.byProof.set(disclosure.proof, disclosure.id);
    this.save();
    return disclosure;
  }

  async verify(proofOrId: string): Promise<VerifyResult> {
    const known =
      this.byId.get(proofOrId) ??
      this.byId.get(this.byProof.get(proofOrId) ?? "");
    if (known) return { valid: true, disclosure: known.public };

    // Fall back to decoding a self-contained token (survives any state loss).
    if (proofOrId.startsWith(PROOF_PREFIX)) {
      try {
        const json = Buffer.from(
          proofOrId.slice(PROOF_PREFIX.length),
          "base64url",
        ).toString("utf8");
        return { valid: true, disclosure: JSON.parse(json) as PublicDisclosure };
      } catch {
        return { valid: false, reason: "malformed proof" };
      }
    }
    return { valid: false, reason: "unknown disclosure" };
  }

  private file(): string | null {
    const dir = dataDir();
    return dir ? path.join(dir, "disclosures.json") : null;
  }

  private load(): void {
    const file = this.file();
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!Array.isArray(parsed)) return;
      for (const d of parsed) {
        if (
          d &&
          typeof d === "object" &&
          typeof (d as Disclosure).id === "string" &&
          typeof (d as Disclosure).proof === "string"
        ) {
          const disc = d as Disclosure;
          this.byId.set(disc.id, disc);
          this.byProof.set(disc.proof, disc.id);
        }
      }
    } catch {
      // No file yet; start empty.
    }
  }

  private save(): void {
    const file = this.file();
    if (!file) return;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify([...this.byId.values()], null, 2));
    } catch {
      // Best effort; memory stays authoritative for this run.
    }
  }
}

const cache = globalThis as unknown as {
  __zecpayDisclosure?: DisclosureProvider;
};

export function getDisclosureProvider(): DisclosureProvider {
  if (cache.__zecpayDisclosure) return cache.__zecpayDisclosure;
  // A real zingolib-backed provider is wired here after Phase 0.
  cache.__zecpayDisclosure = new MockDisclosureProvider();
  return cache.__zecpayDisclosure;
}
