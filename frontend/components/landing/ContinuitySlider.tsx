"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GripVertical } from "lucide-react";
import { motion } from "framer-motion";

export default function ContinuitySlider() {
  // Slider position (0 to 100%)
  const [sliderPos, setSliderPos] = useState(50);
  
  // The right-hand side is mode-selectable
  const [activeRightLayer, setActiveRightLayer] = useState<1 | 2 | 3>(1);

  // Left Side (Always Input)
  const inputLayer = { name: "Cloud Blind (Input)", src: "/images/1000067135.png" };

  // Right Side Options
  const rightLayers = [
    { id: 1, name: "UNet Repaired", src: "/images/1000067136.png", highlight: "var(--cobalt-bright)" },
    { id: 2, name: "Confidence Heatmap", src: "/images/1000067140.png", highlight: "var(--gold)" },
    { id: 3, name: "Ground Truth", src: "/images/1000067137.png", highlight: "var(--good)" }
  ];

  const currentRight = rightLayers.find(layer => layer.id === activeRightLayer)!;

  return (
    <motion.div 
      className="cs-wrapper"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.8 }}
    >
      
      {/* ─── NEW: Transition Heading to fill the gap ─── */}
      <div style={{ textAlign: "center", marginBottom: "100px", marginTop: "40px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: "10px" }}>
          Validating the boundary
        </div>
        <h2 style={{ fontFamily: "var(--sans)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Inside the <em style={{ fontFamily: "var(--serif)", color: "var(--cobalt-bright)", fontStyle: "italic", fontWeight: 400 }}>Engines.</em>
        </h2>
      </div>

      {/* Header Info */}
      <div className="cs-header">
        <div className="cs-title-wrap">
          <h3 style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--cobalt-bright)", marginBottom: "8px" }}>
            ● LAYER 00 : CONTINUITY ENGINE
          </h3>
          <p style={{ fontFamily: "var(--sans)", fontSize: "24px", color: "var(--text)", fontWeight: 500 }}>
            Generative Cloud-Penetrating Radar
          </p>
        </div>
        <div className="cs-stats">
          <div style={{ fontFamily: "var(--sans)", fontSize: "32px", color: "var(--good)", fontWeight: 600, letterSpacing: "-0.02em" }}>
            96%
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Scene Confidence Avg
          </div>
        </div>
      </div>

      {/* The Interactive Comparison Stage */}
      <div className="cs-image-box">
        
        {/* Background Image: The Selectable Output (Right Side) */}
        <div className="absolute inset-0">
          <Image
            src={currentRight.src}
            alt={currentRight.name}
            fill
            unoptimized
          />
        </div>

        {/* Foreground Image: The Input (Left Side) - Clipped dynamically by the slider */}
        <div 
          className="absolute inset-0 z-10"
          style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
        >
          <Image
            src={inputLayer.src}
            alt={inputLayer.name}
            fill
            unoptimized
          />
        </div>

        {/* Interactive UI: Labels */}
        <div className="cs-label left">
          {inputLayer.name}
        </div>
        <div className="cs-label right" style={{ borderBottom: `2px solid ${currentRight.highlight}` }}>
          {currentRight.name}
        </div>

        {/* Interactive UI: Slider Divider & Handle */}
        <div className="cs-divider" style={{ left: `${sliderPos}%` }}>
          <div className="cs-handle">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>

        {/* Invisible HTML5 Range Input overlay to capture native dragging/touch */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="cs-slider-input"
        />
      </div>

      {/* Controls & CTA Row */}
      <div className="cs-controls">
        
        {/* Right-Side Layer Toggles */}
        <div className="cs-toggle">
          {rightLayers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveRightLayer(layer.id as 1 | 2 | 3)}
              className={activeRightLayer === layer.id ? "active" : ""}
            >
              {layer.name}
            </button>
          ))}
        </div>

        {/* Methodology Link */}
        <Link href="/methodology" className="cs-link">
          View Model Methodology 
          <ArrowRight />
        </Link>
      </div>

    </motion.div>
  );
}