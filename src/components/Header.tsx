import { GradientButton } from "@/components/ui/gradient-button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks: { href: string; label: string; isRoute?: boolean; isNew?: boolean }[] = [
    { href: "/tools", label: "Инструменты", isRoute: true },
    { href: "/geo-audit", label: "GEO‑аудит", isRoute: true, isNew: true },
    { href: "/blog", label: "Блог", isRoute: true },
    { href: "/blog", label: "Блог", isRoute: true },
    { href: "/contacts", label: "Контакты", isRoute: true },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: { href: string; isRoute?: boolean }) => {
    e.preventDefault();
    if (link.isRoute) {
      navigate(link.href);
      setIsOpen(false);
    } else {
      const id = link.href.replace("#", "");
      if (location.pathname !== "/") {
        navigate("/" + link.href);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
      setIsOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="text-2xl font-bold text-gradient">
            OWNDEV
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1"
              >
                {link.label}
                {link.isNew && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full leading-none">
                    NEW
                  </span>
                )}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <GradientButton size="sm" className="min-h-[36px]" onClick={() => navigate("/tools/site-check")}>
              <span className="hidden lg:inline">Проверить сайт</span>
              <span className="lg:hidden">Проверить</span>
            </GradientButton>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <nav className="md:hidden py-4 border-t border-border" aria-label="Мобильное меню">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium py-3 px-2 min-h-[44px] flex items-center rounded-lg hover:bg-muted/50 gap-2"
                >
                  {link.label}
                  {link.isNew && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full leading-none">
                      NEW
                    </span>
                  )}
                </a>
              ))}
              <GradientButton size="sm" className="mt-3" onClick={() => { navigate("/tools/site-check"); setIsOpen(false); }}>
                Проверить сайт
              </GradientButton>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
