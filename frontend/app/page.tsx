import HeroScene from "../components/landing/HeroScene";
import DotMatrix from "../components/design/dot-matrix";
import MechanismStack from "../components/landing/MechanismStack";
import ContinuityNodeMatrix from "../components/landing/ContinuityNodeMatrix";
import WaterEngineSection from "../components/landing/WaterEngineSection";
import HeatEngineSection from "../components/landing/HeatEngineSection";

export default function LandingPage() {
  return (
    <>
      <DotMatrix />
      <HeroScene />
      
      <MechanismStack />
      
      <div className="relative z-20 w-full" style={{ backgroundColor: "var(--ink)" }}>
        < ContinuityNodeMatrix/>
        <WaterEngineSection />
        
        {/* NEW: The Mathematical Cage */}
        <HeatEngineSection />
      </div>
    </>
  );
}