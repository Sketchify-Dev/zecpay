"use client";

import { useState } from "react";

import { Card } from "@/components/ui";

const faqs = [
  {
    q: "Can the server spend my funds?",
    a: "No. ZecPay holds only a viewing key, which detects incoming payments but can never move them. Your spend key stays in your own wallet.",
  },
  {
    q: "What does a proof actually reveal?",
    a: "Exactly one payment: its amount, the invoice memo, the transaction, and the receiving address. It never includes your viewing key, so your balance, other income, and history stay private.",
  },
  {
    q: "Do my clients see each other?",
    a: "Never. Each invoice is a shielded payment with its own encrypted memo. Nothing about your rates or your other clients touches the public ledger.",
  },
  {
    q: "Is this real Zcash?",
    a: "Yes. Payments settle in the Orchard shielded pool and are detected with a real viewing key against a live testnet node (shown top-right). The demo runs in simulated mode by default, and says so.",
  },
  {
    q: "What do I need to start?",
    a: "To receive, a Zcash address and its viewing key. To try the demo, nothing at all, it runs on testnet in simulated mode.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-10 flex flex-col gap-3">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <Card key={i} className="overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[var(--card-hover)]"
              aria-expanded={isOpen}
            >
              <span className="text-[15px] font-medium">{f.q}</span>
              <span
                className={`text-xl leading-none text-[var(--accent)] transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-[14px] leading-6 text-[var(--muted)]">
                  {f.a}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
