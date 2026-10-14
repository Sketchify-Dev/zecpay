import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { buttonClass, cn } from "@/components/ui";

interface EmptyStateProps {
  title: string;
  description: string;
  icons?: LucideIcon[];
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable empty state, adapted from a 21st.dev pattern to ZecPay's own
 * tokens and button system (no shadcn dependency). Every instance explains
 * what is missing and offers a real next action.
 */
export function EmptyState({
  title,
  description,
  icons = [],
  action,
  className,
}: EmptyStateProps) {
  const trio = icons.length >= 3 ? icons.slice(0, 3) : null;
  const single = !trio ? icons[0] : null;
  return (
    <div
      className={cn(
        "group w-full rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--card)] p-10 text-center transition-colors hover:border-[var(--muted)]",
        className,
      )}
    >
      <div className="flex justify-center">
        {trio ? (
          <>
            <div className="relative left-2.5 top-1.5 grid size-12 -rotate-6 place-items-center rounded-xl bg-[var(--bg)] shadow ring-1 ring-[var(--border)] transition duration-500 group-hover:-translate-x-5 group-hover:-translate-y-0.5 group-hover:-rotate-12">
              {React.createElement(trio[0], {
                className: "h-6 w-6 text-[var(--faint)]",
              })}
            </div>
            <div className="relative z-10 grid size-12 place-items-center rounded-xl bg-[var(--bg)] shadow ring-1 ring-[var(--border)] transition duration-500 group-hover:-translate-y-0.5">
              {React.createElement(trio[1], {
                className: "h-6 w-6 text-[var(--faint)]",
              })}
            </div>
            <div className="relative right-2.5 top-1.5 grid size-12 rotate-6 place-items-center rounded-xl bg-[var(--bg)] shadow ring-1 ring-[var(--border)] transition duration-500 group-hover:translate-x-5 group-hover:-translate-y-0.5 group-hover:rotate-12">
              {React.createElement(trio[2], {
                className: "h-6 w-6 text-[var(--faint)]",
              })}
            </div>
          </>
        ) : (
          <div className="grid size-12 place-items-center rounded-xl bg-[var(--bg)] shadow ring-1 ring-[var(--border)] transition duration-500 group-hover:-translate-y-0.5">
            {single &&
              React.createElement(single, {
                className: "h-6 w-6 text-[var(--faint)]",
              })}
          </div>
        )}
      </div>
      <h2 className="mt-6 font-medium">{title}</h2>
      <p className="mt-1 whitespace-pre-line text-sm text-[var(--muted)]">
        {description}
      </p>
      {action && (
        <button onClick={action.onClick} className={buttonClass("ghost", "sm", "mt-4")}>
          {action.label}
        </button>
      )}
    </div>
  );
}
