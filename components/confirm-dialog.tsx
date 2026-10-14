"use client";

import { useEffect, useRef } from "react";

import { buttonClass, Card } from "@/components/ui";

/**
 * Accessible confirmation dialog with zero dependencies. Used only for
 * destructive actions that deserve a pause (cancelling an invoice).
 * Escape closes, clicking the overlay closes, focus starts on Cancel.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <Card
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="t-card-title">{title}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onClose}
            className={buttonClass("ghost", "sm")}
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={buttonClass("gold", "sm")}
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </Card>
    </div>
  );
}
