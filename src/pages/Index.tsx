import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Solutions from "@/components/Solutions";
import GlobalSection from "@/components/GlobalSection";
import TechCards from "@/components/TechCards";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
import CustomCursor from "@/components/ui/custom-cursor";
import MouseGradient from "@/components/ui/mouse-gradient";

const Index = () => {
  const [isLoading, setIsLoading] = useState(() => {
    // Show preloader only on first visit per session
    return !sessionStorage.getItem("preloader-shown");
  });

  // Block scroll during loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  const handlePreloaderComplete = () => {
    sessionStorage.setItem("preloader-shown", "true");
    setIsLoading(false);
  };

  return (
    <>
      <CustomCursor />
      <MouseGradient />
      
      <AnimatePresence mode="wait">
        {isLoading && <Preloader onComplete={handlePreloaderComplete} />}
      </AnimatePresence>

      <div className="min-h-screen bg-background relative">
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
    </>
  );
};

export default Index;