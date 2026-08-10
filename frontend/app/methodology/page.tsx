"use client";

import { useState } from "react";
import Reveal from "@/components/design/Reveal";

type Index = {
  key: string;
  name: string;
  formula: string;
  meaning: string;
};

const INDICES: Index[] = [
  {
    key: "ndwi",
    name: "NDWI",
    formula: "(Green − NIR) / (Green + NIR)",
    meaning: "Tells us where water actually is.",
  },
  {
    key: "mndwi",
    name: "MNDWI",
    formula: "(Green − SWIR) / (Green + SWIR)",
    meaning: "Same idea, trustworthy in urban contexts.",
  },
  {
    key: "ndti",
    name: "NDTI",
    formula: "(Red − Green) / (Red + Green)",
    meaning: "Turbidity — how murky the water looks.",
  },
  {
    key: "ndci",
    name: "NDCI",
    formula: "(RedEdge1 − Red) / (RedEdge1 + Red)",
    meaning: "Chlorophyll proxy, early algal-bloom warning.",
  },
  {
    key: "ndvi",
    name: "NDVI",
    formula: "(NIR − Red) / (NIR + Red)",
    meaning: "Vegetation health / albedo proxy.",
  },
  {
    key: "wri",
    name: "WRI",
    formula: "(Green + Red) / (NIR + SWIR)",
    meaning: "Second water-vs-land moisture signal.",
  },
];

export default function MethodologyPage() {
  const [active, setActive] = useState<string>(INDICES[0].key);
  const current = INDICES.find((i) => i.key === active)!;

  return (
    <main className="section divider-top">
      <div className="container-lenz max-w-5xl">
        <Reveal>
          <p
            className="font-mono text-xs tracking-[0.18em] mb-4"
            style={{ color: "var(--text-3)" }}
          >
            METHODOLOGY
          </p>
          <h1
            className="text-4xl sm:text-5xl font-semibold tracking-tight mb-14"
            style={{ color: "var(--text)" }}
          >
            The math behind the score
          </h1>
        </Reveal>

        {/* Index cards: left list of indices, right panel shows
            formula + one-line meaning on selection — interaction
            pattern borrowed from AquaLens, styling stays ClimaLenz's
            own dark-terminal/cream aesthetic, not AquaLens's teal. */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 mb-24">
            <div
              className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible"
              style={{ borderRight: "1px solid var(--line)" }}
            >
              {INDICES.map((idx) => (
                <button
                  key={idx.key}
                  onClick={() => setActive(idx.key)}
                  className="text-left font-mono text-sm tracking-wide px-4 py-3 rounded-md transition-colors whitespace-nowrap md:whitespace-normal"
                  style={{
                    color: active === idx.key ? "var(--cobalt)" : "var(--text-3)",
                    background:
                      active === idx.key ? "var(--cobalt-soft)" : "transparent",
                  }}
                >
                  {idx.name}
                </button>
              ))}
            </div>

            <div
              className="rounded-xl p-8"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow-1)",
              }}
            >
              <p
                className="font-mono text-2xl mb-6"
                style={{ color: "var(--cobalt)" }}
              >
                {current.name}
              </p>
              <p
                className="font-mono text-base mb-6 p-4 rounded-md"
                style={{
                  color: "var(--text)",
                  background: "var(--surface-2)",
                }}
              >
                {current.formula}
              </p>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
                {current.meaning}
              </p>
            </div>
          </div>
        </Reveal>

        {/* PINN loss function */}
        <Reveal>
          <section
            className="pt-16"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: "var(--text)" }}
            >
              Physics-informed loss function
            </h2>
            <p
              className="font-mono text-lg mb-6 p-4 rounded-md inline-block"
              style={{ color: "var(--text)", background: "var(--surface-2)" }}
            >
              L_Total = L_Data + λ · L_Physics
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
              <div>
                <p
                  className="font-mono text-sm mb-2"
                  style={{ color: "var(--cobalt)" }}
                >
                  L_Data
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-2)" }}
                >
                  Penalizes the model whenever its prediction disagrees with
                  actual observed sensor readings — the standard supervised
                  error term.
                </p>
              </div>
              <div>
                <p
                  className="font-mono text-sm mb-2"
                  style={{ color: "var(--cobalt)" }}
                >
                  λ · L_Physics
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-2)" }}
                >
                  Penalizes the model whenever its prediction violates the
                  known governing physics — e.g. heat transfer or
                  conservation constraints — regardless of how well it fits
                  the observed data. This is what keeps predictions
                  physically plausible outside the training distribution.
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Confidence score for reconstructed pixels */}
        <Reveal>
          <section
            className="pt-16 mt-16"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: "var(--text)" }}
            >
              Confidence score for reconstructed pixels
            </h2>
            <p
              className="text-base leading-relaxed max-w-2xl"
              style={{ color: "var(--text-2)" }}
            >
              Where optical data is cloud-obscured, the radar-optical
              reconstruction layer fills the gap and attaches a per-pixel
              confidence score based on how far that pixel is — in space and
              time — from the nearest clear-sky observation used to
              calibrate it. Low-confidence pixels are flagged in the
              output rather than presented with the same certainty as
              directly observed ones.
            </p>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
