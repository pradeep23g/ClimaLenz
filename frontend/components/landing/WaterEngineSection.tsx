"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Droplet, Leaf, AlertTriangle, Layers, ArrowRight } from "lucide-react";

export default function WaterEngineSection() {
  // ─── DATA MAPPING ──────────────────────────────────────────────────────────
  const engineData = [
    { 
      id: "ndwi", short: "NDWI", name: "Normalized Difference Water Index", 
      desc: "Tells us where water actually is in the scene. Isolates open water extent by maximizing reflectance of water in the green band.",
      formula: "(Green − NIR) / (Green + NIR)", bands: ["Green", "NIR"], 
      color: "var(--cobalt-bright)", bg: "var(--cobalt-soft)" 
    },
    { 
      id: "mndwi", short: "MNDWI", name: "Modified NDWI", 
      desc: "Same idea as NDWI, but trustworthy in urban contexts. Standard NDWI gets confused by built-up structures; substituting SWIR fixes the noise.",
      formula: "(Green − SWIR) / (Green + SWIR)", bands: ["Green", "SWIR"], 
      color: "var(--cobalt)", bg: "var(--cobalt-soft)" 
    },
    { 
      id: "lswi", short: "LSWI", name: "Land Surface Water Index", 
      desc: "Detects moisture content directly in canopy and soil, rather than just open surface water.",
      formula: "(NIR − SWIR) / (NIR + SWIR)", bands: ["NIR", "SWIR"], 
      color: "var(--cobalt-bright)", bg: "var(--cobalt-soft)" 
    },
    { 
      id: "ndvi", short: "NDVI", name: "Vegetation Index", 
      desc: "Measures vegetation health and greenness. Used here primarily as a cross-reference mask to separate flora from water.",
      formula: "(NIR − Red) / (NIR + Red)", bands: ["NIR", "Red"], 
      color: "var(--good)", bg: "rgba(63, 125, 82, 0.15)" 
    },
    { 
      id: "ndti", short: "NDTI", name: "Turbidity Index", 
      desc: "Calculates how murky the water looks. Acts as a stand-in for suspended sediment and pollution runoff.",
      formula: "(Red − Green) / (Red + Green)", bands: ["Red", "Green"], 
      color: "var(--gold)", bg: "rgba(184, 134, 60, 0.15)" 
    },
    { 
      id: "ndci", short: "NDCI", name: "Chlorophyll Proxy", 
      desc: "The critical early-warning signal for algal blooms, tracking chlorophyll-a concentrations before they become visible to the eye.",
      formula: "(RedEdge1 − Red) / (RedEdge1 + Red)", bands: ["RedEdge1", "Red"], 
      color: "var(--over)", bg: "var(--over-soft)" 
    },
    { 
      id: "wri", short: "WRI", name: "Water Ratio Index", 
      desc: "A direct, non-normalized ratio used as a secondary structural verification against false positives.",
      formula: "(Green + Red) / (NIR + SWIR)", bands: ["Green", "Red", "NIR", "SWIR"], 
      color: "var(--cobalt)", bg: "var(--cobalt-soft)" 
    },
    { 
      id: "fveg", short: "F-VEG", name: "Flooded Vegetation Mask", 
      desc: "The structural breakthrough. By asserting that LSWI (wetness) meets or exceeds NDVI (greenness), we detect standing water completely hidden beneath plant canopies.",
      formula: "(LSWI + 0.05) >= NDVI ∧ NDVI > 0.10", bands: ["Composite Logic"], 
      color: "var(--good)", bg: "rgba(63, 125, 82, 0.15)" 
    },
    { 
      id: "risk", short: "RISK", name: "Ecological Risk Engine", 
      desc: "The final aggregate. A weighted sum of spectral outputs (Chlorophyll, Turbidity, Drying) modified by ground-truth telemetry to output a deterministic risk tier.",
      formula: "Σ(Spectral Base) + Σ(Telemetry Modifiers)", bands: ["All Indices", "Telemetry APIs"], 
      color: "var(--over)", bg: "var(--over-soft)" 
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const activeData = engineData[activeIndex];

  // ─── DYNAMIC MATRIX GENERATOR ──────────────────────────────────────────────
  const [matrixCells, setMatrixCells] = useState<number[]>([]);
  
  useEffect(() => {
    const newCells = Array.from({ length: 72 }, () => Math.random() * 0.8 + 0.1);
    setMatrixCells(newCells);
  }, [activeIndex]);

  return (
    <motion.section 
      className="we-wrapper"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.8 }}
    >
      
      {/* ─── SECTION HEADER ─── */}
      <div className="w-full text-center mb-24">
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: "16px" }}>
          Validating the boundary
        </div>
        <h2 style={{ fontFamily: "var(--sans)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Layer 01 : <em style={{ fontFamily: "var(--serif)", color: "var(--cobalt-bright)", fontStyle: "italic", fontWeight: 400 }}>Water Engine.</em>
        </h2>
        <p style={{ color: "var(--text-2)", fontSize: "16px", marginTop: "16px", maxWidth: "600px", marginInline: "auto", display: "inline-block" }}>
          Pure deterministic mathematics. Zero hallucination. 6 spectral indices processed simultaneously on the same Sentinel-2 acquisition to map the exact ecological state of the water.
        </p>
      </div>

      {/* ─── SPLIT LAYOUT ─── */}
      <div className="we-layout">
        
        {/* LEFT: Interactive List */}
        <div className="we-sidebar">
          {engineData.map((item, idx) => (
            <button 
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              className={`we-tab ${activeIndex === idx ? "active" : ""}`}
              style={{
                '--highlight-color': item.bg,
                '--highlight-text': item.color
              } as React.CSSProperties}
            >
              <div className="we-tab-badge">{item.short}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--sans)", fontSize: "14px", fontWeight: 600, color: activeIndex === idx ? "var(--text)" : "var(--text-2)", marginBottom: "4px" }}>
                  {item.name}
                </div>
                <div style={{ fontFamily: "var(--sans)", fontSize: "12px", color: "var(--text-4)", lineHeight: 1.4, display: activeIndex === idx ? "block" : "none" }}>
                  {item.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* RIGHT: Dynamic Display Panel */}
        <div className="we-display">
          
          {/* Animated Matrix Grid */}
          <div className="we-matrix-container">
            {matrixCells.map((opacity, i) => (
              <div 
                key={i} 
                className="we-matrix-cell"
                style={{ 
                  backgroundColor: activeData.color, 
                  opacity: opacity 
                }} 
              />
            ))}
          </div>

          {/* Detailed Data HUD */}
          <div className="we-details" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ flex: 1 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeData.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-md" style={{ background: activeData.bg, color: activeData.color }}>
                      {activeData.id === 'fveg' ? <Leaf size={18} /> : activeData.id === 'risk' ? <AlertTriangle size={18} /> : <Droplet size={18} />}
                    </div>
                    <h3 style={{ fontFamily: "var(--sans)", fontSize: "24px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
                      {activeData.name}
                    </h3>
                    <div style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", gap: "4px", alignItems: "center" }}>
                      <Layers size={12} /> {activeData.bands.join(" + ")}
                    </div>
                  </div>

                  <p style={{ color: "var(--text-2)", fontSize: "14px", lineHeight: 1.6, marginBottom: "32px" }}>
                    {activeData.desc}
                  </p>

                  {/* Formula Terminal Box */}
                  <div style={{ background: "#0a0a0a", border: "1px solid var(--line)", borderRadius: "8px", padding: "16px", position: "relative" }}>
                    <div style={{ position: "absolute", top: "-10px", left: "16px", background: "var(--surface)", padding: "0 8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", border: "1px solid var(--line)", borderRadius: "4px" }}>
                      Mathematical Formula
                    </div>
                    <code style={{ fontFamily: "var(--mono)", fontSize: "14px", color: activeData.color, display: "block", marginTop: "8px" }}>
                      {activeData.id === 'risk' ? (
                        <>
                          <span style={{ color: "var(--text-3)" }}>const risk_score = </span> <br />
                          (NDCI × 0.40) + (NDTI × 0.25) + <br />
                          (NDVI × 0.10) + ((1 − MNDWI) × 0.10) + <br />
                          ((1 − NDWI) × 0.15) <br />
                          <span style={{ color: "var(--over)", marginTop: "8px", display: "inline-block" }}>+ TELEMETRY_MODIFIER</span>
                        </>
                      ) : activeData.id === 'fveg' ? (
                        <>
                          <span style={{ color: "var(--text-3)" }}>const flooded = </span> <br />
                          (LSWI + 0.05 &gt;= NDVI) &amp;&amp; (NDVI &gt; 0.10)
                        </>
                      ) : (
                        <>
                          <span style={{ color: "var(--text-3)" }}>const {activeData.short.toLowerCase()} = </span> <br />
                          {activeData.formula}
                        </>
                      )}
                    </code>
                  </div>

                </motion.div>
              </AnimatePresence>
            </div>

            {/* NEW: Methodology Link anchored to the bottom right */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <Link href="/methodology" className="cs-link">
                View Model Methodology 
                <ArrowRight size={14} />
              </Link>
            </div>
            
          </div>
        </div>
      </div>
    </motion.section>
  );
}