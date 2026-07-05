import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { BentoFeaturesSection } from "./BentoFeaturesSection";
import { ValuePropositionSection } from "./ValuePropositionSection";
import { PricingSection } from "./PricingSection";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-primary">
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(108,92,231,0.06),transparent_28%)]"
        aria-hidden
      />
      <LandingNav />
      <main className="relative">
        <HeroSection />
        <BentoFeaturesSection />
        <ValuePropositionSection />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
