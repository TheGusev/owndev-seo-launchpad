import Header from "@/components/Header/Header";
import Hero from "@/components/Hero/Hero";
import SolutionsSection from "@/components/Solutions/SolutionsSection";
import WorldSection from "@/components/World/WorldSection";
import CTASection from "@/components/CTA/CTASection";
import Footer from "@/components/Footer/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <SolutionsSection />
        <WorldSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
