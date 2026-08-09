"use client";

import Link from "next/link";

export default function DesignFooter() {
  return (
    <footer className="footer" style={{ borderTop: "1px solid var(--line)", padding: "64px 0 40px" }}>
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="flex items-center gap-[11px] group mb-4">
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-[6px] border transition-colors"
              style={{ borderColor: "var(--cobalt-line)" }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: "var(--cobalt-bright)" }}>
                <circle cx="6" cy="6" r="4" fill="none" />
                <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.7" />
                <path d="M6 0 v2 M6 10 v2 M0 6 h2 M10 6 h2" />
              </svg>
            </span>
            <span
              className="font-mono uppercase transition-colors"
              style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "0.18em", color: "var(--text)" }}
            >
              CLIMALENZ
            </span>
          </Link>
          <p className="footer-desc" style={{ color: "var(--text-2)" }}>
            Deterministic multi-agent framework mapping heat and water risk with physics-informed certainty. Fully bounded. Zero hallucination.
          </p>
        </div>
        
        <nav className="footer-col">
          <span className="label-mono">Platform</span>
          <Link className="nav-link" href="/dashboard">Dashboard</Link>
          <Link className="nav-link" href="/methodology">Methodology</Link>
          <Link className="nav-link" href="/about">About</Link>
          <Link className="nav-link" href="/limitations">Limitations</Link>
        </nav>
        
        <nav className="footer-col">
          <span className="label-mono">Resources</span>
          <a className="nav-link" href="/deck/ClimaLenz-Pitch-Deck.pdf" target="_blank" rel="noopener noreferrer">Pitch Deck</a>
          <a className="nav-link" href="#">Architecture</a>
          <a className="nav-link" href="#">GitHub Repo</a>
          <a className="nav-link" href="#">Privacy</a>
        </nav>
      </div>
      
      <div className="wrap footer-bottom">
        <p className="footer-tag">
          Honest AI for Ecological Intelligence.
        </p>
        <span className="label-mono">© 2026 CLIMALENZ · all rights reserved</span>
      </div>
    </footer>
  );
}