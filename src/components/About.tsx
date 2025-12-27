const About = () => {
  return (
    <section id="about" className="py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            О нас
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Мы — команда опытных разработчиков, дизайнеров и менеджеров проектов. 
            Создаём цифровые продукты, которые помогают бизнесу расти и развиваться.
          </p>
          <p className="text-lg text-muted-foreground">
            Работаем с проектами любой сложности: от простых лендингов до 
            масштабных корпоративных систем.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
