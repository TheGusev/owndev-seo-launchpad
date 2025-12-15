const Footer = () => {
  return (
    <footer className="py-8 border-t border-border">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-2xl font-bold text-gradient">OWNDEV</div>
          <p className="text-muted-foreground text-sm">
            © 2024 OWNDEV. Все права защищены.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Политика конфиденциальности
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
