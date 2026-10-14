// lib/server/qr.ts
// Server-side QR generation for ZIP 321 payment requests. Rendered as SVG on
// our own server (no external QR service), so the payment URI, which encodes
// the amount and memo, never leaves the app. That keeps the privacy promise.

import QRCode from "qrcode";

export async function qrSvg(uri: string): Promise<string> {
  const svg = await QRCode.toString(uri, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0c", light: "#ffffff" },
  });
  // Let it fill its container: drop the intrinsic width/height, keep viewBox.
  return svg.replace(/<svg([^>]*?)>/, (_m, attrs: string) => {
    const cleaned = attrs.replace(/\s(?:width|height)="[^"]*"/g, "");
    return `<svg${cleaned} width="100%" height="100%">`;
  });
}
