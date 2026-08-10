import { Search, FileText, MessagesSquare } from "lucide-react";
import TacticalCard from "@/components/design/TacticalCard";
import Reveal from "@/components/design/Reveal";
import { StaggerReveal } from "@/components/design/ScrollReveal";

const AGENTS = [
  {
    number: "01",
    title: "Historian",
    desc:
      "google_search grounding — cross-references the engines' computed risk score against real, recent local news (flooding reports, drought coverage, municipal projects) near the AOI.",
    icon: Search,
    color: "cobalt" as const,
    statusCode: "GROUNDING_OK",
  },
  {
    number: "02",
    title: "Reporter",
    desc:
      "response_schema — translates pre-computed, pre-guardrailed JSON into a citizen or executive brief. Never recomputes a number: this is the zero-risk seam.",
    icon: FileText,
    color: "gold" as const,
    statusCode: "SCHEMA_LOCKED",
  },
  {
    number: "03",
    title: "Co-pilot",
    desc:
      "function calling — conversational front-end that parses natural language and calls the actual engine endpoints (heat what-if, water assessment, continuity repair, co-location) directly.",
    icon: MessagesSquare,
    color: "good" as const,
    statusCode: "AGENT_LIVE",
  },
];

export default function AgentsWorkflowSection() {
  return (
    <section id="agents" className="section divider-top">
      <div className="container-lenz">
        <Reveal>
          <h2
            className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3"
            style={{ color: "var(--text)" }}
          >
            Four agents. Zero computed hallucinations.
          </h2>
          <p
            className="text-base mb-14 max-w-xl"
            style={{ color: "var(--text-3)" }}
          >
            Every number on screen comes from a deterministic engine. The
            agents only read, translate, and act on it — never recompute it.
          </p>
        </Reveal>

        <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AGENTS.map((a) => (
            <TacticalCard
              key={a.number}
              number={a.number}
              title={a.title}
              desc={a.desc}
              icon={a.icon}
              color={a.color}
              statusCode={a.statusCode}
            />
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
