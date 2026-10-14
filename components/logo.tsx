// components/logo.tsx
// ZecPay brand lockup: the custom Z tile artwork plus a Fraunces wordmark.
// Tile art lives in public/zecpay-tile.svg; the favicon uses the same art.

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/zecpay-tile.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className="shrink-0 rounded-md"
      style={{ width: size, height: size }}
    />
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="ff-display text-[19px] font-semibold tracking-tight">
        ZecPay
      </span>
    </span>
  );
}
