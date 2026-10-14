"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Check, Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { buttonClass, Card } from "@/components/ui";
import { formatZec, statusLabel } from "@/lib/zec/format";
import type { DetectedPayment, Invoice } from "@/lib/zec/types";

const toneChip: Record<string, string> = {
  pending: "border-[var(--border)] bg-black/[0.03] text-[var(--muted)]",
  muted: "border-[var(--border)] bg-black/[0.03] text-[var(--faint)]",
  progress: "border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)]",
  success: "border-[var(--mint)]/30 bg-[var(--mint)]/10 text-[var(--mint)]",
  error: "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]",
};

export function CheckoutClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentUri, setPaymentUri] = useState("");
  const [payment, setPayment] = useState<DetectedPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [proofBusy, setProofBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [watcher, setWatcher] = useState("mock");

  const proveRef = useRef<HTMLDivElement | null>(null);
  const wasSettled = useRef(false);

  useEffect(() => {
    let es: EventSource | null = null;
    let cancelled = false;
    async function init() {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error ?? "Invoice not found");
        setLoading(false);
        return;
      }
      setInvoice(data.invoice);
      setPaymentUri(data.paymentUri);
      setQrSvg(data.paymentQrSvg ?? null);
      setPayment(data.payment ?? null);
      setProofPath(data.proofPath ?? null);
      setWatcher(data.watcher ?? "mock");
      setLoading(false);
      if (
        data.invoice.status === "confirmed" ||
        data.invoice.status === "expired" ||
        data.invoice.status === "cancelled"
      )
        return;
      es = new EventSource(`/api/invoices/${invoiceId}/stream`);
      es.addEventListener("status", (ev) => {
        const d = JSON.parse((ev as MessageEvent).data);
        setInvoice(d.invoice);
        setPayment(d.payment ?? null);
        if (
          ["confirmed", "expired", "cancelled", "failed"].includes(d.invoice.status)
        )
          es?.close();
      });
      es.onerror = () => {};
    }
    void init();
    return () => {
      cancelled = true;
      es?.close();
    };
  }, [invoiceId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // When the invoice settles, bring the proof panel into view so the next
  // step is impossible to miss.
  const invoiceStatus = invoice?.status;
  useEffect(() => {
    if (invoiceStatus === "confirmed" && !wasSettled.current) {
      wasSettled.current = true;
      proveRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (invoiceStatus && invoiceStatus !== "confirmed") {
      wasSettled.current = false;
    }
  }, [invoiceStatus]);

  async function simulatePay() {
    setPayBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/simulate-pay`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ?? "Simulation is only available in demo mode.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPayBusy(false);
    }
  }

  async function copyUri() {
    try {
      await navigator.clipboard?.writeText(paymentUri);
      setCopied(true);
      toast.success("Payment request copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  async function genProof() {
    setProofBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/disclosure`, {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not generate proof.");
      setProofPath(d.verifyPath);
      // Take the payee straight to the proof page.
      router.push(d.verifyPath);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProofBusy(false);
    }
  }

  async function reissue() {
    if (!invoice) return;
    setPayBusy(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchantId: invoice.merchantId,
          amountZat: invoice.amountZat,
          title: invoice.title,
          reference: invoice.reference,
          description: invoice.description,
        }),
      });
      const d = await res.json();
      if (res.ok) router.push(`/pay/${d.invoice.id}`);
    } finally {
      setPayBusy(false);
    }
  }

  /** Live countdown text while the invoice can still be paid, else null. */
  function expiryLabel(): string | null {
    if (!invoice) return null;
    if (invoice.status !== "pending" && invoice.status !== "detected") return null;
    const ms = Date.parse(invoice.expiresAt) - now;
    if (ms <= 0) return "Expiring now";
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `Expires in ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `Expires in ${hours}h ${mins % 60}m`;
    return `Expires ${new Date(invoice.expiresAt).toLocaleDateString()}`;
  }

  if (loading)
    return (
      <Centered>
        <div className="flex w-64 flex-col gap-3" aria-label="Loading checkout">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-3 w-40" />
        </div>
      </Centered>
    );
  if (error || !invoice) return <Centered>{error ?? "Invoice not found"}</Centered>;

  const sl = statusLabel(invoice.status);
  const settled = invoice.status === "confirmed";
  const dead =
    invoice.status === "expired" || invoice.status === "cancelled";

  return (
    <div className="relative z-10 min-h-screen">
      <header className="mx-auto flex max-w-xl items-center justify-between px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--text)]">
          <span aria-hidden>&larr;</span> Dashboard
        </Link>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneChip[sl.tone]}`}>
          {sl.label}
        </span>
      </header>

      <main className="mx-auto max-w-xl px-6 pb-20 pt-4">
        {/* Amount */}
        <Card className="p-6">
          <span className="eyebrow">Amount due</span>
          {invoice.title && (
            <h1 className="mt-2 text-lg font-semibold tracking-tight">{invoice.title}</h1>
          )}
          {invoice.reference && (
            <p className="ff-mono mt-1 text-[11px] text-[var(--muted)]">{invoice.reference}</p>
          )}
          <div className="ff-mono mt-3 text-4xl font-medium tracking-tight">
            {formatZec(invoice.amountZat, { symbol: false })}{" "}
            <span className="text-[var(--gold)]">ZEC</span>
          </div>
          {invoice.description && (
            <p className="mt-3 text-[13px] leading-6 text-[var(--muted)]">{invoice.description}</p>
          )}
          <p className="ff-mono mt-3 text-[11px] text-[var(--faint)]">memo {invoice.memoToken}</p>
          {expiryLabel() && (
            <p className="ff-mono mt-2 text-[11px] text-[var(--gold)]">{expiryLabel()}</p>
          )}
        </Card>

        {error && (
          <p className="mt-4 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        {dead ? (
          <Card className="mt-5 p-8">
            <span className="eyebrow">
              {invoice.status === "cancelled" ? "Cancelled" : "Expired"}
            </span>
            <h2 className="t-card-title mt-3">
              {invoice.status === "cancelled"
                ? "This invoice was cancelled."
                : "This invoice expired."}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">
              No payment was received. Issue a fresh invoice with the same
              details.
            </p>
            <button
              onClick={reissue}
              disabled={payBusy}
              className={buttonClass("gold", "md", "mt-5 w-full")}
            >
              {payBusy ? "..." : "Reissue invoice"}
            </button>
            <Link
              href="/dashboard"
              className={buttonClass("ghost", "md", "mt-3 w-full")}
            >
              Back to dashboard
            </Link>
          </Card>
        ) : settled ? (
          <Card className="mt-5 overflow-hidden p-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--mint)]/15 text-[var(--mint)]">
                <ShieldCheck size={15} aria-hidden />
              </span>
              <h2 className="t-card-title text-[var(--mint)]">Paid, privately</h2>
            </div>
            <p className="mt-3 text-[14px] leading-6 text-[var(--muted)]">
              The merchant received shielded ZEC, detected with a viewing key and
              matched to this invoice by its encrypted memo. Spend keys never
              touched the server.
            </p>
            {payment?.txid && (
              <p className="ff-mono mt-4 break-all text-[11px] text-[var(--faint)]">tx {payment.txid}</p>
            )}

            <div ref={proveRef} className="mt-6 scroll-mt-6 rounded-xl border border-[var(--border)] bg-black/[0.03] p-5">
              <span className="eyebrow">Prove it</span>
              <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">
                Generate a shareable proof of exactly this payment. It reveals
                nothing else about the wallet.
              </p>
              {proofPath ? (
                <div className="mt-4 flex flex-col gap-2">
                  <Link href={proofPath} className="ff-mono break-all text-[12px] text-[var(--mint)] underline underline-offset-4">
                    {proofPath}
                  </Link>
                  <button
                    onClick={() => {
                      void navigator.clipboard?.writeText(
                        window.location.origin + proofPath,
                      );
                      toast.success("Proof link copied");
                    }}
                    className={buttonClass("ghost", "sm", "w-fit")}
                  >
                    Copy proof link
                  </button>
                </div>
              ) : (
                <button onClick={genProof} disabled={proofBusy} className={buttonClass("mint", "md", "mt-4")}>
                  {proofBusy ? "Generating..." : "Generate proof of payment"}
                </button>
              )}
            </div>

            <Link href="/dashboard" className={buttonClass("ghost", "md", "mt-6")}>Back to dashboard</Link>
          </Card>
        ) : (
          <>
            {/* Pay with ZEC */}
            <Card className="mt-5 p-8">
              <span className="eyebrow">Pay with ZEC</span>
              <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-stretch">
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <div className="flex aspect-square w-40 items-center justify-center overflow-hidden rounded-2xl bg-white p-3">
                    {qrSvg ? (
                      <div
                        className="h-full w-full"
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                      />
                    ) : (
                      <span className="text-[var(--faint)]">
                        <ShieldGlyph />
                      </span>
                    )}
                  </div>
                  <span className="ff-mono text-[9px] uppercase tracking-wider text-[var(--faint)]">
                    scan in a zcash wallet
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-2.5">
                  <p className="text-[13px] text-[var(--muted)]">
                    Open the request in a Zcash wallet, or copy it. The amount and
                    memo are pre-filled.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={copyUri} className={buttonClass("ghost", "sm", "flex-1")}>
                      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                      {copied ? "Copied" : "Copy request"}
                    </button>
                    <a href={paymentUri} className={buttonClass("ghost", "sm", "flex-1")}>Open in wallet</a>
                  </div>
                </div>
              </div>
              <button onClick={simulatePay} disabled={payBusy} className={buttonClass("gold", "md", "mt-6 w-full")}>
                {payBusy ? "..." : "Simulate wallet payment"}
              </button>
              <p className="ff-mono mt-3 text-center text-[10px] uppercase tracking-wider text-[var(--faint)]">
                {watcher === "ledger"
                  ? "live testnet scan · pay from a real wallet"
                  : "demo · stands in for scanning on testnet"}
              </p>
            </Card>

          </>
        )}
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

function ShieldGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--faint)]">
      <path d="M12 2.5l7 2.5v6c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9v-6l7-2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
