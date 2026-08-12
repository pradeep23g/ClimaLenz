"use client";

import { motion } from "framer-motion";
import { Cpu, Globe, Database, Layers, Sparkles, Server } from "lucide-react";

export default function TechMarqueeSection() {
  // Row 1: Satellite Data, GIS & Open Data Infrastructure
  const openDataTech = [
    { name: "Sentinel-1 SAR", category: "Radar Satellite", icon: <Globe size={14} /> },
    { name: "Sentinel-2 L2A", category: "Optical Data", icon: <Globe size={14} /> },
    { name: "NASA MODIS", category: "Thermal Data", icon: <Globe size={14} /> },
    { name: "ESA Copernicus", category: "Data Provider", icon: <Database size={14} /> },
    { name: "USGS Landsat", category: "Earth Observation", icon: <Database size={14} /> },
    { name: "Microsoft Planetary Computer", category: "STAC Catalog", icon: <Server size={14} /> },
    { name: "OpenStreetMap", category: "Geospatial Vectors", icon: <Layers size={14} /> },
    { name: "OpenFreeMap", category: "Vector Tile Host", icon: <Layers size={14} /> },
    { name: "MapLibre GL", category: "Rendering Engine", icon: <Cpu size={14} /> },
  ];

  // Row 2: AI Backbone, Cloud Platform & Gemini Capabilities
  const aiCloudTech = [
    { name: "Google AI Studio", category: "LLM Pipeline", icon: <Sparkles size={14} /> },
    { name: "Gemini 2.5 Pro", category: "Agent Engine", icon: <Sparkles size={14} /> },
    { name: "Vertex AI", category: "Model Host", icon: <Server size={14} /> },
    { name: "PyTorch PINN", category: "Physics Engine", icon: <Cpu size={14} /> },
    { name: "Google Cloud Run", category: "Serverless Backend", icon: <Server size={14} /> },
    { name: "Function Calling", category: "Gemini Tooling", icon: <Sparkles size={14} /> },
    { name: "Multimodal Vision", category: "Gemini Tooling", icon: <Sparkles size={14} /> },
    { name: "Structured Output", category: "Gemini Tooling", icon: <Sparkles size={14} /> },
    { name: "Text-Embedding-004", category: "Vector RAG", icon: <Database size={14} /> },
  ];

  // Duplicate arrays to ensure seamless infinite looping without gaps
  const row1 = [...openDataTech, ...openDataTech];
  const row2 = [...aiCloudTech, ...aiCloudTech];

  return (
    <motion.section 
      className="tm-wrapper"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="tm-header">
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: "8px" }}>
          Built on open data and free infrastructure
        </div>
        <h3 style={{ fontFamily: "var(--sans)", fontSize: "20px", fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
          Powered by Earth Observation Satellites &amp; Next-Gen AI Infrastructure
        </h3>
      </div>

      {/* Dual Infinite Marquee Track Container */}
      <div className="tm-marquee-container">
        
        {/* Track 1: Leftward Scroll (Open Data & GIS Stack) */}
        <div className="tm-track-wrap">
          <div className="tm-track">
            {row1.map((item, idx) => (
              <div key={`row1-${idx}`} className="tm-item">
                <span style={{ color: "var(--cobalt-bright)" }}>{item.icon}</span>
                <span>{item.name}</span>
                <span className="tm-category">{item.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Track 2: Rightward Scroll (AI Models & Cloud Engine) */}
        <div className="tm-track-wrap">
          <div className="tm-track reverse">
            {row2.map((item, idx) => (
              <div key={`row2-${idx}`} className="tm-item">
                <span style={{ color: "var(--good)" }}>{item.icon}</span>
                <span>{item.name}</span>
                <span className="tm-category">{item.category}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.section>
  );
}