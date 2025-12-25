import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/ui/page-transition";

const Privacy = () => {
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
            Политика конфиденциальности
          </h1>

          <p className="text-muted-foreground mb-8">
            Дата вступления в силу: 24 декабря 2024 года
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Общие положения</h2>
            <p className="text-muted-foreground mb-4">
              Настоящая Политика конфиденциальности (далее — «Политика») разработана в соответствии с 
              требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет 
              порядок обработки персональных данных и меры по обеспечению безопасности персональных данных, 
              предпринимаемые Оператором.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Оператор персональных данных:</strong><br />
              ООО «ОВН ДИДЖИТАЛ»<br />
              ИНН: уточняется<br />
              Адрес: г. Москва, Россия<br />
              Email: west-centro@mail.ru<br />
              Телефон: 8 (906) 998-98-88
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Определения</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому или определяемому физическому лицу (субъекту персональных данных).</li>
              <li><strong>Обработка персональных данных</strong> — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными.</li>
              <li><strong>Оператор</strong> — ООО «ОВН ДИДЖИТАЛ», организующее и (или) осуществляющее обработку персональных данных.</li>
              <li><strong>Пользователь</strong> — любое лицо, осуществляющее доступ к Сайту.</li>
              <li><strong>Сайт</strong> — веб-сайт owndev.ru и его поддомены.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Перечень обрабатываемых персональных данных</h2>
            <p className="text-muted-foreground mb-4">
              Оператор обрабатывает следующие персональные данные Пользователей:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Имя (как представляется Пользователь)</li>
              <li>Номер телефона</li>
              <li>Адрес электронной почты (email)</li>
              <li>Выбранная услуга</li>
              <li>Текст сообщения (при наличии)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Цели обработки персональных данных</h2>
            <p className="text-muted-foreground mb-4">
              Персональные данные обрабатываются в следующих целях:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Обработка входящих заявок и запросов от Пользователей</li>
              <li>Осуществление обратной связи с Пользователем</li>
              <li>Предоставление консультаций по услугам Оператора</li>
              <li>Заключение и исполнение договоров на оказание услуг</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Правовые основания обработки</h2>
            <p className="text-muted-foreground mb-4">
              Обработка персональных данных осуществляется на основании:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Согласия субъекта персональных данных на обработку его персональных данных (ст. 6 п. 1 пп. 1 ФЗ-152)</li>
              <li>Необходимости исполнения договора, стороной которого является субъект персональных данных (ст. 6 п. 1 пп. 5 ФЗ-152)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Порядок сбора и обработки персональных данных</h2>
            <p className="text-muted-foreground mb-4">
              Персональные данные собираются через форму обратной связи на Сайте. При отправке формы данные 
              передаются напрямую в мессенджер Telegram для оперативной обработки заявки.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Важно:</strong> Персональные данные НЕ сохраняются на серверах Сайта и НЕ передаются 
              на серверы за пределами Российской Федерации в целях хранения. Данные используются исключительно 
              для оперативной связи с Пользователем.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Передача персональных данных третьим лицам</h2>
            <p className="text-muted-foreground mb-4">
              Оператор не передаёт персональные данные третьим лицам, за исключением случаев:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Наличия согласия субъекта персональных данных</li>
              <li>Предусмотренных законодательством Российской Федерации</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Сроки обработки персональных данных</h2>
            <p className="text-muted-foreground mb-4">
              Персональные данные обрабатываются до момента достижения целей обработки или до отзыва 
              согласия субъектом персональных данных. После достижения целей обработки персональные 
              данные уничтожаются.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Права субъекта персональных данных</h2>
            <p className="text-muted-foreground mb-4">
              Пользователь имеет право:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Получать информацию, касающуюся обработки его персональных данных</li>
              <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
              <li>Отозвать согласие на обработку персональных данных</li>
              <li>Обжаловать действия или бездействие Оператора в уполномоченный орган по защите прав субъектов персональных данных (Роскомнадзор)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Отзыв согласия</h2>
            <p className="text-muted-foreground mb-4">
              Для отзыва согласия на обработку персональных данных необходимо направить соответствующее 
              заявление на email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a> или 
              позвонить по телефону: <a href="tel:89069989888" className="text-primary hover:underline">8 (906) 998-98-88</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Меры по защите персональных данных</h2>
            <p className="text-muted-foreground mb-4">
              Оператор принимает необходимые и достаточные организационные и технические меры для защиты 
              персональных данных от неправомерного или случайного доступа, уничтожения, изменения, 
              блокирования, копирования, распространения, а также от иных неправомерных действий с ними.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Изменение Политики конфиденциальности</h2>
            <p className="text-muted-foreground mb-4">
              Оператор оставляет за собой право вносить изменения в настоящую Политику. Новая редакция 
              Политики вступает в силу с момента её размещения на Сайте. Продолжение использования Сайта 
              после внесения изменений означает согласие Пользователя с новой редакцией Политики.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Контактная информация</h2>
            <p className="text-muted-foreground mb-4">
              По всем вопросам, связанным с обработкой персональных данных, Вы можете обратиться:
            </p>
            <ul className="list-none text-muted-foreground space-y-2">
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

export default Privacy;
