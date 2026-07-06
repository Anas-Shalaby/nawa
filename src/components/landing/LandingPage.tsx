import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { BentoFeaturesSection } from "./BentoFeaturesSection";
import { ValuePropositionSection } from "./ValuePropositionSection";
import { PricingSection } from "./PricingSection";
import { LandingFooter } from "./LandingFooter";
import { LandingThemeProvider } from "./LandingThemeProvider";

export function LandingPage() {
  return (
    <LandingThemeProvider>
      <div
        className="landing-page-glow pointer-events-none fixed inset-0"
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
    </LandingThemeProvider>
  );
}
