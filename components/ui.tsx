// components/ui.tsx
// Shared presentational primitives for the ZecPay design system. No hooks, no
// "use client", so they compose in both server and client components.

import type { ComponentProps } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";

const BUTTON_SIZES: Record<string, string> = {
  md: "h-11 px-6",
  sm: "h-9 px-4 text-[13px]",
  lg: "h-12 px-7 text-[15px]",
};

// "gold" is the primary action (Zcash gold, ink text for legible contrast).
const BUTTON_VARIANTS: Record<string, string> = {
  gold: "bg-[var(--accent)] text-white hover:bg-[var(--accent-bright)] shadow-[0_10px_30px_-12px_rgba(169,127,13,0.55)]",
  solid: "bg-[var(--text)] text-[var(--bg-elev)] hover:bg-black",
  ghost:
    "border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--card-hover)] hover:border-[var(--muted)]",
  mint: "bg-[var(--mint)] text-white hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(14,159,110,0.5)]",
  blue: "bg-[var(--blue)] text-white hover:brightness-110",
};

export function buttonClass(
  variant: keyof typeof BUTTON_VARIANTS = "gold",
  size: keyof typeof BUTTON_SIZES = "md",
  className = "",
): string {
  return cn(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className);
}

export function Button({
  variant = "gold",
  size = "md",
  className,
  ...props
}: {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
} & ComponentProps<"button">) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

/** A white surface with a hairline border and a soft, precise shadow. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(31,28,20,0.04),0_10px_28px_-20px_rgba(31,28,20,0.18)]",
        className,
      )}
      {...props}
    />
  );
}

/** A small uppercase mono eyebrow label. */
export function Eyebrow({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("eyebrow", className)} {...props} />;
}
