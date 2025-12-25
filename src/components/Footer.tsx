import { motion } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

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
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Brand */}
          <motion.div variants={itemVariants} className="space-y-6">
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
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Services */}
          <motion.div variants={itemVariants}>
            <h3 className="font-medium text-foreground mb-6">Услуги</h3>
            <ul className="space-y-3">
              {links.services.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div variants={itemVariants}>
            <h3 className="font-medium text-foreground mb-6">Компания</h3>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants}>
            <h3 className="font-medium text-foreground mb-6">Документы</h3>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom */}
        <motion.div 
          className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground">
            © 2025 OWNDEV. Все права защищены.
          </p>
          <p className="text-xs text-muted-foreground">
            Москва, Россия
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
