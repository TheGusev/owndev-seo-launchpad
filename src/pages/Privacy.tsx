import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] py-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Вернуться на главную
          </Link>

          <article className="max-w-none">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 font-serif text-foreground">
              Политика конфиденциальности
            </h1>

            <p className="text-muted-foreground mb-8">
              Дата вступления в силу: 24 декабря 2024 года
            </p>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">1. Общие положения</h2>
              <p className="text-muted-foreground mb-4">
                Настоящая Политика конфиденциальности (далее — «Политика») разработана в соответствии с 
                требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет 
                порядок обработки персональных данных и меры по обеспечению безопасности персональных данных, 
                предпринимаемые Оператором.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">Оператор персональных данных:</strong><br />
                ООО «ОВН ДИДЖИТАЛ»<br />
                ИНН: уточняется<br />
                Адрес: г. Москва, Россия<br />
                Email: west-centro@mail.ru<br />
                Телефон: 8 (906) 998-98-88
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">2. Определения</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому или определяемому физическому лицу (субъекту персональных данных).</li>
                <li><strong className="text-foreground">Обработка персональных данных</strong> — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными.</li>
                <li><strong className="text-foreground">Оператор</strong> — ООО «ОВН ДИДЖИТАЛ», организующее и (или) осуществляющее обработку персональных данных.</li>
                <li><strong className="text-foreground">Пользователь</strong> — любое лицо, осуществляющее доступ к Сайту.</li>
                <li><strong className="text-foreground">Сайт</strong> — веб-сайт owndev.ru и его поддомены.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">3. Перечень обрабатываемых персональных данных</h2>
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
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">4. Цели обработки персональных данных</h2>
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
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">5. Правовые основания обработки</h2>
              <p className="text-muted-foreground mb-4">
                Обработка персональных данных осуществляется на основании:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Согласия субъекта персональных данных на обработку его персональных данных (ст. 6 п. 1 пп. 1 ФЗ-152)</li>
                <li>Необходимости исполнения договора, стороной которого является субъект персональных данных (ст. 6 п. 1 пп. 5 ФЗ-152)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">6. Порядок сбора и обработки персональных данных</h2>
              <p className="text-muted-foreground mb-4">
                Персональные данные собираются через форму обратной связи на Сайте. При отправке формы данные 
                передаются напрямую в мессенджер Telegram для оперативной обработки заявки.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">Важно:</strong> Персональные данные НЕ сохраняются на серверах Сайта и НЕ передаются 
                на серверы за пределами Российской Федерации в целях хранения. Данные используются исключительно 
                для оперативной связи с Пользователем.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">7. Передача персональных данных третьим лицам</h2>
              <p className="text-muted-foreground mb-4">
                Оператор не передаёт персональные данные третьим лицам, за исключением случаев:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Наличия согласия субъекта персональных данных</li>
                <li>Предусмотренных законодательством Российской Федерации</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">8. Сроки обработки персональных данных</h2>
              <p className="text-muted-foreground mb-4">
                Персональные данные обрабатываются до момента достижения целей обработки или до отзыва 
                согласия субъектом персональных данных. После достижения целей обработки персональные 
                данные уничтожаются.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">9. Права субъекта персональных данных</h2>
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
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">10. Отзыв согласия</h2>
              <p className="text-muted-foreground mb-4">
                Для отзыва согласия на обработку персональных данных необходимо направить соответствующее 
                заявление на email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a> или 
                позвонить по телефону: <a href="tel:89069989888" className="text-primary hover:underline">8 (906) 998-98-88</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">11. Меры по защите персональных данных</h2>
              <p className="text-muted-foreground mb-4">
                Оператор принимает необходимые и достаточные организационные и технические меры для защиты 
                персональных данных от неправомерного или случайного доступа, уничтожения, изменения, 
                блокирования, копирования, распространения, а также от иных неправомерных действий с ними.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">12. Изменение Политики конфиденциальности</h2>
              <p className="text-muted-foreground mb-4">
                Оператор оставляет за собой право вносить изменения в настоящую Политику. Новая редакция 
                Политики вступает в силу с момента её размещения на Сайте. Продолжение использования Сайта 
                после внесения изменений означает согласие Пользователя с новой редакцией Политики.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">13. Контактная информация</h2>
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
