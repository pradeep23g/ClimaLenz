export default function StatBand() {
  const items = [
    "3 ENGINES",
    "6 SPECTRAL INDICES",
    "PHYSICS-CONSTRAINED",
    "HONEST AI",
  ];

  return (
    <div className="container-lenz">
      <div
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-6 text-center"
        style={{
          borderTop: "none",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {items.map((item, i) => (
          <span key={item} className="flex items-center gap-3">
            <span
              className="font-mono text-[11px] sm:text-xs tracking-[0.18em]"
              style={{ color: "var(--text-3)" }}
            >
              {item}
            </span>
            {i < items.length - 1 && (
              <span aria-hidden="true" style={{ color: "var(--line-2)" }}>
                ·
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
