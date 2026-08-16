"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, GitBranch, Scale, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <motion.section 
      className="cta-wrapper"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.8 }}
    >
      <div className="cta-card">
        
        {/* Top Kicker */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Sparkles className="w-4 h-4 text-[var(--cobalt-bright)]" />
          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.2em", color: "var(--cobalt-bright)", textTransform: "uppercase" }}>
            OPEN SOURCE &amp; READY TO DEPLOY
          </span>
        </div>

        {/* Main Heading */}
        <h2 style={{ fontFamily: "var(--sans)", fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px", maxWidth: "800px" }}>
          Audit any ecosystem on Earth. <br />
          <em style={{ fontFamily: "var(--serif)", color: "var(--cobalt-bright)", fontStyle: "italic", fontWeight: 400 }}>Zero computed hallucinations.</em>
        </h2>

        {/* Description */}
        <p style={{ color: "var(--text-2)", fontSize: "16px", lineHeight: 1.6, maxWidth: "620px", marginBottom: "36px" }}>
          Reconstruct cloud-blind satellite scenes, evaluate thermodynamic heat flux with physics constraints, and audit agentic climate insights—all backed by pure deterministic mathematics.
        </p>

        {/* Action Buttons Row */}
        <div className="cta-actions" style={{ marginBottom: "32px" }}>
          <Link href="/planner" className="cta-btn-primary">
            Launch Planner <ArrowRight size={16} />
          </Link>

          <a 
            href="https://github.com/dharshansri2007/ClimaLenz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cta-btn-secondary"
          >
            {/* Swapped Github for GitBranch here */}
            <GitBranch size={16} /> View GitHub Repository
          </a>
        </div>

        {/* MIT License & Open Source Footer Note */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
          <Scale size={14} className="text-[var(--text-4)]" />
          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-4)", letterSpacing: "0.05em" }}>
            Released under the <strong style={{ color: "var(--text-3)" }}>MIT License</strong> • Free for academic, commercial, and ecological research.
          </span>
        </div>

      </div>
    </motion.section>
  );
}