import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import SolutionCard from "@/components/solutions/SolutionCard";
import ExpandedSolutionCard from "@/components/solutions/ExpandedSolutionCard";
import { solutions } from "@/components/solutions/solutionsData";
import AnimatedText from "@/components/ui/animated-text";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { StaggerContainer, StaggerItem } from "@/components/ui/stagger-container";

const Solutions = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedSolution = solutions.find(s => s.id === selectedId);

  // Block scroll when modal is open
  useEffect(() => {
    if (selectedId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedId]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <section className="py-24 px-4 md:px-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/50 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            <AnimatedText text="Наши" />{" "}
            <span className="text-gradient">
              <AnimatedText text="решения" delay={0.2} />
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Полный спектр услуг веб-разработки для вашего бизнеса
          </p>
        </ScrollReveal>

        {/* BentoGrid - Desktop with staggered animation */}
        <StaggerContainer 
          className="hidden md:block"
          staggerDelay={0.1}
          delayChildren={0.2}
          viewport={{ margin: "-100px" }}
        >
          <BentoGrid>
            {solutions.map((solution, index) => (
              <StaggerItem 
                key={solution.id}
                className={`${solution.colSpan === 2 ? 'md:col-span-2' : ''} ${solution.rowSpan === 2 ? 'md:row-span-2' : ''}`}
              >
                <BentoGridItem 
                  colSpan={solution.colSpan}
                  rowSpan={solution.rowSpan}
                  index={index}
                >
                  <SolutionCard 
                    solution={solution} 
                    index={index}
                    onClick={() => setSelectedId(solution.id)}
                  />
                </BentoGridItem>
              </StaggerItem>
            ))}
          </BentoGrid>
        </StaggerContainer>

        {/* Cards Scroll - Mobile with staggered animation */}
        <StaggerContainer 
          className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
          staggerDelay={0.08}
          delayChildren={0.1}
        >
          {solutions.map((solution, index) => (
            <StaggerItem 
              key={solution.id} 
              className="snap-start shrink-0 w-[85vw]"
            >
              <SolutionCard 
                solution={solution} 
                index={index}
                onClick={() => setSelectedId(solution.id)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {selectedId && selectedSolution && (
          <ExpandedSolutionCard 
            solution={selectedSolution}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default Solutions;
