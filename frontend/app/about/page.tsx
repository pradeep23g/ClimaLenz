import Reveal from "@/components/design/Reveal";

export const metadata = {
  title: "About — ClimaLenz",
  description:
    "Why ClimaLenz exists: the co-location risk that green and blue infrastructure planning miss.",
};

export default function AboutPage() {
  return (
    <main className="section divider-top">
      <div className="container-lenz max-w-3xl">
        <Reveal>
          <p
            className="font-mono text-xs tracking-[0.18em] mb-4"
            style={{ color: "var(--text-3)" }}
          >
            ABOUT
          </p>
          <h1
            className="text-4xl sm:text-5xl font-semibold tracking-tight mb-14"
            style={{ color: "var(--text)" }}
          >
            The problem we started with
          </h1>
        </Reveal>

        <div className="flex flex-col gap-12">
          <Reveal>
            <section>
              <h2
                className="text-xl font-semibold mb-3"
                style={{ color: "var(--text)" }}
              >
                Green infrastructure is planned blind to physics
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                Urban heat islands keep getting worse in exactly the
                neighborhoods that need cooling most, and most of the AI
                models used to plan around them ignore the underlying
                physics of heat transfer entirely. A model can look
                accurate on a validation set and still be quietly wrong
                about the mechanism, which means the plans it produces
                don&apos;t generalize past the data they were trained on.
              </p>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <h2
                className="text-xl font-semibold mb-3"
                style={{ color: "var(--text)" }}
              >
                Blue infrastructure is monitored in isolation
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                Algal blooms and rising turbidity are usually tracked as
                their own separate problem, disconnected from the heat data
                sitting right next to it. But water quality and land
                surface temperature move together — a co-location risk
                that gets missed entirely when the two are monitored on
                different systems by different teams.
              </p>
            </section>
          </Reveal>

          <Reveal>
            <section>
              <h2
                className="text-xl font-semibold mb-3"
                style={{ color: "var(--text)" }}
              >
                The data foundation itself is broken
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                Optical satellites go blind under cloud cover — and the
                regions with the heaviest, most persistent cloud cover are
                disproportionately the same regions where this risk
                monitoring matters most. Any system that only reads clear-
                sky optical imagery has a systematic blind spot exactly
                where it can least afford one.
              </p>
            </section>
          </Reveal>

          <Reveal>
            <section
              className="pt-8 mt-4"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              <p
                className="text-lg sm:text-xl leading-relaxed font-medium"
                style={{ color: "var(--text)" }}
              >
                ClimaLenz is a co-location risk engine: three
                physics-constrained models — Continuity, Water, and Heat —
                fused with a radar-optical reconstruction layer that stays
                usable through cloud cover, and read out by agents that are
                never allowed to compute a number themselves.
              </p>
            </section>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
