import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center pt-16">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Разрабатываем цифровые продукты
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Веб-приложения, мобильные приложения, автоматизация бизнеса
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg">Обсудить проект</Button>
          <Button variant="outline" size="lg">Смотреть работы</Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
