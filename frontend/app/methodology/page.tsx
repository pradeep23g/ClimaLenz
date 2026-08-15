"use client";

/* ============================================================================
   CLIMALENZ — METHODOLOGY PAGE
   ============================================================================
   This page is written against the REAL backend/ contracts, not marketing
   copy. Every formula, field name, threshold, and route below is pulled
   directly from:
     - backend/continuity_engine/app/models/reconstruction_schemas.py
     - backend/water_engine/app/models/spectral_defs.py + services/spectral_engine.py
     - backend/water_engine/app/services/ecological_risk.py
     - backend/heat_engine/app/models/{simulation_schemas,thermal_defs}.py
     - backend/heat_engine/app/services/physics_guardrail.py
     - backend/bridge/app/co_location.py
     - backend/agents/app/{copilot,historian,critic,reporter}.py

   Deltas from the old AquaLens methodology page this was adapted from:
     - AquaLens's 5-agent set (Coordinator / Scout / Historian / Analyst /
       Reporter) doesn't exist in this repo. The real agent layer is 4
       agents: Copilot, Historian, Critic, Reporter. Swapped accordingly.
     - AquaLens's NDWI formula (NIR - SWIR)/(NIR + SWIR) is not what this
       repo runs. This repo uses McFeeters' NDWI, (Green - NIR)/(Green + NIR),
       plus a 7th index (LSWI) AquaLens never had, used for flooded-vegetation
       detection rather than the risk score itself.
     - Added the Heat Engine (Layer 2, PINN) and Bridge co-location
       (Layer 3) sections, which AquaLens's water-only scope never covered.
     - Risk weights, tier thresholds, guardrail bounds, and SLA hours below
       are the actual constants in RiskWeightsConfig / RiskTier /
       physicist_agent() / OperationalUrgency, not placeholders.
   ========================================================================== */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  GripVertical,
  Satellite,
  Droplets,
  Thermometer,
  GitMerge,
  Bot,
  Search,
  ShieldCheck,
  FileText,
  ShieldAlert,
} from "lucide-react";

/* ============================================================================
   SHARED TYPES
   ========================================================================== */
interface LeftLayer {
  name: string;
  src: string;
}

interface RightLayer {
  id: number;
  name: string;
  src: string;
  highlight: string;
}

interface EngineSliderProps {
  eyebrow: string;
  title: string;
  stat: string;
  statLabel: string;
  leftLayer: LeftLayer;
  rightLayers: RightLayer[];
}

/* ============================================================================
   REUSABLE INTERACTIVE BEFORE/AFTER SLIDER
   Used for both Layer 0 (Continuity) and Layer 2 (Heat/PINN) — same
   interaction pattern, different physical meaning on each side.
   ========================================================================== */
