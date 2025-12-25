import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/ui/page-transition";

const Terms = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
      <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться на главную
          </Button>
        </Link>

        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 font-serif">
            Пользовательское соглашение
          </h1>

          <p className="text-muted-foreground mb-8">
            Дата вступления в силу: 24 декабря 2024 года
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Общие положения</h2>
            <p className="text-muted-foreground mb-4">
              1.1. Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между 
              ООО «ОВН ДИДЖИТАЛ» (далее — «Исполнитель») и любым физическим или юридическим лицом (далее — «Заказчик»), 
              использующим сайт owndev.ru (далее — «Сайт») и/или заказывающим услуги Исполнителя.
            </p>
            <p className="text-muted-foreground mb-4">
              1.2. Использование Сайта и/или отправка заявки через форму обратной связи означает полное и 
              безоговорочное принятие Заказчиком условий настоящего Соглашения.
            </p>
            <p className="text-muted-foreground mb-4">
              1.3. Настоящее Соглашение является публичной офертой в соответствии со статьёй 437 Гражданского 
              кодекса Российской Федерации.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Предмет Соглашения</h2>
            <p className="text-muted-foreground mb-4">
              2.1. Исполнитель обязуется оказать Заказчику услуги по разработке веб-сайтов и программного 
              обеспечения, а Заказчик обязуется принять и оплатить эти услуги в порядке и на условиях, 
              определённых настоящим Соглашением и дополнительными договорами.
            </p>
            <p className="text-muted-foreground mb-4">
              2.2. Конкретный перечень услуг, сроки и стоимость определяются индивидуально для каждого 
              проекта и фиксируются в отдельном договоре или техническом задании.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Услуги Исполнителя</h2>
            <p className="text-muted-foreground mb-4">
              3.1. Исполнитель предоставляет следующие виды услуг:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Разработка лендингов (одностраничных сайтов)</li>
              <li>Разработка корпоративных сайтов</li>
              <li>Разработка интернет-магазинов</li>
              <li>SEO-оптимизация и продвижение сайтов</li>
              <li>Разработка SaaS-платформ и веб-приложений</li>
              <li>Консультации по веб-разработке и цифровому маркетингу</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Права и обязанности сторон</h2>
            
            <h3 className="text-lg font-medium mb-3 mt-6">4.1. Исполнитель обязуется:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Оказывать услуги качественно и в согласованные сроки</li>
              <li>Соблюдать конфиденциальность информации, полученной от Заказчика</li>
              <li>Информировать Заказчика о ходе выполнения работ</li>
              <li>Предоставлять консультации в рамках оказываемых услуг</li>
            </ul>

            <h3 className="text-lg font-medium mb-3 mt-6">4.2. Исполнитель имеет право:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Запрашивать у Заказчика информацию и материалы, необходимые для оказания услуг</li>
              <li>Приостановить работу при нарушении Заказчиком сроков оплаты</li>
              <li>Привлекать третьих лиц для выполнения отдельных видов работ</li>
            </ul>

            <h3 className="text-lg font-medium mb-3 mt-6">4.3. Заказчик обязуется:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Предоставлять достоверную информацию и необходимые материалы</li>
              <li>Своевременно оплачивать услуги Исполнителя</li>
              <li>Принимать выполненные работы в согласованные сроки</li>
              <li>Не использовать результаты работ в незаконных целях</li>
            </ul>

            <h3 className="text-lg font-medium mb-3 mt-6">4.4. Заказчик имеет право:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Получать информацию о ходе выполнения работ</li>
              <li>Вносить предложения по улучшению результата в рамках согласованного технического задания</li>
              <li>Требовать устранения недостатков в разумные сроки</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Порядок оказания услуг</h2>
            <p className="text-muted-foreground mb-4">
              5.1. Заказчик оставляет заявку через форму на Сайте или связывается с Исполнителем по телефону, 
              email или через мессенджеры.
            </p>
            <p className="text-muted-foreground mb-4">
              5.2. Исполнитель проводит бесплатную консультацию для уточнения требований и задач Заказчика.
            </p>
            <p className="text-muted-foreground mb-4">
              5.3. По итогам консультации Исполнитель формирует коммерческое предложение с указанием сроков 
              и стоимости работ.
            </p>
            <p className="text-muted-foreground mb-4">
              5.4. После согласования условий стороны заключают договор и/или подписывают техническое задание.
            </p>
            <p className="text-muted-foreground mb-4">
              5.5. Работа начинается после получения предоплаты (если предусмотрена договором).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Стоимость и порядок оплаты</h2>
            <p className="text-muted-foreground mb-4">
              6.1. Стоимость услуг определяется индивидуально для каждого проекта и указывается в 
              коммерческом предложении или договоре.
            </p>
            <p className="text-muted-foreground mb-4">
              6.2. Оплата производится безналичным переводом на расчётный счёт Исполнителя или иным 
              согласованным способом.
            </p>
            <p className="text-muted-foreground mb-4">
              6.3. Стандартный порядок оплаты: 50% предоплата, 50% после сдачи проекта. Иные условия 
              могут быть согласованы сторонами.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Ответственность сторон</h2>
            <p className="text-muted-foreground mb-4">
              7.1. Стороны несут ответственность за неисполнение или ненадлежащее исполнение своих 
              обязательств в соответствии с законодательством Российской Федерации.
            </p>
            <p className="text-muted-foreground mb-4">
              7.2. Исполнитель не несёт ответственности за убытки Заказчика, возникшие вследствие 
              неправильного использования результатов работ.
            </p>
            <p className="text-muted-foreground mb-4">
              7.3. Исполнитель не несёт ответственности за действия третьих лиц (хостинг-провайдеров, 
              регистраторов доменов и т.д.).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Интеллектуальная собственность</h2>
            <p className="text-muted-foreground mb-4">
              8.1. Все исключительные права на результаты работ переходят к Заказчику после полной оплаты 
              стоимости услуг.
            </p>
            <p className="text-muted-foreground mb-4">
              8.2. До момента полной оплаты исключительные права на результаты работ принадлежат Исполнителю.
            </p>
            <p className="text-muted-foreground mb-4">
              8.3. Исполнитель имеет право использовать результаты работ в своём портфолио с согласия 
              Заказчика.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Конфиденциальность</h2>
            <p className="text-muted-foreground mb-4">
              9.1. Стороны обязуются сохранять конфиденциальность информации, полученной в ходе 
              сотрудничества, и не разглашать её третьим лицам без письменного согласия другой стороны.
            </p>
            <p className="text-muted-foreground mb-4">
              9.2. Обработка персональных данных осуществляется в соответствии с{" "}
              <Link to="/privacy" className="text-primary hover:underline">Политикой конфиденциальности</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Разрешение споров</h2>
            <p className="text-muted-foreground mb-4">
              10.1. Все споры и разногласия стороны стремятся решить путём переговоров.
            </p>
            <p className="text-muted-foreground mb-4">
              10.2. При невозможности достижения согласия споры подлежат рассмотрению в суде по месту 
              нахождения Исполнителя в соответствии с законодательством Российской Федерации.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Изменение условий Соглашения</h2>
            <p className="text-muted-foreground mb-4">
              11.1. Исполнитель оставляет за собой право вносить изменения в настоящее Соглашение.
            </p>
            <p className="text-muted-foreground mb-4">
              11.2. Новая редакция Соглашения вступает в силу с момента её размещения на Сайте.
            </p>
            <p className="text-muted-foreground mb-4">
              11.3. Продолжение использования Сайта после внесения изменений означает согласие Заказчика 
              с новой редакцией Соглашения.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Заключительные положения</h2>
            <p className="text-muted-foreground mb-4">
              12.1. Настоящее Соглашение вступает в силу с момента начала использования Сайта Заказчиком 
              и действует бессрочно.
            </p>
            <p className="text-muted-foreground mb-4">
              12.2. Все вопросы, не урегулированные настоящим Соглашением, разрешаются в соответствии с 
              законодательством Российской Федерации.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Реквизиты Исполнителя</h2>
            <ul className="list-none text-muted-foreground space-y-2">
              <li><strong>Наименование:</strong> ООО «ОВН ДИДЖИТАЛ»</li>
              <li><strong>Адрес:</strong> г. Москва, Россия</li>
              <li>📧 Email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a></li>
              <li>📞 Телефон: <a href="tel:89069989888" className="text-primary hover:underline">8 (906) 998-98-88</a></li>
              <li>💬 Telegram: <a href="https://t.me/The_Suppor_t" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@The_Suppor_t</a></li>
            </ul>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 ООО «ОВН ДИДЖИТАЛ». Все права защищены.
          </p>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Terms;
