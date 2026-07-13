import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { ProblemAgitationSection } from "./ProblemAgitationSection";
import { ROICalculatorSection } from "./ROICalculatorSection";
import { BentoFeaturesSection } from "./BentoFeaturesSection";
import { TrustSection } from "./TrustSection";
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
      <main className="relative" dir="rtl">
        <HeroSection />
        <ProblemAgitationSection />
        <ROICalculatorSection />
        <BentoFeaturesSection />
        <TrustSection />
        <ValuePropositionSection />
        <PricingSection />
      </main>
      <LandingFooter />
    </LandingThemeProvider>
  );
}
