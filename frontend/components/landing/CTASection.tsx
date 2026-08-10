import Link from "next/link";
import Reveal from "@/components/design/Reveal";

export default function CTASection({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  return (
    <section id="cta" className="section divider-top">
      <div className="container-lenz text-center">
        <Reveal>
          <p
            className="text-lg sm:text-xl mb-8"
            style={{ color: "var(--text-2)" }}
          >
            See the risk score before you build on it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/sign-in"}
              className="btn btn-filled"
            >
              {isAuthenticated ? "Open Dashboard" : "Sign In"}
            </Link>
            <a
              href="/pitch-deck.pdf"
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Pitch Deck
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
