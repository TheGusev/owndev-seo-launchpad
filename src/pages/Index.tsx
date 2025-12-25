import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Solutions from "@/components/Solutions";
import GlobalSection from "@/components/GlobalSection";
import TechCards from "@/components/TechCards";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Solutions />
        <GlobalSection />
        <TechCards />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;