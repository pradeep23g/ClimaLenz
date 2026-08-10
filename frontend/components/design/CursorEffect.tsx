"use client";

import { useEffect, useRef } from "react";


export default function CursorEffect() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let ringX = 0,
      ringY = 0,
      dotX = 0,
      dotY = 0,
      targetX = 0,
      targetY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(
        "a, button, [data-cursor-hover]"
      );
      ringRef.current?.classList.toggle("is-hovering", Boolean(el));
    };

    const tick = () => {
      // Dot tracks the pointer exactly; ring trails with easing —
      // matches JACOBI's two-layer follow behavior.
      dotX = targetX;
      dotY = targetY;
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="jx-cursor" aria-hidden="true" />
      <div ref={dotRef} className="jx-cursor-dot" aria-hidden="true" />
    </>
  );
}
