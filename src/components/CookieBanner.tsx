import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";


const COOKIE_CONSENT_KEY = "cookie_consent_accepted";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 z-50"
        >
          <div className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-lg px-4 py-2.5">
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                Мы используем cookie.{" "}
                <Link 
                  to="/privacy" 
                  className="text-primary hover:underline"
                >
                  Подробнее
                </Link>
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleDecline}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 px-3 text-xs"
                >
                  Отклонить
                </Button>
                <Button 
                  onClick={handleAccept}
                  size="sm"
                  className="shrink-0 h-7 px-3 text-xs"
                >
                  Принять
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
