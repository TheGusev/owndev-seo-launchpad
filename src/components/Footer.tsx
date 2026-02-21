import { Phone, Mail, MapPin, Send, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const contactInfo = [
    { icon: Phone, text: "8 (906) 998-98-88", href: "tel:89069989888" },
    { icon: Mail, text: "west-centro@mail.ru", href: "mailto:west-centro@mail.ru" },
    { icon: MapPin, text: "Москва, Россия", href: "#" },
  ];

  const quickLinks = [
    { label: "Инструменты pSEO", href: "#tool-generator" },
    { label: "Что такое pSEO?", href: "#what-is-pseo" },
    { label: "Кейсы", href: "#cases" },
    { label: "Контакты", href: "#contact" },
  ];

  const services = [
    { label: "pSEO Generator", href: "#tool-generator" },
    { label: "Anti-Duplicate Checker", href: "#tool-anti-duplicate" },
    { label: "AI Citation Checker", href: "#tool-ai-check" },
    { label: "ROI Calculator", href: "#tool-roi" },
    { label: "GEO Coverage Map", href: "#tool-geo" },
  ];

  const company = [
    { label: "О нас", href: "#process" },
    { label: "Результаты", href: "#results" },
    { label: "Политика конфиденциальности", href: "/privacy", isRoute: true },
    { label: "Пользовательское соглашение", href: "/terms", isRoute: true },
  ];

  const socialLinks = [
    { icon: Send, label: "Telegram", href: "https://t.me/The_Suppor_t?text=owndev" },
    { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/89069989888" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isRoute?: boolean) => {
    if (isRoute) {
      e.preventDefault();
      navigate(href);
      window.scrollTo(0, 0);
    } else if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.getElementById(href.replace("#", ""));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container px-4 md:px-6 py-12 md:py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Logo & Contacts */}
          <div className="space-y-6">
            <a href="/" className="text-2xl font-bold text-gradient inline-block">
              OWNDEV
            </a>
            <p className="text-muted-foreground text-sm">
              Бесплатная pSEO‑платформа для российского бизнеса
            </p>
            <div className="space-y-3">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Быстрые ссылки</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Инструменты</h3>
            <ul className="space-y-3">
              {services.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Компания</h3>
            <ul className="space-y-3">
              {company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href, link.isRoute)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <div className="mt-6">
              <h4 className="font-medium text-foreground mb-3 text-sm">Мы в соцсетях</h4>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
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
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm text-center md:text-left">
              © 2025 ООО "ОВН ДИДЖИТАЛ". Все права защищены.
            </p>
            <p className="text-muted-foreground text-xs">
              Сделано с ❤️ в России
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