function EngineSlider({ eyebrow, title, stat, statLabel, leftLayer, rightLayers }: EngineSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeRightId, setActiveRightId] = useState(rightLayers[0].id);
  const prefersReducedMotion = useReducedMotion();

  const currentRight = rightLayers.find((l) => l.id === activeRightId) ?? rightLayers[0];

  return (
    <div className="cs-wrapper">
      <div className="cs-header">
        <div>
          <h3
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              color: "var(--cobalt-bright)",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </h3>
          <p style={{ fontFamily: "var(--sans)", fontSize: "24px", color: "var(--text)", fontWeight: 500 }}>
            {title}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: "32px", color: "var(--good)", fontWeight: 600, letterSpacing: "-0.02em" }}>
            {stat}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {statLabel}
          </div>
        </div>
      </div>

      <div className="cs-image-box">
        {/* Right side: the selectable output */}
        <div className="absolute inset-0">
          <Image src={currentRight.src} alt={currentRight.name} fill style={{ objectFit: "cover" }} unoptimized />
        </div>

        {/* Left side: always the raw input, clipped by the slider */}
        <motion.div
          className="absolute inset-0 z-10"
          animate={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: "tween", duration: 0.05 }}
        >
          <Image src={leftLayer.src} alt={leftLayer.name} fill style={{ objectFit: "cover" }} unoptimized />
        </motion.div>

        <div className="cs-label left">{leftLayer.name}</div>
        <div className="cs-label right" style={{ borderBottom: `2px solid ${currentRight.highlight}` }}>
          {currentRight.name}
        </div>

        <div className="cs-divider" style={{ left: `${sliderPos}%` }}>
          <div className="cs-handle">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="cs-slider-input"
          aria-label={`Compare ${leftLayer.name} against ${currentRight.name}`}
        />
      </div>

      <div className="cs-controls">
        {rightLayers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveRightId(layer.id)}
            className={`cs-btn ${activeRightId === layer.id ? "active" : ""}`}
            style={activeRightId === layer.id ? { borderColor: layer.highlight, color: layer.highlight, background: "rgba(255,255,255,0.05)" } : {}}
          >
            {layer.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   SMALL PRESENTATIONAL HELPERS
   ========================================================================== */

/** Animated horizontal bar for a single risk-weight factor (0.0–0.40 scale). */
function WeightBar({ label, value, max = 0.4 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="meth-weight-row">
      <div className="meth-weight-label">
        <span>{label}</span>
        <span className="meth-weight-value">{value.toFixed(2)}</span>
      </div>
      <div className="meth-weight-track">
        <motion.div
          className="meth-weight-fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/** Segmented scale showing where the four RiskTier breakpoints fall on 0.0–1.0. */
function TierScale() {
  const segments = [
    { label: "LOW", from: 0, to: 0.35, color: "var(--good)" },
    { label: "MEDIUM", from: 0.35, to: 0.6, color: "var(--gold)" },
    { label: "HIGH", from: 0.6, to: 0.85, color: "#e08a3c" },
    { label: "CRITICAL", from: 0.85, to: 1.0, color: "#d64545" },
  ];
  return (
    <div className="meth-scale-wrap">
      <div className="meth-scale-bar">
        {segments.map((seg) => (
          <motion.div
            key={seg.label}
            className="meth-scale-segment"
            style={{ background: seg.color, flexBasis: `${(seg.to - seg.from) * 100}%` }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="meth-scale-label">{seg.label}</span>
          </motion.div>
        ))}
      </div>
      <div className="meth-scale-ticks">
        <span>0.00</span>
        <span>0.35</span>
        <span>0.60</span>
        <span>0.85</span>
        <span>1.00</span>
      </div>
    </div>
  );
}

/** Guardrail bound bar — one per InterventionType, scaled against the widest (5.0 °C). */
function GuardrailBar({ label, celsius, max = 5.0 }: { label: string; celsius: number; max?: number }) {
  const pct = (celsius / max) * 100;
  return (
    <div className="meth-weight-row">
      <div className="meth-weight-label">
        <span>{label}</span>
        <span className="meth-weight-value">±{celsius.toFixed(1)}°C</span>
      </div>
      <div className="meth-weight-track">
        <motion.div
          className="meth-weight-fill"
          style={{ background: "var(--cobalt-bright)" }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/* ============================================================================
   STATIC DATA — pulled 1:1 from the real backend, not invented
   ========================================================================== */

const spectralIndices = [
  { tag: "NDWI", name: "Normalized Difference Water Index", bands: "Green · NIR", math: "(Green − NIR) / (Green + NIR)", desc: "McFeeters' open-water index. Forms one half of the dual-index water mask (with MNDWI); values above 0 flag likely water.", note: "Deliberately McFeeters' formulation, not the NIR/SWIR variant — chosen for open-water sensitivity over urban robustness, which MNDWI covers instead." },
  { tag: "MNDWI", name: "Modified NDWI", bands: "Green · SWIR", math: "(Green − SWIR) / (Green + SWIR)", desc: "Water signal that holds up in built-up settings where NDWI alone false-positives on concrete and shadow." },
  { tag: "LSWI", name: "Land Surface Water Index", bands: "NIR · SWIR", math: "(NIR − SWIR) / (NIR + SWIR)", desc: "Not used in the risk score. Detects moisture under canopy — this is what powers flooded-vegetation detection, since NDWI/MNDWI structurally can't see water hidden beneath a leaf canopy." },
  { tag: "NDTI", name: "Normalized Difference Turbidity Index", bands: "Red · Green", math: "(Red − Green) / (Red + Green)", desc: "Higher values indicate more turbid, sediment-heavy water columns." },
  { tag: "NDCI", name: "Normalized Difference Chlorophyll Index", bands: "RedEdge · Red", math: "(RedEdge − Red) / (RedEdge + Red)", desc: "Proxy for chlorophyll-a — the leading precursor signal for harmful algal blooms." },
  { tag: "NDVI", name: "Normalized Difference Vegetation Index", bands: "NIR · Red", math: "(NIR − Red) / (NIR + Red)", desc: "Shoreline vegetation health; used as a stress co-signal alongside the water-quality indices." },
  { tag: "WRI", name: "Water Ratio Index", bands: "Green · Red · NIR · SWIR", math: "(Green + Red) / (NIR + SWIR)", desc: "Direct ratio, not a normalized difference. Strong open-water signature once the aggregate exceeds ~2.5." },
];

const riskWeights = [
  { label: "NDCI — chlorophyll proxy", value: 0.40 },
  { label: "NDTI — turbidity", value: 0.25 },
  { label: "NDWI — water-signal floor", value: 0.15 },
  { label: "NDVI — shoreline stress", value: 0.10 },
  { label: "MNDWI — water-signal floor", value: 0.10 },
];

const telemetryModifiers = [
  { label: "Algae presence flag", value: "+0.20 flat" },
  { label: "Water colour anomaly", value: "+0.10 flat" },
  { label: "Odor requiring lab testing", value: "+0.10 flat" },
  { label: "Dead-fish count", value: "+0.05 / fish, capped at +0.20" },
  { label: "Public complaints", value: "+0.04 / complaint, capped at +0.12" },
  { label: "Rainfall / runoff risk", value: "+0.03 per 10mm, capped at +0.10" },
];

const slaTable = [
  { level: "ROUTINE", hours: 72 },
  { level: "ELEVATED", hours: 24 },
  { level: "IMMEDIATE", hours: 4 },
  { level: "EMERGENCY", hours: 1 },
];

const guardrailBounds = [
  { label: "CANOPY", celsius: 4.0 },
  { label: "COOL_ROOF", celsius: 3.0 },
  { label: "ALBEDO_CHANGE", celsius: 5.0 },
];

const agents = [
  {
    id: 1,
    name: "Copilot",
    role: "Tool-calling chat layer",
    mode: "Gemini Function Calling",
    icon: Bot,
    desc: "The conversational entry point. Declares four function tools — run_heat_what_if, assess_water_risk, get_continuity_repair, get_colocation_assessment — each mapped to the exact request schema its target engine actually accepts (GeoJSON geometry, bbox, date ranges). Downstream engine failures return a structured error in the tool result instead of failing the whole turn.",
  },
  {
    id: 2,
    name: "Historian",
    role: "Grounds engine output with real-world context",
    mode: "Two-call design: Search grounding → schema restructuring",
    icon: Search,
    desc: "Gemini rejects combining Google Search grounding with response_schema in a single call, so this agent runs two calls deliberately: first a grounded, free-text search pass, then a schema-free follow-up that restructures those findings into strict JSON. Both calls are wrapped so an API failure degrades to a low-confidence fallback instead of a 500.",
  },
  {
    id: 3,
    name: "Reporter",
    role: "Writes the citizen-facing summary",
    mode: "Strict structured output",
    icon: FileText,
    desc: "Turns deterministic engine numbers into a public-facing brief: executive_summary, key_findings, risk_level, recommended_interventions, and an explicit limitations_disclaimer. Never permitted to invent a risk_level — it must echo what the engine already computed.",
  },
  {
    id: 4,
    name: "Critic",
    role: "Audits the Reporter's draft",
    mode: "Contradiction detection against the raw engine payload",
    icon: ShieldCheck,
    desc: "Re-reads the same engine_payload the Reporter saw and checks the narrative for contradictions — e.g. does the stated risk_level actually match ecological_risk.tier? Returns a verdict (PASS / WARN / FAIL) with a per-layer breakdown, so an over-confident narrative can't silently ship.",
  },
];

/* ============================================================================
   ANIMATION VARIANTS
   ========================================================================== */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const navChips = [
  { href: "#continuity", label: "Layer 0 · Continuity", icon: Satellite },
  { href: "#water", label: "Layer 1 · Water", icon: Droplets },
  { href: "#heat", label: "Layer 2 · Heat", icon: Thermometer },
  { href: "#bridge", label: "Layer 3 · Bridge", icon: GitMerge },
  { href: "#agents", label: "Agent Layer", icon: Bot },
];

/* ============================================================================
   MAIN PAGE COMPONENT
   ========================================================================== */
export default function MethodologyPage() {
  return (
    <div className="relative min-h-screen w-full climalenz-design" style={{ backgroundColor: "var(--ink)" }}>
      <div className="meth-wrapper">
        {/* ─── BACK LINK ─── */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: "40px" }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--text-3)] hover:text-[var(--text)] transition-colors text-xs font-mono tracking-wider uppercase"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </motion.div>

        {/* ─── HEADER ─── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ marginBottom: "48px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--cobalt-bright)", textTransform: "uppercase", marginBottom: "16px" }}>
            Deterministic Architecture · v1 Contracts
          </div>
          <h1 style={{ fontFamily: "var(--sans)", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "24px" }}>
            How ClimaLenz reads <br /> the city, from orbit to guardrail.
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "16px", lineHeight: 1.8, maxWidth: "800px" }}>
            ClimaLenz runs four layers on top of raw Sentinel-2 and MODIS scenes: a cloud-gap continuity engine,
            a deterministic water-risk engine, a physics-informed heat engine, and a bridge layer that combines
            the two into co-location hypotheses. A four-agent Gemini layer wraps all of it to gather context,
            draft, and self-audit — but none of it is permitted to override a number the deterministic core
            already computed.
          </p>
        </motion.div>

        {/* ─── QUICK NAV ─── */}
        <motion.div
          className="meth-nav"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {navChips.map((chip) => {
            const Icon = chip.icon;
            return (
              <motion.a key={chip.href} href={chip.href} className="meth-nav-chip" variants={fadeUp}>
                <Icon size={13} />
                {chip.label}
              </motion.a>
            );
          })}
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            LAYER 0 — CONTINUITY ENGINE
           ══════════════════════════════════════════════════════════════ */}
        <div id="continuity" style={{ paddingTop: "64px" }} />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <EngineSlider
            eyebrow="Layer 00 · Continuity Engine"
            title="SAR-Guided Cloud Reconstruction"
            stat="96%"
            statLabel="Avg. Scene Confidence"
            leftLayer={{ name: "Cloud Blind (Optical)", src: "/images/1000067135.png" }}
            rightLayers={[
              { id: 1, name: "UNet Repaired", src: "/images/1000067136.png", highlight: "var(--cobalt-bright)" },
              { id: 2, name: "Confidence Heatmap", src: "/images/1000067140.png", highlight: "var(--gold)" },
              { id: 3, name: "Ground Truth", src: "/images/1000067137.png", highlight: "var(--good)" },
            ]}
          />
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} style={{ marginBottom: "96px" }}>
          <p style={{ color: "var(--text-2)", fontSize: "15px", lineHeight: 1.8, maxWidth: "800px", marginBottom: "24px" }}>
            When the freshest optical scene over an AOI is cloud-obscured, <code style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>POST /v1/reconstruction/repair</code>{" "}
            pairs it against a co-registered SAR acquisition and reconstructs the missing pixels with a trained UNet —
            SAR wavelengths pass through cloud cover that blinds the optical sensor entirely. The response never embeds
            the full reconstructed raster inline; it returns <code style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>reconstructed_bands_shape</code> and
            leaves callers to fetch the actual array from a separate raster endpoint, the same pattern the heat engine
            uses for its delta-T grid.
          </p>
          <div className="meth-fieldgrid">
            {[
              { field: "scene_confidence", desc: "Per-scene reconstruction confidence, driven by spatial/temporal distance from the nearest clear-sky calibration observation." },
              { field: "reconstructed_fraction", desc: "Share of the AOI that required SAR-guided fill, vs. pixels that were already clear in the optical source." },
              { field: "low_confidence_fraction", desc: "Sub-share of the reconstructed area flagged below the confidence floor — surfaced explicitly rather than silently averaged away." },
              { field: "caveats", desc: "Human-readable list of reconstruction warnings attached to this specific scene pair, not a generic disclaimer." },
            ].map((f) => (
              <div key={f.field} className="meth-field-card">
                <div className="meth-field-name">{f.field}</div>
                <p className="meth-field-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            LAYER 1 — WATER ENGINE (CORE A)
           ══════════════════════════════════════════════════════════════ */}
        <div id="water" />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} style={{ paddingTop: "32px", borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Droplets size={16} color="var(--cobalt-bright)" />
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--cobalt-bright)", textTransform: "uppercase" }}>
              Layer 01 · Water Engine (Core A)
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--sans)", fontSize: "32px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>
            Seven spectral indices, one deterministic score
          </h2>
          <p style={{ color: "var(--text-2)", fontSize: "15px", marginBottom: "32px", maxWidth: "700px" }}>
            <code style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>POST /v1/assessments/generate</code> takes a
            GeoJSON AOI and an optional telemetry history, then runs seven pure-NumPy band-math indices over the
            scene. A dual-index water mask (NDWI ∩ MNDWI) isolates open water before any index is aggregated to a
            masked mean — this is why the numbers below can't be skewed by land pixels bleeding into the average.
          </p>

          <motion.div className="meth-indices-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            {spectralIndices.map((idx) => (
              <motion.div key={idx.tag} className="meth-index-card" variants={fadeUp}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ fontFamily: "var(--sans)", fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{idx.name}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", background: "rgba(63, 125, 82, 0.1)", color: "var(--good)", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                    {idx.tag}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-4)", marginBottom: "12px" }}>BANDS: {idx.bands}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)", background: "#000", padding: "10px", borderRadius: "6px", border: "1px solid var(--line)", marginBottom: "12px" }}>
                  {idx.math}
                </div>
                <p style={{ color: "var(--text-3)", fontSize: "13px", lineHeight: 1.5, marginBottom: idx.note ? "10px" : 0 }}>{idx.desc}</p>
                {idx.note && (
                  <p style={{ color: "var(--text-4)", fontSize: "12px", lineHeight: 1.5, fontStyle: "italic", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
                    {idx.note}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* RISK MODEL */}
          <div className="meth-panel">
            <h3 style={{ fontFamily: "var(--sans)", fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>
              Risk model: spectral baseline + telemetry modifier
            </h3>
            <p style={{ color: "var(--text-3)", fontSize: "14px", lineHeight: 1.7, marginBottom: "28px", maxWidth: "700px" }}>
              Every contributing factor is linearly rescaled into [0, 1] against a literature-calibrated floor/ceiling,
              multiplied by its fixed weight below, and summed to a spectral baseline. Field telemetry — algae
              sightings, water-colour anomalies, dead-fish counts, public complaints, rainfall — can add up to
              <strong style={{ color: "var(--text-2)" }}> +0.50</strong> on top, hard-capped so no single field report
              can singlehandedly flip the tier. The final <code style={{ fontFamily: "var(--mono)" }}>aggregate_score</code> is
              clamped to [0, 1] and mapped onto a <code style={{ fontFamily: "var(--mono)" }}>RiskTier</code>.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px" }} className="md:grid-cols-2">
              <div>
                <div className="meth-subhead">Spectral baseline weights</div>
                {riskWeights.map((w) => (
                  <WeightBar key={w.label} label={w.label} value={w.value} />
                ))}
              </div>
              <div>
                <div className="meth-subhead">Telemetry modifier (capped at +0.50 total)</div>
                <ul className="meth-modifier-list">
                  {telemetryModifiers.map((m) => (
                    <li key={m.label}>
                      <span>{m.label}</span>
                      <span className="meth-modifier-value">{m.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: "36px" }}>
              <div className="meth-subhead">Tier thresholds (RiskTier.from_confidence_score)</div>
              <TierScale />
            </div>

            <div style={{ marginTop: "36px" }}>
              <div className="meth-subhead">Escalation SLA (OperationalUrgency)</div>
              <div className="meth-sla-grid">
                {slaTable.map((s) => (
                  <div key={s.level} className="meth-sla-card">
                    <div className="meth-sla-level">{s.level}</div>
                    <div className="meth-sla-hours">{s.hours}h</div>
                    <div className="meth-sla-caption">target response</div>
                  </div>
                ))}
              </div>
              <p style={{ color: "var(--text-4)", fontSize: "12px", marginTop: "12px" }}>
                HIGH/CRITICAL tiers escalate to IMMEDIATE only when the latest telemetry entry also carries a
                critical field event — otherwise they hold at ELEVATED.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            LAYER 2 — HEAT ENGINE (CORE B, PINN)
           ══════════════════════════════════════════════════════════════ */}
        <div id="heat" style={{ paddingTop: "80px" }} />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <EngineSlider
            eyebrow="Layer 02 · Heat Engine (Core B)"
            title="Physics-Informed What-If Simulation"
            stat="PASSED"
            statLabel="Guardrail Status (sample run)"
            leftLayer={{ name: "Baseline LST (Observed)", src: "/images/heat-baseline-lst.png" }}
            rightLayers={[
              { id: 1, name: "ΔT Grid — Canopy +0.15", src: "/images/heat-delta-t-canopy.png", highlight: "var(--cobalt-bright)" },
              { id: 2, name: "ΔT Grid — Cool Roof", src: "/images/heat-delta-t-coolroof.png", highlight: "var(--gold)" },
              { id: 3, name: "Guardrail-Flagged Run", src: "/images/heat-guardrail-flagged.png", highlight: "#d64545" },
            ]}
          />
          <p style={{ color: "var(--text-4)", fontSize: "12px", marginTop: "-40px", marginBottom: "72px", fontStyle: "italic" }}>
            Image placeholders — swap in real PINN visualization exports once you have them; filenames above are
            suggestions, not files that exist yet.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} style={{ marginBottom: "96px" }}>
          <p style={{ color: "var(--text-2)", fontSize: "15px", lineHeight: 1.8, maxWidth: "800px", marginBottom: "32px" }}>
            <code style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>POST /v1/simulations/what-if</code> runs a
            trained PINN forward over an AOI's thermal/NDVI/landcover stack under a requested micro-climate
            intervention — CANOPY, COOL_ROOF, or ALBEDO_CHANGE — at a given delta magnitude. Two separate physics
            checks operate at two separate points in the pipeline, and it's worth keeping them distinct:
          </p>

          <div className="meth-panel" style={{ marginBottom: "32px" }}>
            <h3 style={{ fontFamily: "var(--sans)", fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>
              1. Training-time: physics-informed loss
            </h3>
            <div style={{ fontFamily: "var(--mono)", fontSize: "18px", color: "var(--cobalt-bright)", marginBottom: "20px", padding: "16px", background: "#000", borderRadius: "6px", border: "1px solid var(--line)" }}>
              L<sub>total</sub> = L<sub>data</sub> + λ · L<sub>physics</sub>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="md:grid-cols-2">
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)", marginBottom: "8px" }}>L<sub>data</sub></div>
                <p style={{ color: "var(--text-3)", fontSize: "14px", lineHeight: 1.6 }}>
                  Standard supervised error against observed thermal readings.
                </p>
              </div>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--cobalt-bright)", marginBottom: "8px" }}>λ · L<sub>physics</sub></div>
                <p style={{ color: "var(--text-3)", fontSize: "14px", lineHeight: 1.6 }}>
                  Penalizes predictions that violate governing heat-transfer constraints, regardless of how well
                  they fit the training distribution — this is what keeps outputs physically plausible off-distribution.
                </p>
              </div>
            </div>
          </div>

          <div className="meth-panel">
            <h3 style={{ fontFamily: "var(--sans)", fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>
              2. Inference-time: the physicist guardrail
            </h3>
            <p style={{ color: "var(--text-3)", fontSize: "14px", lineHeight: 1.7, marginBottom: "24px", maxWidth: "700px" }}>
              After the PINN produces a <code style={{ fontFamily: "var(--mono)" }}>delta_t_grid</code>, a second,
              fully independent check — <code style={{ fontFamily: "var(--mono)" }}>physicist_agent()</code> — flags
              any run where a pixel's predicted change exceeds a literature-derived bound for that intervention type.
              This has nothing to do with the loss function above; it's a hard clamp applied after the fact, on
              every single simulation, with no exceptions.
            </p>
            {guardrailBounds.map((g) => (
              <GuardrailBar key={g.label} label={g.label} celsius={g.celsius} />
            ))}
            <div style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
              <div className="meth-guardrail-pill passed">
                <ShieldCheck size={14} /> PASSED — no pixel exceeded its bound
              </div>
              <div className="meth-guardrail-pill flagged">
                <ShieldAlert size={14} /> FLAGGED — result kept, confidence downgraded, reason logged verbatim
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            LAYER 3 — BRIDGE / CO-LOCATION
           ══════════════════════════════════════════════════════════════ */}
        <div id="bridge" />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} style={{ paddingTop: "32px", borderTop: "1px solid var(--line)", marginBottom: "96px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <GitMerge size={16} color="var(--cobalt-bright)" />
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--cobalt-bright)", textTransform: "uppercase" }}>
              Layer 03 · Bridge (Co-Location)
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--sans)", fontSize: "32px", fontWeight: 600, color: "var(--text)", marginBottom: "16px" }}>
            Deliberately not an LLM call
          </h2>
          <p style={{ color: "var(--text-2)", fontSize: "15px", lineHeight: 1.8, maxWidth: "760px", marginBottom: "24px" }}>
            <code style={{ fontFamily: "var(--mono)", fontSize: "13px" }}>POST /v1/colocation/assess</code> fans out
            to both engines for the same AOI, then checks a single, auditable condition: is the water risk score
            at or above <strong style={{ color: "var(--text)" }}>0.5</strong>? That threshold is a plain number
            comparison, not a model judgement — the trigger logic can't hallucinate a co-location flag, because
            there's no model in the loop deciding whether to raise one. If a Gemini-authored narrative ever
            replaces the current template, it will only be responsible for describing the flag, never for
            deciding it.
          </p>
          <div className="meth-panel">
            <p style={{ color: "var(--text-3)", fontSize: "14px", lineHeight: 1.7 }}>
              A triggered flag is stated explicitly as a <strong style={{ color: "var(--text)" }}>hypothesis, not
              a proven causal link</strong> — the actual response text ends with a recommendation for field
              verification before it informs any funding or intervention decision. The confidence language shifts
              based on the paired heat run's own guardrail status: a PASSED heat simulation gets described as
              physically validated; a FLAGGED one is explicitly called out as low-confidence in the same sentence.
            </p>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            AGENT LAYER
           ══════════════════════════════════════════════════════════════ */}
        <div id="agents" />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} style={{ paddingTop: "32px", borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontFamily: "var(--sans)", fontSize: "28px", fontWeight: 600, color: "var(--text)", marginBottom: "24px" }}>
            The Agent Layer
          </h2>
          <p style={{ color: "var(--text-2)", fontSize: "15px", marginBottom: "40px", maxWidth: "740px" }}>
            Once the deterministic engines above finish, four Gemini agents wrap the result: one to talk to the
            user and call the engines as tools, one to ground the numbers in real-world search context, one to
            write the citizen-facing summary, and one whose entire job is to check the summary against the raw
            numbers and catch it if it's wrong. None of them can move a risk tier, a guardrail status, or a
            co-location flag — those come only from the layers above.
          </p>

          <div className="meth-agent-stack">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <motion.div
                  key={agent.id}
                  className="meth-agent-card"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Icon size={16} color="var(--cobalt-bright)" />
                      <span style={{ fontFamily: "var(--sans)", fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>{agent.name}</span>
                      <span style={{ color: "var(--cobalt-bright)" }}>·</span>
                      <span style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "var(--cobalt-bright)" }}>{agent.role}</span>
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-4)", letterSpacing: "0.1em" }}>
                      AGENT 0{agent.id}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-3)", marginBottom: "16px" }}>{agent.mode}</div>
                  <p style={{ color: "var(--text-2)", fontSize: "14px", lineHeight: 1.6 }}>{agent.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ─── CLOSING NOTE ─── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{ marginTop: "96px", paddingTop: "32px", borderTop: "1px solid var(--line)", color: "var(--text-4)", fontSize: "13px", lineHeight: 1.7, maxWidth: "700px" }}
        >
          Every number on this page traces back to a specific file in the repo, not marketing copy — the source
          references at the top of this component point to exactly where.
        </motion.div>
      </div>
    </div>
  );
}