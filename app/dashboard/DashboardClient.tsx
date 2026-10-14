"use client";

import {
  ArrowRight,
  BadgeCheck,
  Hourglass,
  Plus,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { Logo } from "@/components/logo";
import { buttonClass, Card } from "@/components/ui";
import { parseZecToZatoshi } from "@/lib/zec/amount";
import { formatZec, shortAddress, statusLabel } from "@/lib/zec/format";
import type { Invoice } from "@/lib/zec/types";

// Client-side schema mirrors the server validation in
// lib/server/invoices.ts (the server stays the source of truth).
const invoiceSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Enter an amount in ZEC.")
    .refine(
      (v) => {
        try {
          return parseZecToZatoshi(v) > 0n;
        } catch {
          return false;
        }
      },
      "Enter a valid amount, up to 8 decimals.",
    ),
  title: z.string().max(120).optional(),
  reference: z
    .string()
    .max(64)
    .refine(
      (v) => !v || /^[A-Za-z0-9][A-Za-z0-9 _-]*$/.test(v.trim()),
      "Use letters, numbers, spaces, - or _.",
    )
    .optional(),
  description: z.string().max(500).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// Placeholder testnet merchant. The mock watcher does not validate these, so
// they are fine for the demo; a real merchant supplies their own UA + UFVK.
const DEMO_MERCHANT = {
  name: "Demo Studio",
  network: "test",
  address: "u1demo0zecpaytestnetunifiedaddressplaceholder",
  ufvk: "uviewtest1demozecpayfullviewingkeyplaceholder",
};

const toneChip: Record<string, string> = {
  pending: "border-[var(--border)] bg-black/[0.03] text-[var(--muted)]",
  muted: "border-[var(--border)] bg-black/[0.03] text-[var(--faint)]",
  progress: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]",
  success: "border-[var(--mint)]/40 bg-[var(--mint)]/10 text-[var(--mint)]",
  error: "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]",
};

