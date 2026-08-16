"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Flame, ShieldAlert, CheckCircle, Orbit } from "lucide-react";

export default function HeatEngineSection() {
  // ============================================================================
  // STATE: TOGGLE BETWEEN STANDARD AI AND PINN
  // ============================================================================
  const [isPinnActive, setIsPinnActive] = useState(true);

  // Unique id prefix so multiple instances of this section never collide on SVG filter/gradient ids
  const uid = useId().replace(/:/g, "");

  // ============================================================================
  // SVG GRAPH DATA & PATHS  (viewBox="0 0 500 300")
  // ============================================================================
  const thresholdY = 100; // physical ceiling

  // Standard AI: overfits noise, spikes past the physical ceiling
  const pathHallucination = `
    M 50,250
    C 100,250 150,200 200,180
    C 250,160 280,40 320,30
    C 360,20 400,150 450,140
  `;

  // PINN: same data, but the physics penalty clamps it to the ceiling
  const pathPinn = `
    M 50,250
    C 100,250 150,200 200,180
    C 250,160 260,110 320,110
    C 380,110 400,150 450,140
  `;

  // Closed fill variants (same curve, dropped to the floor) for the gradient wash under the line
  const fillHallucination = `${pathHallucination} L 450,260 L 50,260 Z`;
  const fillPinn = `${pathPinn} L 450,260 L 50,260 Z`;

  const endpoint = isPinnActive ? { x: 450, y: 140 } : { x: 450, y: 140 };

  // ============================================================================
  // ANIMATION VARIANTS
  // ============================================================================
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.3 },
    },
  };

  const fillVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.9, delay: 0.4 } },
  };

  const overlayVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
  };

  const accent = isPinnActive ? "var(--good)" : "var(--over)";

  return (
    <motion.section
      className="he-wrapper"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.8 }}
      style={{ "--he-accent": accent } as React.CSSProperties}
    >
      {/* Ambient field that washes the whole section toward the active state's color */}
      <div className={`he-field ${isPinnActive ? "safe" : "danger"}`} aria-hidden="true" />

      {/* ─── PART 1: SECTION HEADER ─── */}
      <div className="w-full text-center mb-24">
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "var(--text-3)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Validating the boundary
        </div>
        <h2
          style={{
            fontFamily: "var(--sans)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Layer 02 :{" "}
          <em
            style={{
              fontFamily: "var(--serif)",
              color: "var(--cobalt-bright)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            Heat Engine.
          </em>
        </h2>
      </div>

      {/* ─── PART 2: SPLIT LAYOUT ─── */}
      <div className="he-layout">
        {/* LEFT COLUMN: THE NARRATIVE */}
        <div className="he-left">
          <div className="flex items-center gap-3 mb-6">
            <span
              className="w-2 h-2 rounded-full bg-[var(--over)]"
              style={{ boxShadow: "0 0 10px rgba(194,59,43,0.5)" }}
            />
            <h3
              style={{
                fontFamily: "var(--mono)",
                fontSize: "12px",
                letterSpacing: "0.1em",
                color: "var(--over)",
                textTransform: "uppercase",
              }}
            >
              Physics-Informed Neural Network
            </h3>
          </div>

          <h4
            style={{
              fontFamily: "var(--sans)",
              fontSize: "clamp(28px, 3vw, 36px)",
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "20px",
            }}
          >
            The Mathematical Cage.
          </h4>

          <p
            style={{
              color: "var(--text-2)",
              fontSize: "16px",
              lineHeight: 1.7,
              maxWidth: "480px",
              marginBottom: "24px",
            }}
          >
            Standard AI models fail at ecological forecasting because they
            don't understand the physical world. If given noisy sensor data,
            a standard black-box model will happily hallucinate impossible
            temperature spikes that violate the laws of thermodynamics.
          </p>
          <p
            style={{
              color: "var(--text-2)",
              fontSize: "16px",
              lineHeight: 1.7,
              maxWidth: "480px",
              marginBottom: "40px",
            }}
          >
            The ClimaLenz Heat Engine is built on a{" "}
            <strong style={{ color: "var(--text)" }}>PyTorch PINN</strong>. We
            actively penalize the neural network during training if its
            outputs violate thermal conservation laws. It is supervised
            learning trapped inside a mathematical cage.
          </p>

          {/* Engine Specs Grid */}
          <div className="he-specs">
            <div className="he-spec">
              <div className="he-spec-label-row" style={{ color: "var(--text)" }}>
                <Flame className="w-4 h-4 text-[var(--over)]" />
                <span className="he-spec-value">L_Data</span>
              </div>
              <div className="he-spec-caption">Standard MSE Loss</div>
            </div>

            <div className="he-spec">
              <div className="he-spec-label-row" style={{ color: "var(--good)" }}>
                <Orbit className="w-4 h-4 text-[var(--good)]" />
                <span className="he-spec-value">λ·L_Phys</span>
              </div>
              <div className="he-spec-caption">Physics Penalty Term</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE INTERACTIVE HUD */}
        <div className="he-right">
          <div className="he-hud">
            {/* corner instrument brackets */}
            <span className="he-bracket tl" aria-hidden="true" />
            <span className="he-bracket tr" aria-hidden="true" />
            <span className="he-bracket bl" aria-hidden="true" />
            <span className="he-bracket br" aria-hidden="true" />

            {/* The Toggle Buttons */}
            <div className="he-toggle-container">
              <motion.div
                className={`he-toggle-thumb ${isPinnActive ? "safe" : "danger"}`}
                layout
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                style={{
                  left: isPinnActive ? "50%" : "4px",
                }}
              />
              <button
                onClick={() => setIsPinnActive(false)}
                className={`he-toggle-btn danger ${!isPinnActive ? "active" : ""}`}
              >
                <ShieldAlert className="w-4 h-4" /> Standard Black-Box AI
              </button>
              <button
                onClick={() => setIsPinnActive(true)}
                className={`he-toggle-btn safe ${isPinnActive ? "active" : ""}`}
              >
                <CheckCircle className="w-4 h-4" /> Physics-Informed (PINN)
              </button>
            </div>

            {/* The SVG Graph HUD */}
            <div className={`he-graph ${!isPinnActive ? "he-warning-flash" : ""}`}>
              {/* Grid Lines Overlay */}
              <div className="he-grid" />
              {/* Fine scanline / grain texture, ties the panel back into the page bg */}
              <div className="he-scanlines" />
              <div className="he-vignette" />

              {/* Dynamic Overlay Text */}
              <AnimatePresence mode="wait">
                {!isPinnActive ? (
                  <motion.div
                    key="warning"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="he-status-pill danger"
                  >
                    <span className="he-status-dot" />
                    Error: Thermodynamic Limit Exceeded
                  </motion.div>
                ) : (
                  <motion.div
                    key="safe"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="he-status-pill safe"
                  >
                    <span className="he-status-dot" />
                    Constraint Active: Navigating via PDE
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The SVG Canvas */}
              <svg
                viewBox="0 0 500 300"
                className="w-full h-full relative z-10"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id={`glowRed-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id={`glowGreen-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  <linearGradient id={`fillRed-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--over)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--over)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id={`fillGreen-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--good)" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="var(--good)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Axes */}
                <line x1="40" y1="260" x2="460" y2="260" stroke="var(--line-2)" strokeWidth="2" />
                <line x1="40" y1="260" x2="40" y2="40" stroke="var(--line-2)" strokeWidth="2" />

                {/* Labels */}
                <text
                  x="250"
                  y="285"
                  fill="var(--text-4)"
                  fontSize="10"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  letterSpacing="0.1em"
                >
                  TIME (HOURS)
                </text>
                <text
                  x="15"
                  y="150"
                  fill="var(--text-4)"
                  fontSize="10"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  transform="rotate(-90 15,150)"
                  letterSpacing="0.1em"
                >
                  HEAT FLUX (°C)
                </text>

                {/* Physics Constraint Ceiling — marching-ants dash animates continuously */}
                <g opacity={isPinnActive ? 1 : 0.35}>
                  <motion.line
                    x1="40"
                    y1={thresholdY}
                    x2="460"
                    y2={thresholdY}
                    stroke="var(--cobalt-bright)"
                    strokeWidth="1.25"
                    strokeDasharray="6 4"
                    animate={{ strokeDashoffset: [0, -20] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                  <rect
                    x="50"
                    y={thresholdY - 20}
                    width="160"
                    height="16"
                    fill="var(--surface-2)"
                    rx="4"
                  />
                  <text
                    x="56"
                    y={thresholdY - 9}
                    fill="var(--cobalt-bright)"
                    fontSize="9"
                    fontFamily="var(--mono)"
                    letterSpacing="0.05em"
                  >
                    MAX THERMAL BOUNDARY
                  </text>
                </g>

                {/* Data Paths — gradient fill wash + glowing stroke */}
                <AnimatePresence mode="wait">
                  {!isPinnActive ? (
                    <g key="group-hallucination">
                      <motion.path
                        d={fillHallucination}
                        fill={`url(#fillRed-${uid})`}
                        stroke="none"
                        variants={fillVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      />
                      <motion.path
                        d={pathHallucination}
                        fill="none"
                        stroke="var(--over)"
                        strokeWidth="3"
                        filter={`url(#glowRed-${uid})`}
                        variants={pathVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      />
                    </g>
                  ) : (
                    <g key="group-pinn">
                      <motion.path
                        d={fillPinn}
                        fill={`url(#fillGreen-${uid})`}
                        stroke="none"
                        variants={fillVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      />
                      <motion.path
                        d={pathPinn}
                        fill="none"
                        stroke="var(--good)"
                        strokeWidth="3"
                        filter={`url(#glowGreen-${uid})`}
                        variants={pathVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      />
                    </g>
                  )}
                </AnimatePresence>

                {/* Data Points / Nodes */}
                <circle cx="50" cy="250" r="4" fill="var(--text)" />

                {/* Endpoint node with a soft breathing halo tied to the active accent */}
                <motion.circle
                  cx={endpoint.x}
                  cy={endpoint.y}
                  r="10"
                  fill="none"
                  stroke={accent}
                  strokeWidth="1"
                  animate={{ r: [8, 14, 8], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <circle cx={endpoint.x} cy={endpoint.y} r="4" fill={accent} />
              </svg>
            </div>

            {/* Terminal Output */}
            <div className="he-terminal">
              <div className="he-terminal-bar">
                <span className="he-terminal-dot" />
                <span className="he-terminal-dot" />
                <span className="he-terminal-dot" />
                <span className="he-terminal-title">loss.trace</span>
              </div>
              <div className="he-terminal-body">
                <span style={{ color: "var(--cobalt-bright)" }}>&gt;</span>{" "}
                System.computeLoss(prediction, target)
                <br />
                {!isPinnActive ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span style={{ color: "var(--text-4)" }}>Computing MSE...</span>
                    <br />
                    <span style={{ color: "var(--over)" }}>
                      [WARNING] Model converging on unphysical minima.
                    </span>
                    <br />
                    Loss = L_Data
                    <br />
                    Result = Hallucination detected.
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span style={{ color: "var(--text-4)" }}>
                      Injecting Physics Constraints...
                    </span>
                    <br />
                    <span style={{ color: "var(--good)" }}>
                      [OK] Navier-Stokes penalty applied.
                    </span>
                    <br />
                    Loss = L_Data <span style={{ color: "var(--good)" }}>+ λ * L_Phys</span>
                    <br />
                    Result = Deterministic mapping secured.
                  </motion.div>
                )}
              </div>
            </div>

            {/* Link to Methodology */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <Link href="/methodology" className="cs-link">
                View PINN Architecture
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}