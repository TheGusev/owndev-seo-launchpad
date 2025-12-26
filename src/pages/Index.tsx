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
import ScrollProgress from "@/components/ui/scroll-progress";
import PageTransition from "@/components/ui/page-transition";
import { useTouchDevice, isTouchDevice } from "@/hooks/use-touch-device";

const Index = () => {
  const isMobile = useTouchDevice();
  
  const [isLoading, setIsLoading] = useState(() => {
    // Skip preloader on mobile for instant load
    if (isTouchDevice()) return false;
    // Skip if already shown this session
    if (typeof window !== "undefined" && sessionStorage.getItem("preloader-shown")) {
      return false;
    }
    return true;
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
      {/* Only show cursor effects on desktop */}
      {!isMobile && (
        <>
          <CustomCursor />
          <MouseGradient />
        </>
      )}
      <ScrollProgress />
      
      <AnimatePresence mode="wait">
        {isLoading && <Preloader onComplete={handlePreloaderComplete} />}
      </AnimatePresence>

      <PageTransition>
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
      </PageTransition>
    </>
  );
};

export default Index;