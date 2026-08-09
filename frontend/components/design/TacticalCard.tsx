"use client";

import React, { useRef, useState } from "react";
import { LucideIcon } from "lucide-react";

interface TacticalCardProps {
  number: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  color?: "cobalt" | "over" | "good" | "gold";
  statusCode?: string;
}

const ACCENT_COLORS = {
  good: {
    text: "var(--good)",
    bgGlow: "rgba(52, 211, 155, 0.08)",
    borderGlow: "rgba(52, 211, 155, 0.35)",
    iconBg: "rgba(52, 211, 155, 0.1)",
  },
  cobalt: {
    text: "var(--cobalt-bright)",
    bgGlow: "var(--cobalt-soft)",
    borderGlow: "var(--cobalt-line)",
    iconBg: "rgba(61, 107, 255, 0.1)",
  },
  gold: {
    text: "var(--gold)",
    bgGlow: "rgba(216, 176, 106, 0.08)",
    borderGlow: "rgba(216, 176, 106, 0.35)",
    iconBg: "rgba(216, 176, 106, 0.1)",
  },
  over: {
    text: "var(--over)",
    bgGlow: "var(--over-soft)",
    borderGlow: "var(--over-line)",
    iconBg: "rgba(255, 84, 104, 0.1)",
  },
};

export default function TacticalCard({
  number,
  title,
  desc,
  icon: Icon,
  color = "cobalt",
  statusCode = "SYS_PROBE_OK",
}: TacticalCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
  };

  const currentAccent = ACCENT_COLORS[color];

  // Static micro-telemetry offsets for cybernetic effect
  const lat = (Math.sin(parseInt(number)) * 90).toFixed(4);
  const lng = (Math.cos(parseInt(number)) * 180).toFixed(4);
  const ping = 15 + (parseInt(number) * 11) % 65;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className="card card-hairtop relative group w-full overflow-hidden transition-all duration-300"
      style={{
        // Set dynamic local coordinates as CSS properties
        "--mouse-x": `${coords.x}px`,
        "--mouse-y": `${coords.y}px`,
      } as React.CSSProperties}
    >
      {/* Cybernetic Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          opacity: 0.2,
          backgroundImage: "radial-gradient(circle, var(--line-2) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))"
        }} 
      />

      {/* Hover Light Reflection Layer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(280px circle at var(--mouse-x) var(--mouse-y), ${currentAccent.bgGlow}, transparent 80%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(120px circle at var(--mouse-x) var(--mouse-y), ${currentAccent.borderGlow}, transparent 90%)`,
          padding: "1px",
          maskImage: "linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)",
          WebkitMaskImage: "linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)",
          maskComposite: "exclude",
          WebkitMaskComposite: "destination-out",
        }}
      />

      {/* Card Content Wrapper */}
      <div className="relative p-6 z-10 flex flex-col justify-between h-full min-h-[220px]">
        {/* Top telemetry bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2">
            <span 
              className="w-1.5 h-1.5 rounded-full animate-pulse" 
              style={{ backgroundColor: currentAccent.text, boxShadow: `0 0 8px ${currentAccent.bgGlow}` }} 
            />
            <span 
              className="text-[9px] tracking-wider uppercase"
              style={{ fontFamily: "var(--mono)", color: "var(--text-3)" }}
            >
              {statusCode}
            </span>
          </div>
          <span 
            className="text-[10px] tracking-widest"
            style={{ fontFamily: "var(--mono)", color: "var(--text-3)" }}
          >
            #{number}
          </span>
        </div>

        {/* Main Content Row */}
        <div className="flex items-start gap-4 mb-4">
          <div 
            className="shrink-0 w-11 h-11 rounded flex items-center justify-center border"
            style={{ borderColor: "var(--line)", backgroundColor: currentAccent.iconBg }}
          >
            <Icon className="w-5 h-5" style={{ color: currentAccent.text }} />
          </div>
          <div>
            <h3 
              className="text-base font-semibold mb-1.5 tracking-wide"
              style={{ color: "var(--text)" }}
            >
              {title}
            </h3>
            <p 
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-2)" }}
            >
              {desc}
            </p>
          </div>
        </div>

        {/* Bottom telemetry indicators */}
        <div 
          className="flex items-center justify-between border-t pt-3 mt-auto text-[8px] uppercase"
          style={{ borderColor: "var(--line)", fontFamily: "var(--mono)", color: "var(--text-3)" }}
        >
          <span className="transition-colors hover:text-opacity-80" style={{ color: "var(--text-3)" }}>
            COORD: [{lat}, {lng}]
          </span>
          <span className="transition-colors hover:text-opacity-80" style={{ color: "var(--text-3)" }}>
            RTT: {ping}ms | LOSS: 0%
          </span>
        </div>
      </div>
    </div>
  );
}