export function DashboardClient() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [network, setNetwork] = useState("testnet");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [demoName, setDemoName] = useState("Demo Merchant");

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { amount: "0.05", title: "", reference: "", description: "" },
  });

  // The merchant store is file-backed, but verify the stored id anyway so a
  // wiped data directory falls back to the create-merchant state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let id: string | null = null;
      try {
        id = localStorage.getItem("zecpay_merchant");
      } catch {
        // storage unavailable
      }
      if (!id) return;
      try {
        const res = await fetch(`/api/merchants/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error("gone");
        if (cancelled) return;
        setMerchantId(id);
        setMerchantName(data.merchant.name ?? null);
        setNetwork(data.merchant.network === "main" ? "mainnet" : "testnet");
      } catch {
        try {
          localStorage.removeItem("zecpay_merchant");
        } catch {
          // ignore
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async (id: string) => {
    const res = await fetch(`/api/invoices?merchantId=${encodeURIComponent(id)}`);
    if (!res.ok) return;
    const data = await res.json();
    setInvoices((data.invoices as Invoice[]) ?? []);
  }, []);

  useEffect(() => {
    if (!merchantId) return;
    void refresh(merchantId);
    const t = setInterval(() => void refresh(merchantId), 3000);
    return () => clearInterval(t);
  }, [merchantId, refresh]);

  // Real summaries, computed only from actual invoices. Nothing fabricated.
  const stats = useMemo(() => {
    let received = 0n;
    let pending = 0;
    let settled = 0;
    let proofs = 0;
    for (const inv of invoices) {
      if (inv.status === "confirmed") {
        settled += 1;
        try {
          received += BigInt(inv.amountZat);
        } catch {
          // ignore malformed amounts in summaries
        }
      } else if (inv.status === "pending" || inv.status === "detected") {
        pending += 1;
      }
      if (inv.disclosureId) proofs += 1;
    }
    return { received, pending, settled, proofs };
  }, [invoices]);

  const proofInvoices = useMemo(
    () => invoices.filter((i) => i.disclosureId),
    [invoices],
  );

  async function createMerchant() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/merchants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...DEMO_MERCHANT,
          name:
            demoName.trim().slice(0, 80) || "Demo Merchant",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "could not create merchant");
      const id = data.merchant.id as string;
      try {
        localStorage.setItem("zecpay_merchant", id);
      } catch {
        // ignore
      }
      setMerchantId(id);
      setMerchantName(data.merchant.name ?? null);
      setNetwork(data.merchant.network === "main" ? "mainnet" : "testnet");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(values: InvoiceFormValues) {
    if (!merchantId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchantId,
          amountZec: values.amount,
          title: values.title || undefined,
          reference: values.reference || undefined,
          description: values.description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "unknown merchant") {
          try {
            localStorage.removeItem("zecpay_merchant");
          } catch {
            // ignore
          }
          setMerchantId(null);
          setInvoices([]);
          throw new Error("Session expired. Create a demo merchant again.");
        }
        // Map server field errors onto the form; input is preserved.
        if (data.fields && typeof data.fields === "object") {
          for (const [k, msg] of Object.entries(data.fields)) {
            if (
              (k === "amount" ||
                k === "title" ||
                k === "reference" ||
                k === "description") &&
              typeof msg === "string"
            ) {
              form.setError(k, { message: msg });
            }
          }
        }
        throw new Error(data.error ?? "could not create invoice");
      }
      form.reset({ amount: "0.05", title: "", reference: "", description: "" });
      toast.success("Invoice created");
      await refresh(merchantId);
      document.getElementById("invoices")?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${cancelTarget}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "could not cancel invoice");
      setCancelTarget(null);
      toast.success("Invoice cancelled");
      if (merchantId) await refresh(merchantId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCancelBusy(false);
    }
  }

  if (!merchantId) {
    return (
      <div className="relative z-10 min-h-screen">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" aria-label="ZecPay home">
            <Logo />
          </Link>
          <span className="eyebrow">Merchant dashboard</span>
        </header>
        <main className="mx-auto max-w-5xl px-6 pb-16 pt-4" id="top">
          <h1 className="t-section">Your invoices</h1>
          {error && (
            <p className="mt-6 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}
          <Card className="mt-8 max-w-lg p-8">
            <span className="eyebrow">Get started</span>
            <h2 className="t-card-title mt-3">Start getting paid privately</h2>
            <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">
              Name your demo merchant to generate invoices. In production you
              register your own Unified Address and viewing key, the spend key
              never leaves your wallet.
            </p>
            <label htmlFor="demo-name" className="mt-5 block text-[13px] text-[var(--muted)]">
              Merchant name
            </label>
            <input
              id="demo-name"
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              maxLength={80}
              className="mt-1.5 h-11 w-full rounded-xl border border-[var(--border)] bg-black/[0.03] px-4 text-sm outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]/60"
              placeholder="Demo Merchant"
            />
            <button
              onClick={createMerchant}
              disabled={busy}
              className={buttonClass("gold", "md", "mt-4")}
            >
              {busy ? "Creating..." : "Create demo merchant"}
            </button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <DashboardShell
      merchantName={merchantName}
      network={network}
      pendingCount={stats.pending}
    >
      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel this invoice?"
        description="The invoice can no longer be paid. This is terminal, but the record stays in your history."
        confirmLabel="Cancel invoice"
        busy={cancelBusy}
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />
      <main id="top" className="mx-auto max-w-5xl scroll-mt-6 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="t-section">Overview</h1>
            <p className="mt-1 text-[14px] text-[var(--muted)]">
              Private invoices, live status, verifiable proofs.
            </p>
          </div>
          <span className="ff-mono hidden items-center gap-1.5 text-[11px] text-[var(--faint)] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)] animate-pulse-dot" />
            live
          </span>
        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        {/* Real stat cards: every number comes from actual invoices. */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<Wallet size={16} className="text-[var(--accent)]" />}
            label="Received"
            value={`${formatZec(stats.received, { symbol: false })} ZEC`}
          />
          <StatCard
            icon={<Hourglass size={16} className="text-[var(--gold)]" />}
            label="Awaiting payment"
            value={String(stats.pending)}
          />
          <StatCard
            icon={<BadgeCheck size={16} className="text-[var(--mint)]" />}
            label="Settled"
            value={String(stats.settled)}
          />
          <StatCard
            icon={<ShieldCheck size={16} className="text-[var(--accent)]" />}
            label="Proofs issued"
            value={String(stats.proofs)}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* New invoice */}
          <Card className="h-fit scroll-mt-6 p-7" id="new">
            <span className="eyebrow">New invoice</span>
            <p className="ff-mono mt-2 text-[11px] text-[var(--faint)]">
              merchant {shortAddress(merchantId, 10, 4)}
            </p>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-5 flex flex-col gap-4"
              noValidate
            >
              <div>
                <label htmlFor="inv-amount" className="text-[13px] text-[var(--muted)]">
                  Amount
                </label>
                <div className="mt-1.5 flex items-center rounded-xl border border-[var(--border)] bg-black/[0.03] px-4 focus-within:border-[var(--accent)]/60">
                  <input
                    id="inv-amount"
                    inputMode="decimal"
                    aria-invalid={!!form.formState.errors.amount}
                    className="ff-mono h-12 w-full bg-transparent text-lg outline-none placeholder:text-[var(--faint)]"
                    placeholder="0.05"
                    {...form.register("amount")}
                  />
                  <span className="ff-mono text-sm text-[var(--gold)]">ZEC</span>
                </div>
                {form.formState.errors.amount && (
                  <FieldError message={form.formState.errors.amount.message ?? "Invalid amount."} />
                )}
              </div>
              <div>
                <label htmlFor="inv-title" className="text-[13px] text-[var(--muted)]">
                  Title <span className="text-[var(--faint)]">(optional)</span>
                </label>
                <input
                  id="inv-title"
                  maxLength={120}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[var(--border)] bg-black/[0.03] px-4 text-sm outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]/60"
                  placeholder="Logo design, March"
                  {...form.register("title")}
                />
              </div>
              <div>
                <label htmlFor="inv-reference" className="text-[13px] text-[var(--muted)]">
                  Reference <span className="text-[var(--faint)]">(optional)</span>
                </label>
                <input
                  id="inv-reference"
                  maxLength={64}
                  aria-invalid={!!form.formState.errors.reference}
                  className="ff-mono mt-1.5 h-11 w-full rounded-xl border border-[var(--border)] bg-black/[0.03] px-4 text-sm outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]/60"
                  placeholder="ORD-001"
                  {...form.register("reference")}
                />
                {form.formState.errors.reference && (
                  <FieldError message={form.formState.errors.reference.message ?? "Invalid reference."} />
                )}
              </div>
              <div>
                <label htmlFor="inv-description" className="text-[13px] text-[var(--muted)]">
                  Note for the payer <span className="text-[var(--faint)]">(optional)</span>
                </label>
                <textarea
                  id="inv-description"
                  maxLength={500}
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-xl border border-[var(--border)] bg-black/[0.03] px-4 py-3 text-sm outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]/60"
                  placeholder="Due Friday. Thank you."
                  {...form.register("description")}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className={buttonClass("gold", "md", "w-full")}
              >
                <Plus size={16} aria-hidden /> Create invoice
              </button>
            </form>
          </Card>

          {/* Invoice list */}
          <div id="invoices" className="scroll-mt-6">
            <span className="eyebrow">
              {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
            </span>
            {invoices.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="No invoices yet"
                  description="Create your first private invoice and share its checkout link."
                  icons={[ReceiptText]}
                  action={{ label: "New invoice", onClick: () => scrollTo("new") }}
                />
              </div>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {invoices.map((inv) => {
                  const sl = statusLabel(inv.status);
                  return (
                    <li key={inv.id}>
                      <Card className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--card-hover)]">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {inv.title || inv.reference || "Invoice"}
                          </p>
                          <p className="ff-mono mt-0.5 truncate text-[11px] text-[var(--faint)]">
                            {inv.id}
                          </p>
                          <p className="ff-mono mt-1 text-[15px]">
                            {formatZec(inv.amountZat, { symbol: false })}{" "}
                            <span className="text-[var(--gold)]">ZEC</span>
                          </p>
                        </div>
                        <div className="flex flex-none items-center gap-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneChip[sl.tone]}`}
                          >
                            {sl.label}
                          </span>
                          <Link
                            href={`/pay/${inv.id}`}
                            className={buttonClass("ghost", "sm")}
                          >
                            Checkout <ArrowRight size={14} aria-hidden />
                          </Link>
                          {inv.status === "pending" && (
                            <button
                              onClick={() => setCancelTarget(inv.id)}
                              className={buttonClass(
                                "ghost",
                                "sm",
                                "text-[var(--danger)]",
                              )}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Proofs */}
        <div id="proofs" className="mt-8 scroll-mt-6">
          <span className="eyebrow">Proofs issued</span>
          {proofInvoices.length === 0 ? (
            <div className="mt-3 max-w-lg">
              <EmptyState
                title="No proofs yet"
                description="When an invoice settles, generate a proof from its checkout page. It will appear here."
                icons={[ShieldCheck]}
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {proofInvoices.map((inv) => (
                <li key={inv.id}>
                  <Card className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {inv.title || inv.reference || "Invoice"}
                      </p>
                      <p className="ff-mono mt-0.5 truncate text-[11px] text-[var(--faint)]">
                        {inv.disclosureId}
                      </p>
                    </div>
                    <Link
                      href={`/verify/${inv.disclosureId}`}
                      className={buttonClass("ghost", "sm")}
                    >
                      Open proof <ArrowRight size={14} aria-hidden />
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </DashboardShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12px] text-[var(--muted)]">{label}</span>
      </div>
      <p className="ff-mono mt-2 truncate text-xl font-semibold tracking-tight">
        {value}
      </p>
    </Card>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1.5 text-[12px] text-[var(--danger)]">{message}</p>;
}
