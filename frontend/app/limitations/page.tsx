"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, ShieldCheck, Cpu, Droplets, Flame, RefreshCw } from "lucide-react";

export default function LimitationsPage() {
  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  // Card slide-up & fade-in animation
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const limitations = [
    {
      engine: "Continuity Engine",
      tag: "Radar-Optical Reconstruction",
      icon: <RefreshCw size={16} />,
      title: "Cloud-removal calibration is unproven at global scale.",
      description:
        "The SAR-to-optical PyTorch UNet reconstruction pipeline is validated against specific benchmark AOIs (Areas of Interest). Confidence heatmaps represent local Bayesian variance across forward passes—they are empirical reliability bounds, not absolute ground-truth guarantees across uncalibrated biomes."
    },
    {
      engine: "Continuity Engine",
      tag: "Model Evaluation & Training Split",
      icon: <Cpu size={16} />,
      title: "Small sample distributions and held-out validation bounds.",
      description:
        "Our baseline models were benchmarked across regional geographic datasets. While sufficient to prove deterministic edge preservation and variance estimation, model inference must be continuously calibrated with regional ground stations before generalizing to arbitrary continents."
    },
    {
      engine: "Water Engine",
      tag: "Spectral Index Proxies",
      icon: <Droplets size={16} />,
      title: "Not certified laboratory chemistry or direct pathogen detection.",
      description:
        "ClimaLenz computes 7-band mathematical spectral ratios (NDCI, NDTI, FAI, NDWI) from Sentinel-2 L2A optical sensors. These serve as statistical proxies for algal blooms and turbidity precursors—they do not replace in-situ wet-lab spectrometry, heavy-metal assays, or biological pathogen culturing."
    },
    {
      engine: "Heat Engine",
      tag: "PINN Thermodynamic Constraints",
      icon: <Flame size={16} />,
      title: "Boundary condition sensitivity & atmospheric transmission.",
      description:
        "Our Physics-Informed Neural Network strictly enforces the 2D Heat Diffusion Equation ($u_t = \\alpha \\nabla^2 u$). However, surface temperature inputs depend on MODIS and Landsat thermal infrared bands, which inherit atmospheric correction uncertainties and 100m–1km spatial pixel aggregation."
    },
    {
      engine: "Data Pipeline",
      tag: "Revisit Intervals & Mixed Pixels",
      icon: <AlertTriangle size={16} />,
      title: "Satellite revisit latency and shoreline mixing effects.",
      description:
        "Sentinel-2 provides 5-day revisit cadence at the equator. During persistent cloud cover, observations rely on SAR continuity fills. Pixels along shallow shoreline boundaries can blend emergent vegetation with water columns; individual boundary pixels should always be interpreted via aggregate zonal means."
    },
    {
      engine: "Agentic Layer",
      tag: "Audited LLM Strategy",
      icon: <ShieldCheck size={16} />,
      title: "Advisory governance only — human confirmation required.",
      description:
        "The Honest AI auditor mathematically purges hallucinations that lack engine telemetry backing. However, all generated policy interventions, hazard tiers, and mitigation steps are advisory intelligence designed to assist human environmental directors, not autonomous execution triggers."
    }
  ];

  return (
    <div className="relative min-h-screen w-full" style={{ backgroundColor: "var(--ink)" }}>
      <div className="limit-wrapper">
        
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: "32px" }}
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[var(--text-3)] hover:text-[var(--text)] transition-colors text-xs font-mono tracking-wider uppercase"
          >
            <ArrowLeft size={14} /> Back to Overview
          </Link>
        </motion.div>

        {/* Page Header */}
        <motion.div 
          className="limit-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--cobalt-bright)", textTransform: "uppercase", marginBottom: "12px" }}>
            Honest AI Architecture • Disclosures
          </div>
          
          <h1 style={{ fontFamily: "var(--sans)", fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "20px" }}>
            What we don&apos;t claim.
          </h1>
          
          <p style={{ color: "var(--text-2)", fontSize: "17px", lineHeight: 1.7, maxWidth: "700px" }}>
            An honest intelligence system discloses its mathematical boundaries. We prioritize empirical rigor over marketing hype. ClimaLenz is built to prioritize where environmental teams should investigate—not to replace physical validation.
          </p>
        </motion.div>

        {/* Staggered Limitations List */}
        <motion.div 
          className="limit-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
        >
          {limitations.map((item, idx) => (
            <motion.div 
              key={idx} 
              className="limit-card"
              variants={cardVariants}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                <div className="limit-tag">
                  {item.tag}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-4)" }}>
                  {item.icon}
                  <span>{item.engine}</span>
                </div>
              </div>

              <h2 className="limit-title">{item.title}</h2>
              <p className="limit-desc">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ marginTop: "64px", paddingTop: "32px", borderTop: "1px solid var(--line)", textAlign: "center" }}
        >
          <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-4)", letterSpacing: "0.05em" }}>
            Continuous model evaluation and audit ledger maintained under open-source compliance • MIT License
          </p>
        </motion.div>

      </div>
    </div>
  );
}