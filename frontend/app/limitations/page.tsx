import Reveal from "@/components/design/Reveal";

export const metadata = {
  title: "Limitations — ClimaLenz",
  description: "What ClimaLenz honestly cannot yet claim.",
};

const OPEN_LIMITATIONS = [
  {
    title: "Cloud-removal calibration is unproven at scale",
    body:
      "The radar-optical reconstruction layer has been validated on the current AOI set, not at national or continental scale. Confidence scores on reconstructed pixels should be read as a per-region estimate, not a universal guarantee.",
  },
  {
    title: "Small training-set size",
    body:
      "73 samples across 3 AOIs. That's enough to demonstrate the approach works, not enough to claim it generalizes to arbitrary geographies or climates without further validation.",
  },
  {
    title: "No held-out test set separate from validation",
    body:
      "Current evaluation reuses the validation split for final numbers. A genuinely held-out test set, collected after model selection, is the next step before any accuracy claim should be treated as final.",
  },
];

export default function LimitationsPage() {
  return (
    <main className="section divider-top">
      <div className="container-lenz max-w-3xl">
        <Reveal>
          <p
            className="font-mono text-xs tracking-[0.18em] mb-4"
            style={{ color: "var(--text-3)" }}
          >
            LIMITATIONS
          </p>
          <h1
            className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4"
            style={{ color: "var(--text)" }}
          >
            What we don&apos;t claim
          </h1>
          <p
            className="text-base mb-14 max-w-xl"
            style={{ color: "var(--text-3)" }}
          >
            An honest system says what it doesn&apos;t know. This page is
            kept current — it reflects what&apos;s actually still open in
            the live demo, not a stale list from an earlier build.
          </p>
        </Reveal>

        <div className="flex flex-col gap-10">
          {OPEN_LIMITATIONS.map((item) => (
            <Reveal key={item.title}>
              <section
                className="pb-10"
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <h2
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text)" }}
                >
                  {item.title}
                </h2>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--text-2)" }}
                >
                  {item.body}
                </p>
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}

/* Resolved, deliberately not listed above:
   - Physicist Agent bound safety — hardcoded numeric bounds now
     exist and are covered by test_stress.py.
   - Env-var / wiring bugs from the earlier build — fixed.
   If either regresses, add it back here rather than silently
   dropping it — this page's credibility depends on staying accurate
   against whatever the live demo actually does today. */
