import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { DemoBadge } from "@/components/DemoBadge";
import { ZcashStatusIndicator } from "@/components/ZcashStatusIndicator";

const sans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ZecPay, private invoicing on Zcash",
  description:
    "Get paid in shielded ZEC and prove any single payment, without revealing your rates or your other income.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} antialiased`}
    >
      <body>
        {children}
        <DemoBadge />
        <ZcashStatusIndicator />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-elev)",
              color: "var(--text)",
              border: "1px solid var(--border-strong)",
            },
          }}
        />
      </body>
    </html>
  );
}
