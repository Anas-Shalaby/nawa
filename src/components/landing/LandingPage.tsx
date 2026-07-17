import { getTranslations } from "next-intl/server";
import { LandingThemeProvider } from "./LandingThemeProvider";
import { LandingNav } from "./LandingNav";
import { HeroSection } from "./hero/HeroSection";
import { ClinicChaosStory } from "./ClinicChaosStory";
import { DoctorOutcomesSection } from "./DoctorOutcomesSection";
import { BeforeAfterSection } from "./BeforeAfterSection";
import { ProblemSolutionBento } from "./ProblemSolutionBento";
import { MorningInsightsSection } from "./MorningInsightsSection";
import { ClinicWorkflowTour } from "./ClinicWorkflowTour";
import { ProductProofSection } from "./ProductProofSection";
import { PricingSection } from "./PricingSection";
import { FinalCTASection } from "./FinalCTASection";
import { LandingFooter } from "./LandingFooter";

export async function LandingPage() {
  const t = await getTranslations("landing.nav");

  return (
    <LandingThemeProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("skip")}
      </a>
      <div className="landing-page-glow pointer-events-none fixed inset-0" aria-hidden />
      <LandingNav />
      <main id="main-content" className="relative">
        <HeroSection />
        <ClinicChaosStory />
        <DoctorOutcomesSection />
        <BeforeAfterSection />
        <ProblemSolutionBento />
        <MorningInsightsSection />
        <ClinicWorkflowTour />
        <ProductProofSection />
        <PricingSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </LandingThemeProvider>
  );
}
