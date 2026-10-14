"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  ChevronsRight,
  FilePlus2,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { LogoMark } from "@/components/logo";
import { cn } from "@/components/ui";

type IconType = ComponentType<{ size?: number | string; className?: string }>;

interface NavEntry {
  id: string;
  label: string;
  href: string;
  icon: IconType;
  badge?: number;
  route?: boolean;
}

/**
 * Collapsible dashboard shell, adapted from a 21st.dev sidebar pattern to
 * ZecPay's own tokens and real navigation. Light-only (no theme toggle),
 * typed props, and every item goes somewhere real: page sections or '/'.
 */
export function DashboardShell({
  merchantName,
  network,
  pendingCount,
  children,
}: {
  merchantName: string | null;
  network: string;
  pendingCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("overview");

  // Icon rail on small screens, full sidebar on desktop.
  useEffect(() => {
    if (window.innerWidth < 768) setOpen(false);
  }, []);

  const nav: NavEntry[] = [
    { id: "overview", label: "Overview", href: "#top", icon: LayoutDashboard },
    { id: "new", label: "New invoice", href: "#new", icon: FilePlus2 },
    {
      id: "invoices",
      label: "Invoices",
      href: "#invoices",
      icon: ReceiptText,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: "proofs", label: "Proofs", href: "#proofs", icon: ShieldCheck },
    { id: "site", label: "Back to site", href: "/", icon: ArrowLeft, route: true },
  ];

  return (
    <div className="relative z-10 flex min-h-screen w-full bg-[var(--bg)] text-[var(--text)]">
      <nav
        aria-label="Dashboard"
        className={`sticky top-0 h-screen shrink-0 border-r border-[var(--border)] bg-[var(--card)] transition-all duration-300 ease-in-out ${
          open ? "w-60" : "w-16"
        } flex flex-col p-2`}
      >
        <div className="mb-6 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3 rounded-md p-2">
            <LogoMark size={36} />
            {open && (
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {merchantName ?? "ZecPay"}
                </span>
                <span className="ff-mono block text-[11px] uppercase tracking-wider text-[var(--faint)]">
                  {network}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {nav.map((item) =>
            item.route ? (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSelected(item.id)}
                className={cn(
                  "relative flex h-11 w-full items-center rounded-md transition-colors",
                  selected === item.id
                    ? "border-l-2 border-[var(--accent)] bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--text)]",
                )}
              >
                <span className="grid h-full w-12 shrink-0 place-content-center">
                  <item.icon size={16} />
                </span>
                {open && <span className="text-sm">{item.label}</span>}
              </Link>
            ) : (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setSelected(item.id)}
                className={cn(
                  "relative flex h-11 w-full items-center rounded-md transition-colors",
                  selected === item.id
                    ? "border-l-2 border-[var(--accent)] bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--text)]",
                )}
              >
                <span className="grid h-full w-12 shrink-0 place-content-center">
                  <item.icon size={16} />
                </span>
                {open && <span className="text-sm">{item.label}</span>}
                {item.badge !== undefined && open && (
                  <span className="absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-medium text-white">
                    {item.badge}
                  </span>
                )}
              </a>
            ),
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          className="border-t border-[var(--border)] transition-colors hover:bg-black/[0.03]"
        >
          <div className="flex items-center p-3">
            <span className="grid size-10 shrink-0 place-content-center">
              <ChevronsRight
                size={16}
                className={`text-[var(--faint)] transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </span>
            {open && (
              <span className="text-sm font-medium text-[var(--muted)]">Hide</span>
            )}
          </div>
        </button>
      </nav>

      <div className="min-w-0 flex-1 px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
