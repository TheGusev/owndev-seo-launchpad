import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GradientButton } from "@/components/ui/gradient-button";
import { Home, Search, Wrench, ScanSearch } from "lucide-react";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";
import { Input } from "@/components/ui/input";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quickUrl, setQuickUrl] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleQuickCheck = () => {
    if (quickUrl.trim()) {
      navigate(`/tools/site-check?url=${encodeURIComponent(quickUrl.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Helmet>
        <title>404 — Страница не найдена | OWNDEV</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <MouseGradient />
      <ClickRipple />
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
        </div>

        <div className="text-center relative z-10 max-w-lg mx-auto">
          <motion.p
            className="text-8xl md:text-9xl font-bold font-serif text-gradient mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, duration: 0.8 }}
          >
            404
          </motion.p>
          <motion.h1
            className="text-xl md:text-2xl font-semibold text-foreground mb-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Страница не найдена
          </motion.h1>
          <motion.p
            className="text-muted-foreground mb-6 max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            К сожалению, запрашиваемая страница не существует или была удалена.
          </motion.p>

          {/* Quick URL check */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <p className="text-sm text-muted-foreground mb-2">Проверьте свой сайт прямо сейчас:</p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <Input
                placeholder="https://example.com"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickCheck()}
                className="bg-card border-border"
              />
              <GradientButton onClick={handleQuickCheck} size="sm">
                <ScanSearch className="w-4 h-4" />
              </GradientButton>
            </div>
          </motion.div>

          {/* Navigation links */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link to="/">
              <GradientButton size="lg">
                <Home className="w-5 h-5 mr-2" />
                На главную
              </GradientButton>
            </Link>
            <Link to="/tools/site-check">
              <GradientButton variant="variant" size="lg">
                <Search className="w-5 h-5 mr-2" />
                Проверить сайт
              </GradientButton>
            </Link>
            <Link to="/tools">
              <GradientButton variant="variant" size="lg">
                <Wrench className="w-5 h-5 mr-2" />
                Все инструменты
              </GradientButton>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
