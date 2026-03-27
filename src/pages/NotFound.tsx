import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GradientButton } from "@/components/ui/gradient-button";
import { Home } from "lucide-react";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

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

        <div className="text-center relative z-10">
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
            className="text-muted-foreground mb-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            К сожалению, запрашиваемая страница не существует или была удалена.
          </motion.p>
          <motion.div
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
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
