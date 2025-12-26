import { ArrowRight, MessageCircle, Clock } from "lucide-react";
import { Button } from "./ui/button";
import MagneticButton from "./ui/magnetic-button";
import AnimatedText from "@/components/ui/animated-text";
import ClickRipple from "@/components/ui/click-ripple";
import ScrollReveal from "@/components/ui/scroll-reveal";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main heading */}
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              <AnimatedText text="Готовы" />{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                <AnimatedText text="начать проект" delay={0.15} />
              </span>
              <AnimatedText text="?" delay={0.4} />
            </h2>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal delay={0.1}>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Обсудим вашу идею и предложим лучшее решение для вашего бизнеса
            </p>
          </ScrollReveal>

          {/* CTA Button */}
          <ScrollReveal delay={0.2} className="mb-8">
            <MagneticButton strength={0.2}>
              <ClickRipple>
                <Button variant="hero" size="xl" className="group">
                  Получить консультацию
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </ClickRipple>
            </MagneticButton>
          </ScrollReveal>

          {/* Additional info */}
          <ScrollReveal delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>Бесплатная консультация</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Ответ в течение часа</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
