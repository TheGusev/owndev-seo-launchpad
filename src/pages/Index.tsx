import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WebStudioSection from "@/components/WebStudioSection";
import ToolsShowcase from "@/components/ToolsShowcase";
import TechShopSection from "@/components/TechShopSection";
import ScrollStacksSection from "@/components/ScrollStacksSection";
import CasesResults from "@/components/CasesResults";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth snap-container">
      <MouseGradient />
      <ClickRipple />
      
      <Header />
      <main>
        <Hero />
        <WebStudioSection />
        <ToolsShowcase />
        <TechShopSection />
        <ScrollStacksSection />
        <CasesResults />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
