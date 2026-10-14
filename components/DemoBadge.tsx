// components/DemoBadge.tsx
// Honest, always-visible label: payments run in simulated mode by default.

export function DemoBadge() {
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50">
      <span className="ff-mono pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/90 px-3 py-1.5 text-[11px] text-[var(--muted)] shadow-[0_4px_16px_-8px_rgba(16,24,40,0.3)] backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
        demo mode <span className="text-[var(--faint)]">&middot; simulated payments</span>
      </span>
    </div>
  );
}
