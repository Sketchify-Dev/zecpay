"use client";

import { useEffect, useState } from "react";

type ZcashStatus = {
  connected: boolean;
  chainTip: number | null;
  network: string;
};

// Live indicator of the real connection to a Zcash testnet lightwalletd node.
export function ZcashStatusIndicator() {
  const [status, setStatus] = useState<ZcashStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/zcash/status");
        const d = (await res.json()) as ZcashStatus;
        if (!cancelled) setStatus(d);
      } catch {
        if (!cancelled) {
          setStatus({ connected: false, chainTip: null, network: "testnet" });
        }
      }
    };
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const connected = status?.connected ?? false;
  const net = status?.network === "mainnet" ? "mainnet" : "testnet";
  const detail =
    status === null
      ? "connecting"
      : connected && status.chainTip != null
        ? `#${status.chainTip.toLocaleString()}`
        : "offline";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50">
      <span
        title="Live connection to a Zcash testnet lightwalletd node"
        className="ff-mono pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/90 px-3 py-1.5 text-[11px] text-[var(--muted)] shadow-[0_4px_16px_-8px_rgba(16,24,40,0.3)] backdrop-blur"
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            connected ? "bg-[var(--mint)] animate-pulse-dot" : "bg-[var(--faint)]"
          }`}
        />
        zcash {net} <span className="text-[var(--text)]">{detail}</span>
      </span>
    </div>
  );
}
