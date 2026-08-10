import Reveal from "@/components/design/Reveal";
import { StaggerReveal } from "@/components/design/ScrollReveal";

const SOURCES = [
  {
    name: "ISRO MOSDAC",
    feeds:
      "INSAT-3D/3DR Land Surface Temperature, feeds the Heat Engine",
  },
  {
    name: "ISRO Bhuvan",
    feeds: "Land Use/Land Cover classification, feeds static context layers",
  },
  {
    name: "Sentinel-1 SAR",
    feeds: "Cloud-penetrating radar, feeds the Continuity Engine's reconstruction",
  },
  {
    name: "Sentinel-2 / Planetary Computer",
    feeds: "Optical multispectral imagery, feeds the Water Engine's band math",
  },
];

export default function EvidenceRow() {
  return (
    <section id="evidence" className="section divider-top">
      <div className="container-lenz">
        <Reveal>
          <p
            className="font-mono text-xs tracking-[0.18em] mb-10"
            style={{ color: "var(--text-3)" }}
          >
            DATA FOUNDATION
          </p>
        </Reveal>

        <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {SOURCES.map((s) => (
            <div key={s.name} className="flex flex-col gap-2">
              <span
                className="font-mono text-sm tracking-[0.02em]"
                style={{ color: "var(--cobalt)" }}
              >
                {s.name}
              </span>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                {s.feeds}
              </p>
            </div>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
