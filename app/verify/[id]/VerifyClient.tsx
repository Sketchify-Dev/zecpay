"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui";
import { Logo } from "@/components/logo";
import { formatZec, shortAddress } from "@/lib/zec/format";

type PublicDisclosure = {
  invoiceId: string;
  txid: string;
  amountZat: string;
  memo: string;
  title?: string;
  reference?: string;
  paidAt: string;
  network: string;
  recipient: string;
};

export function VerifyClient({ id }: { id: string }) {
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading");
  const [disclosure, setDisclosure] = useState<PublicDisclosure | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/disclosures/${id}`);
      const d = await res.json();
      if (cancelled) return;
      if (res.ok && d.valid) {
        setDisclosure(d.disclosure);
        setState("valid");
      } else {
        setReason(d.reason ?? "Not found");
        setState("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-5">
        <Link href="/" aria-label="ZecPay home">
          <Logo />
        </Link>
        <span className="eyebrow">Proof of payment</span>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        {state === "loading" && (
          <Card className="p-8">
            <div className="flex flex-col gap-3" aria-label="Verifying proof">
              <div className="skeleton h-3 w-28" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-3 w-48" />
            </div>
          </Card>
        )}

        {state === "invalid" && (
          <Card className="p-8">
            <p className="text-lg font-semibold text-[var(--danger)]">Could not verify</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{reason}</p>
            <Link href="/" className="mt-5 inline-block text-[13px] text-[var(--muted)] underline underline-offset-4">
              Back to ZecPay
            </Link>
          </Card>
        )}

        {state === "valid" && disclosure && (
          <>
            <Card className="relative overflow-hidden p-8">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70 blur-2xl"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(63,224,165,0.18), transparent 70%)" }}
              />
              <div className="relative flex items-center justify-between">
                <span className="eyebrow">Verified payment</span>
                <span className="ff-mono inline-flex items-center gap-1.5 rounded-full bg-[var(--mint)]/10 px-2.5 py-1 text-[11px] text-[var(--mint)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)]" /> verified
                </span>
              </div>

              {disclosure.title && (
                <p className="relative mt-4 text-[15px] font-medium">{disclosure.title}</p>
              )}
              {disclosure.reference && (
                <p className="ff-mono relative mt-1 text-[11px] text-[var(--muted)]">
                  {disclosure.reference}
                </p>
              )}

              <div className="relative mt-5">
                <div className="text-[13px] text-[var(--faint)]">Amount</div>
                <div className="ff-mono mt-1 text-4xl font-medium tracking-tight">
                  {formatZec(disclosure.amountZat, { symbol: false })}{" "}
                  <span className="text-[var(--gold)]">ZEC</span>
                </div>
              </div>

              <dl className="relative mt-7 space-y-3 text-[13px]">
                <Row label="Invoice" value={disclosure.invoiceId} />
                <Row label="Paid" value={new Date(disclosure.paidAt).toLocaleString()} plain />
                <Row label="Transaction" value={shortAddress(disclosure.txid, 10, 8)} />
                <Row label="Paid to" value={shortAddress(disclosure.recipient, 12, 6)} />
                <Row label="Network" value={disclosure.network === "main" ? "Mainnet" : "Testnet"} plain />
              </dl>
            </Card>

            <p className="mt-5 px-1 text-[12px] leading-5 text-[var(--faint)]">
              This proof reveals only this single payment. The recipient&apos;s
              balance, other income, and transaction history stay private.
              Verified with a Zcash viewing key, no spend authority is exposed.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, plain }: { label: string; value: string; plain?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-3">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className={plain ? "text-[var(--text)]" : "ff-mono text-[var(--text)]"}>{value}</dd>
    </div>
  );
}
