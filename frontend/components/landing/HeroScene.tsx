"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";

declare global {
  interface Window {
    ClimaLenzGlobe: any;
  }
}

const TYPED_LINE = "3 deterministic engines. 6 spectral indices. 4 AI Agents.";

export default function HeroScene() {
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [typed, setTyped] = useState(reducedMotion ? TYPED_LINE : "");
  const [deployStatus, setDeployStatus] = useState<"initializing" | "active">("initializing");

  /* Typed text effect */
  useEffect(() => {
    if (reducedMotion) {
      setTyped(TYPED_LINE);
      return;
    }
    let i = 0;
    let alive = true;
    const start = setTimeout(function step() {
      if (!alive) return;
      setTyped(TYPED_LINE.slice(0, i));
      const ch = TYPED_LINE[i - 1];
      i++;
      if (i <= TYPED_LINE.length) {
        const delay = ch === "." ? 320 : 34 + Math.random() * 26;
        setTimeout(step, delay);
      }
    }, 600);
    return () => {
      alive = false;
      clearTimeout(start);
    };
  }, [reducedMotion]);

  /* Mount the 3D Globe */
  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined" || !window.ClimaLenzGlobe) {
      return;
    }
    
    const globe = window.ClimaLenzGlobe.init(canvasRef.current, {});
    
    setTimeout(() => {
      globe.deploy();
      setDeployStatus("active");
    }, 800);

  }, []);

  return (
    <header className="hero" id="hero">
      {/* ─── STRICT WRAPPER: No Tailwind Width Hacks ───────────── */}
      <div className="wrap">
        <div className="hero-grid">
          
          {/* ─── LEFT COLUMN ───────────── */}
          <div className="hero-copy">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="chip"
            >
              <span className="pulse" />
              <span>ClimaLenz · Honest AI Boundary</span>
            </motion.div>

            <motion.h1
              initial={reducedMotion ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="hero-h1"
            >
              Map climate risk with{" "}
              <span className="hero-accent">mathematical</span>
              <br /> certainty.
              <span aria-hidden className="hero-sub-rule" />
            </motion.h1>

            <motion.p
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="hero-typed"
            >
              {typed}
              <span className="caret">▌</span>
            </motion.p>

            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="hero-para sec"
            >
              ClimaLenz fuses physics-informed neural networks (PINNs) and multi-agent AI 
              to monitor heat and water risk simultaneously. Fully physically bounded. 
              Zero hallucination.
            </motion.p>

            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link href="/dashboard" className="btn btn-primary group">
                Launch Planner <ArrowRight className="w-4 h-4 arrow" />
              </Link>
              <a 
                href="/deck/ClimaLenz-Pitch-Deck.pdf" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-ghost"
              >
                <FileText className="w-4 h-4 mr-1" /> Pitch Deck
              </a>
            </motion.div>

            <motion.div
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="hero-proof muted label-mono"
            >
              Sentinel-2 driven <span className="sep">·</span> ISRO MOSDAC grounded <span className="sep">·</span> Agentic execution
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN ────────────── */}
          <div className="globe-stage">
            <canvas ref={canvasRef} className="globe-canvas" />

            {/* Native CSS HUD Corners */}
            <div className="globe-hud">
              <span className="hud-corner tl" />
              <span className="hud-corner tr" />
              <span className="hud-corner bl" />
              <span className="hud-corner br" />
            </div>

            {/* Native CSS Readout Overlay */}
            <div className="globe-readout">
              <div className="gr-row">
                <span 
                  className="gr-led" 
                  style={{ 
                    backgroundColor: deployStatus === "active" ? "var(--good)" : "var(--gold)",
                    boxShadow: deployStatus === "active" ? "0 0 10px var(--good)" : "0 0 10px var(--gold)"
                  }} 
                />
                <span id="gr-status">
                  {deployStatus === "initializing" ? "booting neural engines" : "co-location sensors active"}
                </span>
              </div>
              <div className="gr-row gr-count">
                <span id="gr-count">{deployStatus === "active" ? "07" : "00"}</span>
                <span className="gr-of">/ active AOIs</span>
              </div>
              <div className="gr-meta">HQ CHENNAI · ISRO TELEMETRY · SENTINEL MESH</div>
            </div>
          </div>

        </div>
      </div>

      {/* Native CSS Scroll Cue */}
      <div aria-hidden className="hero-scrollcue">
        <span className="label-mono" style={{ fontSize: "10px" }}>scroll</span>
        <span className="cue-line" />
      </div>
    </header>
  );
}