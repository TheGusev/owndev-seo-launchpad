import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ServicesTeaser from "@/components/ServicesTeaser";
import ToolsShowcase from "@/components/ToolsShowcase";
import AboutSection from "@/components/AboutSection";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import BlogPreview from "@/components/BlogPreview";
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
        <ToolsShowcase />
        <AboutSection />
        <BlogPreview />
        <FAQ />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
