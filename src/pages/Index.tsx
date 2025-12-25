import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Solutions from "@/components/Solutions";
import ProblemsAndSolutions from "@/components/ProblemsAndSolutions";
import Process from "@/components/Process";
import Capabilities from "@/components/Capabilities";
import Portfolio from "@/components/Portfolio";
import Pricing from "@/components/Pricing";
import ROICalculator from "@/components/ROICalculator";
import Results from "@/components/Results";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Global Effects */}
      <MouseGradient />
      <ClickRipple />
      
      <Header />
      <main>
        <Hero />
        <Solutions />
        <ProblemsAndSolutions />
        <Process />
        <Capabilities />
        <Portfolio />
        <Pricing />
        <ROICalculator />
        <Results />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;