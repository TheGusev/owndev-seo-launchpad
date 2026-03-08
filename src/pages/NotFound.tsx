import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GradientButton } from "@/components/ui/gradient-button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-8xl font-bold font-serif text-gradient mb-4">404</p>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-2">Страница не найдена</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            К сожалению, запрашиваемая страница не существует или была удалена.
          </p>
          <Link to="/">
            <GradientButton size="lg">
              <Home className="w-5 h-5 mr-2" />
              На главную
            </GradientButton>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
