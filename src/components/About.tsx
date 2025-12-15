import { CheckCircle2 } from "lucide-react";

const features = [
  "Индивидуальный подход к каждому проекту",
  "Прозрачная отчётность и аналитика",
  "Гибкие условия сотрудничества",
  "Команда сертифицированных специалистов",
  "Использование современных технологий",
  "Гарантия качества и результата",
];

const About = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_right,hsl(174_72%_56%/0.1),transparent_60%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <span className="text-primary font-mono text-sm tracking-wider uppercase">О компании</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Почему выбирают <span className="text-gradient">OWNDEV</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Мы — команда экспертов в области SEO и разработки, которая превращает идеи в успешные цифровые продукты. 
              Наш опыт позволяет создавать решения, которые работают.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right visual */}
          <div className="relative">
            <div className="glass rounded-3xl p-8 relative">
              {/* Code-like decoration */}
              <div className="font-mono text-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">const</span>
                  <span className="text-primary">owndev</span>
                  <span className="text-muted-foreground">=</span>
                  <span className="text-secondary">{"{"}</span>
                </div>
                <div className="pl-4 space-y-2">
                  <div>
                    <span className="text-primary">seo:</span>
                    <span className="text-foreground ml-2">"TOP-10 гарантия"</span>
                    <span className="text-muted-foreground">,</span>
                  </div>
                  <div>
                    <span className="text-primary">development:</span>
                    <span className="text-foreground ml-2">"SaaS, Web, Mobile"</span>
                    <span className="text-muted-foreground">,</span>
                  </div>
                  <div>
                    <span className="text-primary">quality:</span>
                    <span className="text-foreground ml-2">"Premium"</span>
                    <span className="text-muted-foreground">,</span>
                  </div>
                  <div>
                    <span className="text-primary">support:</span>
                    <span className="text-foreground ml-2">"24/7"</span>
                  </div>
                </div>
                <div>
                  <span className="text-secondary">{"}"}</span>
                  <span className="text-muted-foreground">;</span>
                </div>
              </div>
              
              {/* Glowing accent */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
            </div>
            
            {/* Floating badge */}
            <div className="absolute -top-6 -right-6 glass px-4 py-2 rounded-xl animate-float">
              <span className="text-primary font-bold">150+</span>
              <span className="text-muted-foreground ml-2">проектов</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
