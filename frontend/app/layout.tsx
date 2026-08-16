import type { Metadata } from "next";
import "./globals.css";
import "./climalenz-design.css";

export const metadata: Metadata = {
  title: "ClimaLenz | Deterministic Ecological Intelligence",
  description: "Map climate risk with mathematical certainty.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}