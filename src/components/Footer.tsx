import { Send, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const links = {
    services: [
      { label: "Лендинг", href: "#services" },
      { label: "Корпоративный сайт", href: "#services" },
      { label: "Интернет-магазин", href: "#services" },
      { label: "SaaS-платформа", href: "#services" },
    ],
    company: [
      { label: "О нас", href: "#about" },
      { label: "Проекты", href: "#projects" },
      { label: "Контакты", href: "#contact" },
    ],
    legal: [
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Пользовательское соглашение", href: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: Send, label: "Telegram", href: "https://t.me/The_Suppor_t" },
    { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/89069989888" },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.getElementById(href.replace("#", ""));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <a href="/" className="text-xl font-semibold text-foreground">
              OWNDEV
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Создаём веб-решения для бизнеса любого масштаба
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-medium text-foreground mb-6">Услуги</h3>
            <ul className="space-y-3">
              {links.services.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-medium text-foreground mb-6">Компания</h3>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-medium text-foreground mb-6">Документы</h3>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 OWNDEV. Все права защищены.
          </p>
          <p className="text-xs text-muted-foreground">
            Москва, Россия
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;