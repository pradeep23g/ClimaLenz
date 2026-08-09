"use client";

import { useEffect, useRef } from "react";

/* ─── ClimaLenz Telemetry Matrix ──────────────────────────────────────
   A dynamic, canvas-based sensor grid background.
   Dots react to cursor proximity (radar ping effect) and pulse slightly
   to simulate active data polling. Hardcoded to the ClimaLenz cobalt
   accent with dynamic alpha blending.
   ─────────────────────────────────────────────────────────────────── */

export default function DotMatrix({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth, h = window.innerHeight;
    c.width = w; c.height = h;

    const spacing = 32;
    const cols = Math.ceil(w / spacing) + 1;
    const rows = Math.ceil(h / spacing) + 1;
    const dots: { x: number; y: number }[] = [];
    
    // Hex-style offset grid
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = (r % 2) * (spacing / 2);
        dots.push({ x: col * spacing + offsetX, y: r * spacing });
      }
    }

    const onMouse = (e: MouseEvent) => { 
      mouseRef.current.x = e.clientX; 
      mouseRef.current.y = e.clientY; 
    };
    
    const onResize = () => { 
      w = window.innerWidth; 
      h = window.innerHeight; 
      c.width = w; 
      c.height = h; 
    };
    
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("resize", onResize);

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      for (const d of dots) {
        const dx = d.x - mx, dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 300;

        let alpha: number;
        if (dist < maxDist) {
          const t = 1 - dist / maxDist;
          // Spike alpha near cursor
          alpha = 0.03 + t * 0.15;
        } else {
          // Idle alpha
          alpha = 0.02;
        }

        // Fade out at extreme screen edges to avoid hard cutoffs
        const fade = Math.min(1, (d.x / w) * 1.5, ((w - d.x) / w) * 1.5, (d.y / h) * 1.5, ((h - d.y) / h) * 1.5);
        alpha *= Math.max(0.1, Math.min(1, fade));

        // Subdued orbital pulse 
        const pulse = 0.9 + 0.1 * Math.sin(frame * 0.02 + d.x * 0.01 + d.y * 0.01);
        const radius = (dist < maxDist ? 1.2 + (1 - dist / maxDist) * 1.2 : 0.8) * pulse;

        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        // ClimaLenz Cobalt Base (RGB: 61, 107, 255)
        ctx.fillStyle = `rgba(61, 107, 255, ${alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 pointer-events-none z-0 ${className}`} 
      aria-hidden="true"
    />
  );
}