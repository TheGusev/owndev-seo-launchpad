import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(174_72%_56%/0.15),transparent_60%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="glass rounded-3xl p-8 md:p-16 text-center max-w-4xl mx-auto relative overflow-hidden">
          {/* Background accents */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          
          <div className="relative z-10">
            <span className="text-primary font-mono text-sm tracking-wider uppercase">Контакты</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Готовы начать <span className="text-gradient">проект</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              Свяжитесь с нами для бесплатной консультации. Мы обсудим ваши цели и предложим оптимальное решение.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button variant="hero" size="xl">
                Обсудить проект
                <ArrowRight className="ml-2" />
              </Button>
              <Button variant="glass" size="xl">
                Получить оценку
              </Button>
            </div>
            
            {/* Contact options */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="mailto:hello@owndev.ru" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-5 h-5" />
                <span>hello@owndev.ru</span>
              </a>
              <a href="tel:+79001234567" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-5 h-5" />
                <span>+7 900 123-45-67</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>Telegram</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
