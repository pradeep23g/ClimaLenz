"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const LAYERS = [
  {
    tag: "LAYER 00",
    name: "CONTINUITY ENGINE",
    axis: "Cloud-blind",
    detail: "Sentinel-2 x Sentinel-1 SAR · generative cloud-penetrating radar",
    price: "96% conf",
    layerClass: "l1",
  },
  {
    tag: "LAYER 01",
    name: "WATER ENGINE",
    axis: "Zero AI",
    detail: "NDWI · MNDWI · NDTI · NDCI · pure deterministic band math",
    price: "0-100 risk",
    layerClass: "l2",
  },
  {
    tag: "LAYER 02",
    name: "HEAT ENGINE",
    axis: "Physics-bound",
    detail: "PyTorch PINN · constrained by actual thermodynamic loss",
    price: "L_data + λ·L_phys",
    layerClass: "l3",
  },
  {
    tag: "LAYER 03",
    name: "AGENTIC BRIDGE",
    axis: "Honest AI",
    detail: "Historian · Reporter · Co-pilot · zero computed hallucinations",
    price: "Verified",
    layerClass: "l4",
  },
];

export default function MechanismStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track the scroll progress through this specific section.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Update the right-hand nav rail based on scroll depth
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    let idx = Math.floor(latest * 4);
    if (idx > 3) idx = 3;
    setActiveIndex(idx);
  });

  return (
    <section 
      className="mech-scene section divider-top" 
      id="mechanism" 
      ref={containerRef}
      style={{ height: "300vh" }}
    >
      <div className="wrap h-full relative">
        <div className="mech-pin" style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
          
          {/* ─── FIX: Pulled top from 20% to 8% to prevent collisions ─── */}
          <div style={{ position: "absolute", left: "0.5%", top: "0.15%", maxWidth: "3600px", zIndex: 10 }}>
            <div 
              style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.1em", color: "var(--cobalt-bright)", marginBottom: "16px" }}
            >
              ● THE MECHANISM
            </div>
            <h2 
              style={{ fontFamily: "var(--sans)", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 600, color: "var(--text)", lineHeight: 1.1, marginBottom: "16px", letterSpacing: "-0.02em" }}
            >
              The anatomy of <br />
              <em style={{ fontFamily: "var(--serif)", color: "var(--cobalt-bright)", fontStyle: "italic", fontWeight: 400 }}>
                ClimaLenz.
              </em>
            </h2>
            <p style={{ color: "var(--text-2)", fontSize: "15px", lineHeight: 1.6 }}>
             
            </p>
          </div>

          <motion.div
            className="mech-stack"
            style={{ "--p": scrollYProgress, marginTop: "12vh" } as any}
          >
            {LAYERS.map((layer, i) => (
              <div key={i} className={`mech-layer ${layer.layerClass}`}>
                <div className="ml-head">
                  <span className="ml-tag">{layer.tag}</span>
                  <span className="ml-name">{layer.name}</span>
                </div>
                <div className="ml-body">
                  <span className="ml-axis">{layer.axis}</span>
                  <span className="ml-detail">{layer.detail}</span>
                </div>
                <div className="ml-price">
                  {layer.price}
                </div>
              </div>
            ))}
          </motion.div>

          <div className="mech-progress">
            {LAYERS.map((layer, i) => (
              <span key={i} className={i <= activeIndex ? "on" : ""}>
                {layer.name}
              </span>
            ))}
          </div>

          <div className="mech-caption">
            <strong>Scroll.</strong> The score you see is four layers deep. ClimaLenz peels them back.
          </div>

        </div>
      </div>
    </section>
  );
}