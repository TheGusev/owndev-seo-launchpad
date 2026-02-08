import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ScrollStacksSection from "@/components/ScrollStacksSection";
import Portfolio from "@/components/Portfolio";
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
        <ScrollStacksSection />
        <Portfolio />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
