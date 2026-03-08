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
    { label: "Инструменты", href: "/tools", isRoute: true },
    { label: "Блог", href: "/blog", isRoute: true },
    { label: "О нас", href: "#about" },
    { label: "Контакты", href: "#contact" },
  ];

  const toolLinks = [
    { label: "SEO Auditor", href: "/tools/seo-auditor", isRoute: true },
    { label: "Schema Generator", href: "/tools/schema-generator", isRoute: true },
    { label: "pSEO Generator", href: "/tools/pseo-generator", isRoute: true },
    { label: "LLM Prompt Helper", href: "/tools/llm-prompt-helper", isRoute: true },
  ];

  const company = [
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
      document.getElementById(href.replace("#", ""))?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Logo & Contacts */}
          <div className="col-span-2 lg:col-span-1 space-y-5">
            <a href="/" className="text-2xl font-bold text-gradient inline-block">OWNDEV</a>
            <p className="text-muted-foreground text-sm">
              Бесплатные LLM + SEO инструменты для сайтов и pSEO
            </p>
            <div className="space-y-3">
              {contactInfo.map((item, i) => (
                <a key={i} href={item.href} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[36px]">
                  <item.icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{item.text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Навигация</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} onClick={(e) => handleNavClick(e, link.href, link.isRoute)} className="text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[36px] inline-flex items-center">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Tools */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Инструменты</h3>
            <ul className="space-y-2">
              {toolLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} onClick={(e) => handleNavClick(e, link.href, link.isRoute)} className="text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[36px] inline-flex items-center">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company + Social */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Компания</h3>
            <ul className="space-y-2">
              {company.map((link, i) => (
                <li key={i}>
                  <a href={link.href} onClick={(e) => handleNavClick(e, link.href, link.isRoute)} className="text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[36px] inline-flex items-center">{link.label}</a>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <h4 className="font-medium text-foreground mb-3 text-sm">Мы в соцсетях</h4>
              <div className="flex gap-3">
                {socialLinks.map((social, i) => (
                  <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors" aria-label={social.label}>
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm text-center md:text-left">© 2025 ООО "ОВН ДИДЖИТАЛ". Все права защищены.</p>
            <p className="text-muted-foreground text-xs">Сделано с ❤️ в России</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
