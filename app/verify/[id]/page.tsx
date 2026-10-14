import { Suspense } from "react";

import { VerifyClient } from "./VerifyClient";

// Next 16 Cache Components: awaiting `params` must happen inside a Suspense
// boundary so the route shell can still prerender.
export default function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyPageInner params={params} />
    </Suspense>
  );
}

async function VerifyPageInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VerifyClient id={id} />;
}

function VerifyFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-sm text-[var(--muted)]">
      Loading...
    </div>
  );
}
