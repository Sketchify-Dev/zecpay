import Link from "next/link";

import { Faq } from "@/components/Faq";
import { HeroScene } from "@/components/hero-scene";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/Reveal";
import { buttonClass, Card, Eyebrow } from "@/components/ui";

const steps = [
  {
    k: "01",
    t: "Create an invoice",
    d: "Amount, title, reference. ZecPay builds a ZIP 321 request with a unique encrypted memo baked in.",
  },
  {
    k: "02",
    t: "Get paid, shielded",
    d: "Your client pays in ZEC. It lands in the Orchard shielded pool, detected with your viewing key.",
  },
  {
    k: "03",
    t: "Prove one payment",
    d: "Mint a shareable proof of a single payment. Anyone can verify it; nothing else is revealed.",
  },
];

const features = [
  {
    t: "Private by default",
    d: "Amounts and parties settle in Zcash's shielded pool. Your rates and your client list stay off the public ledger.",
  },
  {
    t: "Provable on demand",
    d: "Turn any payment into a proof with a viewing key, disclosing that one payment and nothing more.",
  },
  {
    t: "Spend keys stay with you",
    d: "The server holds a viewing key only. It can detect payments, but it can never move your funds.",
  },
];

const publicChain = [
  "Your rates are public, forever",
  "Clients can see each other's payments",
  "Every payment links back to your wallet",
  "To prove you were paid, you expose everything",
];

const onZecPay = [
  "Amounts settle shielded",
  "Each invoice stands alone",
  "Payments are unlinkable on-chain",
  "Prove one payment, reveal nothing else",
];

