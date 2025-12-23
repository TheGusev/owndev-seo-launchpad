import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProblemsAndSolutions from "@/components/ProblemsAndSolutions";
import Process from "@/components/Process";
import Capabilities from "@/components/Capabilities";
import Portfolio from "@/components/Portfolio";
import Pricing from "@/components/Pricing";
import Results from "@/components/Results";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Header />
      <main>
        <Hero />
        <ProblemsAndSolutions />
        <Process />
        <Capabilities />
        <Portfolio />
        <Pricing />
        <Results />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
