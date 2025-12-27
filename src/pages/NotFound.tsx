import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Страница не найдена</p>
        <Link to="/">
          <Button ariaLabel="На главную">На главную</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