export default function Home() {
  return (
    <div className="relative z-10 min-h-screen">
      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="ZecPay home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] text-[var(--muted)] sm:flex">
          <a href="#how" className="transition-colors hover:text-[var(--text)]">How it works</a>
          <a href="#why" className="transition-colors hover:text-[var(--text)]">Why Zcash</a>
          <a href="#faq" className="transition-colors hover:text-[var(--text)]">FAQ</a>
        </nav>
        <Link href="/dashboard" className={buttonClass("ghost", "sm")}>Launch app</Link>
      </header>

      {/* Hero (minimalism backdrop: particle field + drawing grid lines) */}
      <section className="relative z-10 overflow-hidden">
        <HeroScene />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-14">
        <div className="animate-rise">
          <Eyebrow>ZECATHON / Shielded Payments</Eyebrow>
          <h1 className="t-hero mt-5">
            Get paid in <span className="mark">private ZEC</span>.
            <span className="block text-gradient-gold">
              Prove one payment, reveal nothing else.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-6 text-[var(--muted)]">
            On a public chain, every invoice publishes your rates and clients.
            ZecPay settles shielded and lets you prove a single payment,
            without handing over your history.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className={buttonClass("gold", "md")}>Create an invoice</Link>
            <a href="#how" className={buttonClass("ghost", "md")}>See how it works</a>
          </div>
          <ul className="mt-7 flex flex-col gap-2 text-[13px] text-[var(--muted)]">
            {[
              "No public ledger of your rates",
              "No exposed client list",
              "No spend keys on our server",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)]" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise [animation-delay:120ms]">
          <ProofCard />
        </div>
        </div>
      </section>

      {/* How it works */}
      <Reveal>
        <section id="how" className="relative z-10 mx-auto max-w-6xl scroll-mt-10 px-6 py-14">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="t-section mt-3 max-w-xl">
            Three steps. Private the whole way.
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <Card
                key={s.k}
                className="p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(16,24,40,0.06),0_16px_36px_-20px_rgba(16,24,40,0.25)]"
              >
                <span className="nchip">{s.k}</span>
                <h3 className="t-card-title mt-3">{s.t}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[var(--muted)]">{s.d}</p>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Comparison */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
          <Eyebrow>The difference</Eyebrow>
          <h2 className="t-section mt-3 max-w-xl">
            Public chains make you choose: get paid or stay private.
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Card className="bg-[var(--card-hover)] p-7">
              <span className="ff-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                On a public chain
              </span>
              <ul className="mt-5 flex flex-col gap-3.5">
                {publicChain.map((t) => (
                  <li key={t} className="flex gap-3 text-[14px] text-[var(--muted)]">
                    <span className="mt-0.5 text-[var(--danger)]" aria-hidden>&#215;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-[var(--accent)]/25 p-7">
              <span className="ff-mono text-[11px] uppercase tracking-wider text-[var(--accent)]">
                On ZecPay
              </span>
              <ul className="mt-5 flex flex-col gap-3.5">
                {onZecPay.map((t) => (
                  <li key={t} className="flex gap-3 text-[14px] font-medium">
                    <span className="mt-0.5 text-[var(--mint)]" aria-hidden>&#10003;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      </Reveal>

      {/* Why */}
      <Reveal>
        <section id="why" className="relative z-10 mx-auto max-w-6xl scroll-mt-10 px-6 py-14">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Eyebrow>Why Zcash</Eyebrow>
              <h2 className="t-section mt-3">
                Privacy you can prove.
              </h2>
              <p className="mt-4 text-[14px] leading-7 text-[var(--muted)]">
                Only Zcash pairs a shielded pool with encrypted memos and viewing
                keys. ZecPay turns that into a product: private by default,
                provable on demand.
              </p>
            </div>
            <div className="grid gap-5">
              {features.map((f) => (
                <div key={f.t} className="flex gap-5 border-b border-[var(--border)] pb-5 last:border-0">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                  <div>
                    <h3 className="text-[15px] font-semibold">{f.t}</h3>
                    <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* What a proof shows */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
          <Eyebrow>Selective disclosure</Eyebrow>
          <h2 className="t-section mt-3 max-w-xl">
            One payment, proven. Nothing else, revealed.
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Card className="p-7">
              <span className="ff-mono text-[11px] uppercase tracking-wider text-[var(--mint)]">
                A proof shows
              </span>
              <ul className="mt-5 flex flex-col gap-3.5">
                {[
                  "The amount of this payment",
                  "The invoice it settles",
                  "The transaction on-chain",
                  "The receiving address",
                  "When it was paid",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-[14px]">
                    <span className="mt-0.5 text-[var(--mint)]" aria-hidden>&#10003;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="bg-[var(--card-hover)] p-7">
              <span className="ff-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
                A proof never shows
              </span>
              <ul className="mt-5 flex flex-col gap-3.5">
                {[
                  "Your balance or other income",
                  "Your other invoices or clients",
                  "Your transaction history",
                  "Your viewing key",
                  "Anything that can spend",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-[14px] text-[var(--muted)]">
                    <span className="mt-0.5 text-[var(--danger)]" aria-hidden>&#215;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      </Reveal>

      {/* Demo walkthrough */}
      <Reveal>
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-14">
          <Eyebrow>Try it now</Eyebrow>
          <h2 className="t-section mt-3 max-w-xl">
            From invoice to verified proof in two minutes.
          </h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1", "Create an invoice", "Amount, title, reference. Get a checkout link."],
              ["2", "Share the checkout", "Your client opens it and pays in ZEC."],
              ["3", "Watch it settle", "Detected by viewing key, matched by memo."],
              ["4", "Generate the proof", "Share one verified payment, nothing else."],
            ].map(([k, t, d]) => (
              <Card key={k} className="p-6">
                <div className="ff-mono text-sm text-[var(--accent)]">{k}</div>
                <h3 className="t-card-title mt-3">{t}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-[var(--muted)]">{d}</p>
              </Card>
            ))}
          </ol>
          <div className="mt-8">
            <Link href="/dashboard" className={buttonClass("gold", "md")}>
              Start the demo
            </Link>
          </div>
        </section>
      </Reveal>

      {/* Manifesto */}
      <Reveal>
        <section className="relative z-10 border-y border-[var(--border)] bg-[var(--bg-elev)]">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <Eyebrow>The standard</Eyebrow>
            <p className="t-hero mt-4 max-w-3xl">
              Private by default.
              <span className="block text-gradient-gold">Provable on demand.</span>
            </p>
            <dl className="mt-10 grid gap-6 border-t border-[var(--border)] pt-8 sm:grid-cols-3">
              {[
                ["ZIP 321", "payment requests, QR-ready"],
                ["512 B", "encrypted memo per payment"],
                ["0", "spend keys ever held"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="ff-mono text-2xl font-semibold tracking-tight">{k}</dt>
                  <dd className="mt-1 text-[13px] text-[var(--muted)]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <section id="faq" className="relative z-10 mx-auto max-w-3xl scroll-mt-10 px-6 py-14">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="t-section mt-3">
            Questions, answered.
          </h2>
          <Faq />
        </section>
      </Reveal>

      {/* Get started */}
      <Reveal>
        <section id="start" className="relative z-10 mx-auto max-w-6xl scroll-mt-10 px-6 pb-16 pt-4">
          <Card className="paper relative overflow-hidden p-8 sm:p-10">
            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div>
                <Eyebrow>Get started</Eyebrow>
                <h2 className="t-section mt-3">
                  Start getting paid privately.
                </h2>
                <p className="mt-2 max-w-md text-[14px] leading-6 text-[var(--muted)]">
                  No wallet needed to try. Create a demo invoice, watch it
                  settle, and mint your first proof.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="/dashboard" className={buttonClass("gold", "md")}>
                    Create an invoice
                  </Link>
                  <a href="#how" className={buttonClass("ghost", "md")}>
                    How it works
                  </a>
                </div>
              </div>
              <ol className="flex flex-col gap-3">
                {[
                  ["Invoice", "Amount, title, reference, checkout link."],
                  ["Paid", "Settled shielded, matched by memo."],
                  ["Proof", "One payment verified, nothing else shown."],
                ].map(([t, d]) => (
                  <li
                    key={t}
                    className="flex items-baseline gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-5 py-3.5"
                  >
                    <span className="ff-mono text-[11px] uppercase tracking-wider text-[var(--accent)]">
                      {t}
                    </span>
                    <span className="text-[13px] text-[var(--muted)]">{d}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </section>
      </Reveal>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-elev)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-6 text-[var(--muted)]">
              Private invoicing on Zcash. Get paid shielded, prove a single
              payment, reveal nothing else.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="eyebrow">Product</p>
            <ul className="mt-3 flex flex-col gap-2.5 text-[13px]">
              <li><a className="text-[var(--muted)] hover:text-[var(--text)]" href="#how">How it works</a></li>
              <li><a className="text-[var(--muted)] hover:text-[var(--text)]" href="#why">Why Zcash</a></li>
              <li><a className="text-[var(--muted)] hover:text-[var(--text)]" href="#faq">FAQ</a></li>
              <li><Link className="text-[var(--muted)] hover:text-[var(--text)]" href="/dashboard">Dashboard</Link></li>
            </ul>
          </nav>
          <nav aria-label="Resources">
            <p className="eyebrow">Resources</p>
            <ul className="mt-3 flex flex-col gap-2.5 text-[13px]">
              <li><a className="text-[var(--muted)] hover:text-[var(--text)]" href="https://zips.z.cash/zip-0321" target="_blank" rel="noopener noreferrer">ZIP 321 payment requests</a></li>
              <li><a className="text-[var(--muted)] hover:text-[var(--text)]" href="https://z.cash" target="_blank" rel="noopener noreferrer">Zcash</a></li>
              <li><a className="text-[var(--muted)] hover:text-[var(--text)]" href="https://thezecathon.com" target="_blank" rel="noopener noreferrer">ZECATHON</a></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-[var(--border)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-[12px] text-[var(--faint)] sm:flex-row sm:items-center sm:justify-between">
            <span>ZecPay &middot; built for ZECATHON 2026</span>
            <span className="ff-mono">Zcash testnet &middot; viewing-key only &middot; open source</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProofCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="rounded-3xl border border-[var(--border-strong)] bg-[var(--card)] p-6 shadow-[0_2px_6px_rgba(16,24,40,0.06),0_32px_64px_-32px_rgba(16,24,40,0.3)]">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Proof of payment</span>
          <span className="ff-mono inline-flex items-center gap-1.5 rounded-full bg-[var(--mint)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--mint)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)]" /> verified
          </span>
        </div>
        <div className="mt-6">
          <div className="text-[13px] text-[var(--faint)]">Amount</div>
          <div className="ff-mono mt-1 text-3xl font-semibold tracking-tight">
            0.5 <span className="text-[var(--gold)]">ZEC</span>
          </div>
        </div>
        <dl className="mt-6 space-y-3 text-[13px]">
          {[
            ["Invoice", "inv_7c3a…e92"],
            ["Transaction", "u1f4…a0b9"],
            ["Network", "testnet"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-t border-[var(--border)] pt-3">
              <dt className="text-[var(--muted)]">{k}</dt>
              <dd className="ff-mono text-[var(--text)]">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-[12px] leading-5 text-[var(--faint)]">
          This proof reveals only this payment. Balance, other income, and history
          stay private.
        </p>
      </div>
    </div>
  );
}
