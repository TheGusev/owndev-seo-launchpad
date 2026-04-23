import { Mail, MapPin } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const tagStyles: Record<string, string> = {
  "GEO-аудит": "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
  "AI-ready": "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20",
  "SEO": "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20",
  "Яндекс.Директ": "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20",
};

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const contactInfo = [
    { icon: Mail, text: "west-centro@mail.ru", href: "mailto:west-centro@mail.ru" },
    { icon: MapPin, text: "Москва, Россия", href: "#" },
  ];

  const quickLinks = [
    { label: "Инструменты", href: "/tools", isRoute: true },
    { label: "GEO‑аудит", href: "/geo-audit", isRoute: true },
    { label: "Блог", href: "/blog", isRoute: true },
    { label: "Контакты", href: "/contacts", isRoute: true },
  ];

  const toolLinks = [
    { label: "Проверка сайта", href: "/tools/site-check", isRoute: true },
    { label: "Семантическое ядро", href: "/tools/semantic-core", isRoute: true },
    { label: "Внутренние ссылки", href: "/tools/internal-links", isRoute: true },
    { label: "llms.txt Checker", href: "/tools/llms-txt-checker", isRoute: true },
    { label: "SEO Auditor", href: "/tools/seo-auditor", isRoute: true },
    { label: "Schema Generator", href: "/tools/schema-generator", isRoute: true },
  ];

  const company = [
    { label: "Политика конфиденциальности", href: "/privacy", isRoute: true },
    { label: "Пользовательское соглашение", href: "/terms", isRoute: true },
    { label: "Оферта", href: "/offer", isRoute: true },
    { label: "Политика возврата", href: "/refund", isRoute: true },
    { label: "Контакты", href: "/contacts", isRoute: true },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isRoute?: boolean) => {
    if (isRoute) {
      e.preventDefault();
      navigate(href);
      window.scrollTo(0, 0);
    } else if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.replace("#", "");
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 400);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Logo & Description */}
          <div className="col-span-2 lg:col-span-1 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="text-2xl font-bold text-gradient">OWNDEV</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">beta</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Первый GEO и AI-ready аудит сайта в Рунете.
              Анализируем по 50+ параметрам: SEO, Schema.org,
              Яндекс.Директ и готовность к AI-поиску.
            </p>
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagStyles).map(([label, cls]) => (
                <span key={label} className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${cls}`}>
                  {label}
                </span>
              ))}
            </div>
            {/* Contact */}
            <div className="space-y-3">
              {contactInfo.map((item, i) => (
                <a key={i} href={item.href} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[36px]">
                  <item.icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{item.text}</span>
                </a>
              ))}
            </div>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="https://t.me/one_help" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors text-sm">
                ✈
              </a>
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

          {/* Column 4: Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Компания</h3>
            <ul className="space-y-2">
              {company.map((link, i) => (
                <li key={i}>
                  <a href={link.href} onClick={(e) => handleNavClick(e, link.href, link.isRoute)} className="text-muted-foreground hover:text-foreground transition-colors text-sm min-h-[36px] inline-flex items-center">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm text-center md:text-left">
              © {new Date().getFullYear()} OWNDEV.ru · Первый GEO и AI-ready аудит в Рунете · Сделано ❤️ в России 🇷🇺
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Конфиденциальность</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Условия</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
