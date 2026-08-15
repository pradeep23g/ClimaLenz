"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Target, Globe, Cpu } from "lucide-react";

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="relative min-h-screen w-full" style={{ backgroundColor: "var(--ink)" }}>
      <div className="about-wrapper">
        
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: "40px" }}
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[var(--text-3)] hover:text-[var(--text)] transition-colors text-xs font-mono tracking-wider uppercase"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div 
          className="about-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--cobalt-bright)", textTransform: "uppercase", marginBottom: "16px" }}>
            Genesis • SD-40
          </div>
          <h1 style={{ fontFamily: "var(--sans)", fontSize: "clamp(40px, 5.5vw, 64px)", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            The problem we started with.
          </h1>
        </motion.div>

        {/* Problem Statements (Staggered Animation) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Section 1 */}
          <motion.div className="about-section" variants={itemVariants}>
            <h2 className="about-title">Green infrastructure is planned blind to physics.</h2>
            <p className="about-desc">
              Urban heat islands keep getting worse in exactly the neighborhoods that need cooling most, and most of the AI models used to plan around them ignore the underlying physics of heat transfer entirely. A model can look accurate on a validation set and still be quietly wrong about the mechanism, which means the plans it produces don&apos;t generalize past the data they were trained on.
            </p>
          </motion.div>

          {/* Section 2 */}
          <motion.div className="about-section" variants={itemVariants}>
            <h2 className="about-title">Blue infrastructure is monitored in isolation.</h2>
            <p className="about-desc">
              Algal blooms and rising turbidity are usually tracked as their own separate problem, disconnected from the heat data sitting right next to it. But water quality and land surface temperature move together — a co-location risk that gets missed entirely when the two are monitored on different systems by different teams.
            </p>
          </motion.div>

          {/* Section 3 */}
          <motion.div className="about-section" variants={itemVariants}>
            <h2 className="about-title">The data foundation itself is broken.</h2>
            <p className="about-desc">
              Optical satellites go blind under cloud cover — and the regions with the heaviest, most persistent cloud cover are disproportionately the same regions where this risk monitoring matters most. Any system that only reads clear-sky optical imagery has a systematic blind spot exactly where it can least afford one.
            </p>
          </motion.div>
        </motion.div>

        {/* Hackathon Context Card */}
        <motion.div 
          className="hackathon-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
            <Target className="text-[var(--cobalt-bright)]" size={24} />
            <h3 style={{ fontFamily: "var(--sans)", fontSize: "24px", fontWeight: 600, color: "var(--text)" }}>
              Hackathon Context: RIT IEEE HACKNOVA &apos;26
            </h3>
          </div>
          
          <p style={{ color: "var(--text-2)", fontSize: "16px", lineHeight: 1.8, marginBottom: "24px" }}>
            ClimaLenz was architected specifically for <strong>HACKNOVA &apos;26</strong> to solve problem statement <strong>SD-40</strong>. Aligned with <strong>UN SDG 11: Sustainable Cities and Communities</strong>, this platform proves that Smart City infrastructure requires deterministic intelligence, not just LLM wrappers.
          </p>

          <div style={{ padding: "20px", background: "#000", borderRadius: "8px", border: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--sans)", fontSize: "16px", fontWeight: 500, color: "var(--text)", marginBottom: "8px" }}>
              The ClimaLenz Solution
            </div>
            <p style={{ color: "var(--text-3)", fontSize: "14px", lineHeight: 1.6 }}>
              A co-location risk engine: three physics-constrained models — <strong>Continuity, Water, and Heat</strong> — fused with a radar-optical reconstruction layer that stays usable through cloud cover, and read out by Gemini agents that are governed by strict mathematical audits to guarantee zero hallucinations.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}