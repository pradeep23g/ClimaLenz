"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ContinuitySlider() {
  const [activeLayer, setActiveLayer] = useState<0 | 1 | 2>(1); // Default to UNet

  const layers = [
    { id: 0, name: "Cloud Blind (Input)", src: "/images/1000067135.png" },
    { id: 1, name: "UNet Repaired", src: "/images/1000067136.png" },
    { id: 2, name: "Ground Truth", src: "/images/1000067137.png" }
  ];

  return (
    <div className="cs-wrapper">
      
      {/* Header Info */}
      <div className="cs-header">
        <div className="cs-title-wrap">
          <h3 style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--cobalt-bright)", marginBottom: "10px" }}>
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

      {/* The Image Container */}
      <div className="cs-image-box">
        <Image
          src={layers[activeLayer].src}
          alt={layers[activeLayer].name}
          fill
          style={{ objectFit: "cover" }}
          unoptimized
        />
        
        {/* Top-left Indicator */}
        <div className="cs-badge">
          VIEW: {layers[activeLayer].name.toUpperCase()}
        </div>
      </div>

      {/* Controls & CTA Row */}
      <div className="cs-controls">
        
        {/* 3-Way Toggle Switch */}
        <div className="cs-toggle">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id as 0 | 1 | 2)}
              className={activeLayer === layer.id ? "active" : ""}
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

    </div>
  );
}