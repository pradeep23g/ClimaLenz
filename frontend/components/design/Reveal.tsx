"use client";

import { useScrollReveal } from "@/components/design/ScrollReveal";

/**
 * Thin wrapper around the useScrollReveal hook from ScrollReveal.tsx,
 * for places that just want "wrap this block, reveal it on scroll"
 * without writing the ref/style boilerplate inline every time.
 */
export default function Reveal({
  children,
  className,
  ...options
}: {
  children: React.ReactNode;
  className?: string;
} & Parameters<typeof useScrollReveal>[0]) {
  const { ref, style } = useScrollReveal<HTMLDivElement>(options);
  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}