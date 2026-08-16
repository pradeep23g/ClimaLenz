"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Cpu, Radio, ShieldCheck, ArrowRight, GripVertical } from "lucide-react";

export default function ContinuitySection() {
  // ============================================================================
  // STATE & DATA: INTERACTIVE SLIDER
  // ============================================================================
  const [sliderPos, setSliderPos] = useState(50);
  const [activeRightLayer, setActiveRightLayer] = useState<1 | 2 | 3>(1);

  const inputLayer = { 
    name: "Cloud Blind (Input)", 
    src: "/images/1000067135.png" 
  };

  const rightLayers = [
    { id: 1, name: "UNet Repaired", src: "/images/1000067136.png", highlight: "var(--cobalt-bright)" },
    { id: 2, name: "Confidence Heatmap", src: "/images/1000067140.png", highlight: "var(--gold)" },
    { id: 3, name: "Ground Truth", src: "/images/1000067137.png", highlight: "var(--good)" }
  ];

  const currentRight = rightLayers.find(layer => layer.id === activeRightLayer)!;

  // ============================================================================
  // DATA: NODE MATRIX ANIMATION
  // ============================================================================
  const sensorNodes = [
    { id: "s1", cx: 50, cy: 50, r: 4, color: "var(--cobalt-bright)", delay: 0.1 },
    { id: "s2", cx: 250, cy: 40, r: 5, color: "var(--cobalt)", delay: 0.3 },
    { id: "s3", cx: 280, cy: 150, r: 4, color: "var(--text-4)", delay: 0.5 },
    { id: "s4", cx: 240, cy: 260, r: 6, color: "var(--over)", delay: 0.2 },
    { id: "s5", cx: 150, cy: 280, r: 4, color: "var(--cobalt-bright)", delay: 0.7 },
    { id: "s6", cx: 40, cy: 220, r: 5, color: "var(--cobalt)", delay: 0.4 },
    { id: "s7", cx: 20, cy: 120, r: 3, color: "var(--text-4)", delay: 0.6 },
  ];

  const hiddenNodes = [
    { id: "h1", cx: 100, cy: 100, r: 3, color: "var(--good)", delay: 0.2 },
    { id: "h2", cx: 200, cy: 90, r: 3, color: "var(--good)", delay: 0.4 },
    { id: "h3", cx: 210, cy: 190, r: 3, color: "var(--good)", delay: 0.6 },
    { id: "h4", cx: 90, cy: 200, r: 3, color: "var(--good)", delay: 0.3 },
  ];

  const pipelines = [
    { x1: 50, y1: 50, x2: 100, y2: 100, delay: 0.1 },
    { x1: 250, y1: 40, x2: 200, y2: 90, delay: 0.3 },
    { x1: 280, y1: 150, x2: 210, y2: 190, delay: 0.5 },
    { x1: 240, y1: 260, x2: 210, y2: 190, delay: 0.2, isBroken: true }, 
    { x1: 150, y1: 280, x2: 210, y2: 190, delay: 0.7 },
    { x1: 40, y1: 220, x2: 90, y2: 200, delay: 0.4 },
    { x1: 20, y1: 120, x2: 100, y2: 100, delay: 0.6 },
    { x1: 100, y1: 100, x2: 150, y2: 150, delay: 0.3 },
    { x1: 200, y1: 90, x2: 150, y2: 150, delay: 0.5 },
    { x1: 210, y1: 190, x2: 150, y2: 150, delay: 0.7 },
    { x1: 90, y1: 200, x2: 150, y2: 150, delay: 0.4 },
  ];

  return (
    <motion.section 
      className="cs-unified-wrapper"
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.8 }}
    >
      
      {/* =======================================================================
          PART 1: THE SECTION HEADER
          ======================================================================= */}
      <div className="w-full text-center mb-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: "16px" }}
        >
          Validating the boundary
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontFamily: "var(--sans)", fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.05 }}
        >
          Inside the <em style={{ fontFamily: "var(--serif)", color: "var(--cobalt-bright)", fontStyle: "italic", fontWeight: 400 }}>Engines.</em>
        </motion.h2>
      </div>

      {/* =======================================================================
          PART 2: THE NODE MATRIX (THE THEORY)
          ======================================================================= */}
      <div className="cs-split-grid relative z-10">
        
        {/* Left Side: Copy & Telemetry */}
        <div className="cs-left-col">
          <div className="flex items-center gap-3 mb-6" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span className="w-2 h-2 rounded-full bg-[var(--cobalt-bright)]" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--cobalt-bright)", boxShadow: "0 0 10px var(--cobalt-glow)" }} />
            <h3 style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--cobalt-bright)", textTransform: "uppercase", margin: 0 }}>
              Layer 00 : Continuity Engine
            </h3>
          </div>
          
          <h4 style={{ fontFamily: "var(--sans)", fontSize: "clamp(28px, 3vw, 36px)", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "20px" }}>
            Generative Cloud <br /> Penetrating Radar.
          </h4>
          
          <p style={{ color: "var(--text-2)", fontSize: "16px", lineHeight: 1.7, maxWidth: "480px", marginBottom: "40px" }}>
            When Sentinel-2 optical satellites are blinded by dense cloud cover, the ecosystem doesn't just stop. The Continuity Engine cross-references Sentinel-1 SAR (Synthetic Aperture Radar) through a proprietary UNet topology. It mathematically reconstructs the missing terrain structure beneath the clouds with near-perfect fidelity.
          </p>
          
          <div className="cs-stats-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--good)" }}>
                <ShieldCheck className="w-4 h-4" />
                <span style={{ fontFamily: "var(--sans)", fontSize: "32px", fontWeight: 600, letterSpacing: "-0.02em" }}>96%</span>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Scene Confidence Avg</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--text)" }}>
                <Activity className="w-4 h-4 text-[var(--cobalt-bright)]" />
                <span style={{ fontFamily: "var(--sans)", fontSize: "32px", fontWeight: 600, letterSpacing: "-0.02em" }}>0-Shot</span>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Hallucination Rate</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--text)" }}>
                <Radio className="w-4 h-4 text-[var(--cobalt-bright)]" />
                <span style={{ fontFamily: "var(--sans)", fontSize: "24px", fontWeight: 600, letterSpacing: "-0.02em" }}>C-Band</span>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>SAR Frequency</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--text)" }}>
                <Cpu className="w-4 h-4 text-[var(--cobalt-bright)]" />
                <span style={{ fontFamily: "var(--sans)", fontSize: "24px", fontWeight: 600, letterSpacing: "-0.02em" }}>U-Net</span>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Topology Structure</div>
            </div>
          </div>
        </div>

        {/* Right Side: Matrix HUD */}
        <div className="cs-right-col group">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          
          <div className="absolute top-5 left-5 z-20" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--good)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--good)" }} className="animate-pulse" /> Live Deployment
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-4)", letterSpacing: "0.05em" }}>PID: CL-UNET-883A</div>
          </div>
          
          <div className="absolute bottom-5 right-5 text-right z-20">
             <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--cobalt-bright)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Mesh Sync
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-4)", letterSpacing: "0.05em", marginTop: "4px" }}>
              Sentinel-1 ✕ Sentinel-2
            </div>
          </div>
          
          <svg viewBox="0 0 300 300" className="w-[85%] h-[85%] opacity-90 relative z-10 drop-shadow-2xl">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <motion.circle cx="150" cy="150" r="110" fill="none" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 6" />
            <motion.circle cx="150" cy="150" r="70" fill="none" stroke="var(--line-2)" strokeWidth="0.5" />
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity }} style={{ transformOrigin: "150px 150px" }}>
              <circle cx="150" cy="40" r="2" fill="var(--text-3)" />
              <circle cx="150" cy="260" r="2" fill="var(--text-3)" />
            </motion.g>
            <motion.circle cx="150" cy="150" r="12" fill="var(--cobalt-bright)" filter="url(#glow)" animate={{ scale: [1, 1.1, 1], opacity: [0.9, 1, 0.9] }} transition={{ duration: 2.5, repeat: Infinity }} />
            
            {pipelines.map((pipe, i) => (
              <g key={`pipe-${i}`}>
                <line x1={pipe.x1} y1={pipe.y1} x2={pipe.x2} y2={pipe.y2} stroke={pipe.isBroken ? "var(--over-line)" : "var(--line-2)"} strokeWidth="1" strokeDasharray={pipe.isBroken ? "2 4" : "none"} />
                {!pipe.isBroken && (
                  <motion.line x1={pipe.x1} y1={pipe.y1} x2={pipe.x2} y2={pipe.y2} stroke="var(--cobalt-bright)" strokeWidth="1.5" strokeDasharray="10 100" initial={{ strokeDashoffset: 110 }} animate={{ strokeDashoffset: -10 }} transition={{ duration: 1.5, delay: pipe.delay, repeat: Infinity }} />
                )}
              </g>
            ))}
            {sensorNodes.map((node) => (
              <motion.g key={node.id}>
                <motion.circle cx={node.cx} cy={node.cy} r={node.r} fill="none" stroke={node.color} strokeWidth="1" initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 2, delay: node.delay, repeat: Infinity }} />
                <circle cx={node.cx} cy={node.cy} r={node.r} fill={node.color} />
              </motion.g>
            ))}
            {hiddenNodes.map((node) => (
              <motion.circle key={node.id} cx={node.cx} cy={node.cy} r={node.r} fill={node.color} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, delay: node.delay, repeat: Infinity }} />
            ))}
          </svg>
        </div>
      </div>

 
          <Link href="/methodology" className="cs-link">
            View Model Methodology <ArrowRight />
          </Link>
          

    </motion.section>
  );
}