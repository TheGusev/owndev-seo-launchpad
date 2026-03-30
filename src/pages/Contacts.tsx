import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Mail, Phone, MapPin, Send } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const contacts = [
  { icon: Mail, label: "Email", value: "west-centro@mail.ru", href: "mailto:west-centro@mail.ru" },
  { icon: Phone, label: "Телефон", value: "+7 993 928-94-88", href: "tel:+79939289488" },
  { icon: Send, label: "Telegram", value: "@one_help", href: "https://t.me/one_help" },
  { icon: MapPin, label: "Город", value: "Москва, Россия", href: undefined },
];

const Contacts = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MouseGradient />
      <ClickRipple />
      <Header />
      <Helmet>
        <title>Контакты | OWNDEV</title>
        <meta name="description" content="Свяжитесь с OWNDEV — email, телефон, Telegram." />
        <link rel="canonical" href="https://owndev.ru/contacts" />
        <meta property="og:url" content="https://owndev.ru/contacts" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://owndev.ru/" },
            { "@type": "ListItem", position: 2, name: "Контакты", item: "https://owndev.ru/contacts" },
          ],
        })}</script>
      </Helmet>
      <main className="pt-24 pb-16 relative">
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="primary" lineCount={{ h: 3, v: 4 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 max-w-3xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Контакты</h1>

            <div className="grid gap-4">
              {contacts.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-foreground font-medium hover:text-primary transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-foreground font-medium">{item.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contacts;
