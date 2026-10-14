import { Suspense } from "react";

import { CheckoutClient } from "./CheckoutClient";

// Next 16 Cache Components: awaiting the dynamic `params` must happen inside a
// Suspense boundary so the route shell can still prerender. The outer page
// stays synchronous and only passes the params Promise down.
export default function PayPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <PayPageInner params={params} />
    </Suspense>
  );
}

async function PayPageInner({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  return <CheckoutClient invoiceId={invoiceId} />;
}

function CheckoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-sm text-[var(--muted)]">
      Loading checkout...
    </div>
  );
}
