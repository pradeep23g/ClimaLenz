import HeroScene from "../components/landing/HeroScene";
import DotMatrix from "../components/design/dot-matrix";
import MechanismStack from "../components/landing/MechanismStack";
import ContinuitySlider from "../components/landing/ContinuitySlider";

export default function LandingPage() {
  return (
    <>
      <DotMatrix />
      <HeroScene />
      
      <MechanismStack />
      
      {/* Continuity Engine Interactive Demo */}
      <div className="wrap relative z-10">
        <ContinuitySlider />
      </div>
    </>
  );
}