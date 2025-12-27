import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-foreground">
          OWNDEV
        </a>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">
            Услуги
          </a>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
            О нас
          </a>
          <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Контакты
          </a>
        </nav>

        <Button>Связаться</Button>
      </div>
    </header>
  );
};

export default Header;
