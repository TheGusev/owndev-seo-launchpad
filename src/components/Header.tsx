import { GradientButton } from "@/components/ui/gradient-button";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks: { href: string; label: string; isRoute?: boolean }[] = [
    { href: "/tools", label: "Инструменты", isRoute: true },
    { href: "/blog", label: "Блог", isRoute: true },
    { href: "#about", label: "О нас" },
    { href: "#contact", label: "Контакты" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: { href: string; isRoute?: boolean }) => {
    e.preventDefault();
    if (link.isRoute) {
      navigate(link.href);
      setIsOpen(false);
    } else {
      scrollTo(link.href.replace("#", ""));
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="/" className="text-2xl font-bold text-gradient">
            OWNDEV
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <GradientButton size="sm" onClick={() => navigate("/tools")}>
              Открыть инструменты
            </GradientButton>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                >
                  {link.label}
                </a>
              ))}
              <GradientButton size="sm" className="mt-2" onClick={() => navigate("/tools")}>
                Открыть инструменты
              </GradientButton>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
