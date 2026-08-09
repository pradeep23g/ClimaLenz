import HeroScene from "../components/landing/HeroScene";
import DotMatrix from "../components/design/dot-matrix";

export default function LandingPage() {
  return (
    <>
      {/* The active telemetry background */}
      <DotMatrix />
      
      {/* The 3D Globe and Headline */}
      <HeroScene />
      
      {/* We will build the Mechanism Stack & Evidence Rows and drop them here next */}
    </>
  );
}