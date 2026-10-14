"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  fadeStart: number;
  fadingOut: boolean;
};

/**
 * Light-mode adaptation of a 21st.dev particle hero. Fine ink specks rise and
 * fade over the hero while thin blueprint lines draw in on mount. Canvas only:
 * no assets, no external fonts, no fixed full-page takeover. Skips the loop
 * entirely under prefers-reduced-motion.
 */
export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const rect = host.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    };
    setSize();

    let particles: Particle[] = [];
    let raf = 0;

    const make = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() / 4 + 0.15,
      opacity: 0.65,
      fadeStart: Date.now() + Math.random() * 600 + 100,
      fadingOut: false,
    });

    const reset = (p: Particle) => {
      p.x = Math.random() * canvas.width;
      p.y = Math.random() * canvas.height;
      p.speed = Math.random() / 4 + 0.15;
      p.opacity = 0.65;
      p.fadeStart = Date.now() + Math.random() * 600 + 100;
      p.fadingOut = false;
    };

    const init = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 11000);
      for (let i = 0; i < count; i++) particles.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < 0) reset(p);
        if (!p.fadingOut && Date.now() > p.fadeStart) p.fadingOut = true;
        if (p.fadingOut) {
          p.opacity -= 0.008;
          if (p.opacity <= 0) reset(p);
        }
        ctx.fillStyle = `rgba(21, 23, 29, ${Math.max(0, p.opacity)})`;
        ctx.fillRect(p.x, p.y, 1, 1);
      }
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="hero-line-h" style={{ top: "24%", animationDelay: "150ms" }} />
      <div className="hero-line-h" style={{ top: "55%", animationDelay: "300ms" }} />
      <div className="hero-line-h" style={{ top: "86%", animationDelay: "450ms" }} />
      <div className="hero-line-v" style={{ left: "12%", animationDelay: "550ms" }} />
      <div className="hero-line-v" style={{ left: "50%", animationDelay: "650ms" }} />
      <div className="hero-line-v" style={{ left: "88%", animationDelay: "750ms" }} />
    </div>
  );
}
