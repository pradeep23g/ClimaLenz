import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./climalenz-design.css";
import DesignNav from "../components/design/DesignNav";
import DesignFooter from "../components/design/DesignFooter";

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
      <body className="climalenz-design">
        <DesignNav />
        
        <main>{children}</main>
        
        <DesignFooter />

        {/* 1. THE FIX: Load the Three.js Engine FIRST */}
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" 
          strategy="beforeInteractive" 
        />
        
        {/* 2. Then load our custom ClimaLenz globe logic */}
        <Script 
          src="/climalenz-design/globe-v2.js" 
          strategy="beforeInteractive" 
        />
      </body>
    </html>
  );
}