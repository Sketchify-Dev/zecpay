// lib/zec/amount.ts
// Precise ZEC <-> zatoshi conversion. 1 ZEC = 100,000,000 zatoshi.
// All money arithmetic uses BigInt to avoid floating-point error.

export const ZATOSHIS_PER_ZEC = 100_000_000n;

// Zcash supply cap, in zatoshi (21,000,000 ZEC).
export const MAX_MONEY_ZAT = 21_000_000n * ZATOSHIS_PER_ZEC;

// A decimal ZEC amount: integer part, optional fraction of up to 8 digits.
const AMOUNT_RE = /^(\d+)(?:\.(\d{1,8}))?$/;

/**
 * Parse a decimal ZEC string (as used in a ZIP 321 `amount`) into zatoshi.
 * Accepts up to 8 fractional digits. Throws on malformed or out-of-range input.
 */
export function parseZecToZatoshi(zec: string): bigint {
  const s = zec.trim();
  const m = AMOUNT_RE.exec(s);
  if (!m) {
    throw new Error(`Invalid ZEC amount: ${JSON.stringify(zec)}`);
  }
  const whole = BigInt(m[1]);
  const fracDigits = m[2] ?? "";
  const fracPadded = (fracDigits + "00000000").slice(0, 8);
  const zat = whole * ZATOSHIS_PER_ZEC + BigInt(fracPadded);
  if (zat < 0n || zat > MAX_MONEY_ZAT) {
    throw new Error(`ZEC amount out of range: ${s}`);
  }
  return zat;
}

/**
 * Format zatoshi as a canonical decimal ZEC string: no trailing zeros, no
 * trailing dot, always at least one integer digit. Suitable for ZIP 321.
 */
export function formatZatoshiToZec(zat: bigint): string {
  if (zat < 0n) {
    throw new Error("zatoshi amount must be non-negative");
  }
  const whole = zat / ZATOSHIS_PER_ZEC;
  const frac = zat % ZATOSHIS_PER_ZEC;
  if (frac === 0n) {
    return whole.toString();
  }
  const fracStr = frac.toString().padStart(8, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fracStr}`;
}
