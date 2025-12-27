import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { copy } from "@/content/copy";

const Header = () => {
  const [currentLang, setCurrentLang] = useState<"RU" | "EN">("RU");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a 
          href="/" 
          className="text-xl font-bold text-foreground focus-ring rounded"
          aria-label={`${copy.header.logo} - На главную`}
        >
          {copy.header.logo}
        </a>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Основная навигация">
          <Link href="#solutions" variant="muted">
            {copy.header.nav.solutions}
          </Link>
          <Link href="#world" variant="muted">
            {copy.header.nav.about}
          </Link>
          <Link href="#contact" variant="muted">
            {copy.header.nav.contact}
          </Link>
        </nav>

        {/* Right side: Language switcher + CTA */}
        <div className="flex items-center gap-4">
          {/* Language switcher */}
          <div className="flex gap-1" role="group" aria-label="Выбор языка">
            {copy.header.languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setCurrentLang(lang)}
                aria-pressed={currentLang === lang}
                className={`
                  min-h-[44px] min-w-[44px] px-3
                  text-sm font-medium rounded-lg
                  transition-colors duration-200
                  focus-ring
                  ${currentLang === lang 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* CTA Button - hidden on mobile */}
          <Button size="sm" className="hidden sm:inline-flex" ariaLabel="Связаться с нами">
            {copy.hero.cta}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
