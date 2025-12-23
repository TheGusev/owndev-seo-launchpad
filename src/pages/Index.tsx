import Header from "@/components/Header";
import Hero from "@/components/Hero";
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
import { AuroraBackground } from "@/components/ui/digital-aurora";

const Index = () => {
  return (
    <AuroraBackground>
      <div className="min-h-screen scroll-smooth">
        <Header />
        <main>
          <Hero />
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
    </AuroraBackground>
  );
};

export default Index;
