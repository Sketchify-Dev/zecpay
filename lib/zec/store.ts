// lib/zec/store.ts
// Merchants and invoices with file-backed persistence. State survives server
// restarts (the in-memory-only version lost everything, including merchants,
// which stranded browser sessions with an "unknown merchant" error).
//
// Design: the same class API as before, plus JSON snapshot files under a data
// directory. Writes are synchronous and best-effort (a failed write never
// breaks the request; the in-memory state stays authoritative). Reads load
// once at startup. Set ZECPAY_DATA_DIR=":memory:" to disable persistence
// (useful for tests).

import * as fs from "node:fs";
import * as path from "node:path";

import { encodeOrderMemo } from "./memo";
import type { Invoice, MerchantAccount, ZecNetwork } from "./types";

function newId(prefix: string): string {
  const uuid = globalThis.crypto.randomUUID().replace(/-/g, "");
  return `${prefix}_${uuid}`;
}

function dataDir(): string | null {
  if (process.env.ZECPAY_DATA_DIR === ":memory:") return null;
  return process.env.ZECPAY_DATA_DIR ?? path.join(process.cwd(), "data");
}

function readJsonArray(file: string): unknown[] {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export interface CreateInvoiceInput {
  merchantId: string;
  amountZat: bigint;
  address: string;
  title?: string;
  reference?: string;
  description?: string;
  fiatRef?: string;
  fromHeight?: number;
  ttlMs?: number;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export class InvoiceStore {
  private byId = new Map<string, Invoice>();

  constructor() {
    this.load();
  }

  create(input: CreateInvoiceInput): Invoice {
    const id = newId("inv");
    const now = Date.now();
    const invoice: Invoice = {
      id,
      merchantId: input.merchantId,
      amountZat: input.amountZat.toString(),
      title: input.title,
      reference: input.reference,
      description: input.description,
      fiatRef: input.fiatRef,
      address: input.address,
      memoToken: encodeOrderMemo(id),
      status: "pending",
      fromHeight: input.fromHeight,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + (input.ttlMs ?? DEFAULT_TTL_MS)).toISOString(),
    };
    this.byId.set(id, invoice);
    this.save();
    return invoice;
  }

  get(id: string): Invoice | undefined {
    return this.byId.get(id);
  }

  list(merchantId?: string): Invoice[] {
    const all = [...this.byId.values()];
    const scoped = merchantId
      ? all.filter((i) => i.merchantId === merchantId)
      : all;
    return scoped.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  update(
    id: string,
    patch: Partial<Pick<Invoice, "status" | "txid" | "paidAt" | "disclosureId">>,
  ): Invoice {
    const existing = this.byId.get(id);
    if (!existing) throw new Error(`unknown invoice: ${id}`);
    const updated = { ...existing, ...patch };
    this.byId.set(id, updated);
    this.save();
    return updated;
  }

  /** Mark pending invoices past their expiry as expired; returns changed ids. */
  sweepExpired(nowMs = Date.now()): string[] {
    const changed: string[] = [];
    for (const inv of this.byId.values()) {
      if (inv.status === "pending" && Date.parse(inv.expiresAt) < nowMs) {
        this.byId.set(inv.id, { ...inv, status: "expired" });
        changed.push(inv.id);
      }
    }
    if (changed.length) this.save();
    return changed;
  }

  private file(): string | null {
    const dir = dataDir();
    return dir ? path.join(dir, "invoices.json") : null;
  }

  private load(): void {
    const file = this.file();
    if (!file) return;
    for (const v of readJsonArray(file)) {
      if (!isRecord(v) || typeof v.id !== "string") continue;
      this.byId.set(v.id, v as unknown as Invoice);
    }
  }

  private save(): void {
    const file = this.file();
    if (!file) return;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify([...this.byId.values()], null, 2));
    } catch {
      // Persistence is best-effort; memory stays authoritative.
    }
  }
}

export interface CreateMerchantInput {
  name: string;
  network: ZecNetwork;
  address: string;
  ufvk: string;
  webhookUrl?: string;
}

export class MerchantStore {
  private byId = new Map<string, MerchantAccount>();

  constructor() {
    this.load();
  }

  create(input: CreateMerchantInput): MerchantAccount {
    const merchant: MerchantAccount = {
      id: newId("mch"),
      name: input.name,
      network: input.network,
      address: input.address,
      ufvk: input.ufvk,
      webhookUrl: input.webhookUrl,
      createdAt: new Date().toISOString(),
    };
    this.byId.set(merchant.id, merchant);
    this.save();
    return merchant;
  }

  get(id: string): MerchantAccount | undefined {
    return this.byId.get(id);
  }

  list(): MerchantAccount[] {
    return [...this.byId.values()];
  }

  private file(): string | null {
    const dir = dataDir();
    return dir ? path.join(dir, "merchants.json") : null;
  }

  private load(): void {
    const file = this.file();
    if (!file) return;
    for (const v of readJsonArray(file)) {
      if (!isRecord(v) || typeof v.id !== "string") continue;
      this.byId.set(v.id, v as unknown as MerchantAccount);
    }
  }

  private save(): void {
    const file = this.file();
    if (!file) return;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify([...this.byId.values()], null, 2));
    } catch {
      // Persistence is best-effort; memory stays authoritative.
    }
  }
}

// Cache the singletons on globalThis so dev hot-reload keeps state.
const cache = globalThis as unknown as {
  __zecpayInvoices?: InvoiceStore;
  __zecpayMerchants?: MerchantStore;
};

export const invoiceStore: InvoiceStore =
  cache.__zecpayInvoices ?? (cache.__zecpayInvoices = new InvoiceStore());

export const merchantStore: MerchantStore =
  cache.__zecpayMerchants ?? (cache.__zecpayMerchants = new MerchantStore());
