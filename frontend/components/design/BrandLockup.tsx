import Link from "next/link";

export default function BrandLockup({
  size = "md",
}: {
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? 20 : 26;

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 group"
      aria-label="ClimaLenz — home"
    >
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="var(--cobalt)"
          strokeWidth="1.5"
        />
        <ellipse
          cx="16"
          cy="16"
          rx="14"
          ry="5.5"
          stroke="var(--cobalt-bright)"
          strokeWidth="1"
          opacity="0.6"
        />
        <circle cx="16" cy="16" r="2.5" fill="var(--cobalt)" />
      </svg>
      <span
        className="font-mono text-sm tracking-[0.08em] font-medium transition-colors"
        style={{ color: "var(--text)" }}
      >
        CLIMA<span style={{ color: "var(--cobalt)" }}>LENZ</span>
      </span>
    </Link>
  );
}
