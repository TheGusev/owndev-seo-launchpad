import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MouseGradient />
      <ClickRipple />
      <Header />
      <Helmet>
        <title>Политика конфиденциальности | OWNDEV</title>
        <meta name="description" content="Политика конфиденциальности ООО «ОВН ДИДЖИТАЛ». Порядок обработки персональных данных на сайте owndev.ru." />
        <link rel="canonical" href="https://owndev.ru/privacy" />
      </Helmet>
      <main className="pt-24 pb-16 relative">
        {/* Background animations */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="primary" lineCount={{ h: 3, v: 4 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] py-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Вернуться на главную
            </Link>
          </motion.div>

          <motion.article
            className="max-w-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-6 font-serif text-foreground">
              Политика конфиденциальности
            </h1>

            <p className="text-muted-foreground mb-8">
              Дата вступления в силу: 24 декабря 2024 года
            </p>

            {[
              { title: "1. Общие положения", content: (
                <>
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
                </>
              )},
              { title: "2. Определения", content: (
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому или определяемому физическому лицу (субъекту персональных данных).</li>
                  <li><strong className="text-foreground">Обработка персональных данных</strong> — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными.</li>
                  <li><strong className="text-foreground">Оператор</strong> — ООО «ОВН ДИДЖИТАЛ», организующее и (или) осуществляющее обработку персональных данных.</li>
                  <li><strong className="text-foreground">Пользователь</strong> — любое лицо, осуществляющее доступ к Сайту.</li>
                  <li><strong className="text-foreground">Сайт</strong> — веб-сайт owndev.ru и его поддомены.</li>
                </ul>
              )},
            ].map((section, idx) => (
              <motion.section
                key={idx}
                className="mb-8"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">{section.title}</h2>
                {section.content}
              </motion.section>
            ))}

            {/* Remaining sections with fade-in */}
            {[
              "3. Перечень обрабатываемых персональных данных",
              "4. Цели обработки персональных данных",
              "5. Правовые основания обработки",
              "6. Порядок сбора и обработки персональных данных",
              "7. Передача персональных данных третьим лицам",
              "8. Сроки обработки персональных данных",
              "9. Права субъекта персональных данных",
              "10. Отзыв согласия",
              "11. Меры по защите персональных данных",
              "12. Изменение Политики конфиденциальности",
              "13. Контактная информация",
            ].map((title, idx) => (
              <motion.section
                key={title}
                className="mb-8"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">{title}</h2>
                {renderPrivacySection(title)}
              </motion.section>
            ))}
          </motion.article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

function renderPrivacySection(title: string) {
  const sections: Record<string, JSX.Element> = {
    "3. Перечень обрабатываемых персональных данных": (
      <>
        <p className="text-muted-foreground mb-4">Оператор обрабатывает следующие персональные данные Пользователей:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Имя (как представляется Пользователь)</li>
          <li>Номер телефона</li>
          <li>Адрес электронной почты (email)</li>
          <li>Выбранная услуга</li>
          <li>Текст сообщения (при наличии)</li>
        </ul>
      </>
    ),
    "4. Цели обработки персональных данных": (
      <>
        <p className="text-muted-foreground mb-4">Персональные данные обрабатываются в следующих целях:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Обработка входящих заявок и запросов от Пользователей</li>
          <li>Осуществление обратной связи с Пользователем</li>
          <li>Предоставление консультаций по услугам Оператора</li>
          <li>Заключение и исполнение договоров на оказание услуг</li>
        </ul>
      </>
    ),
    "5. Правовые основания обработки": (
      <>
        <p className="text-muted-foreground mb-4">Обработка персональных данных осуществляется на основании:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Согласия субъекта персональных данных на обработку его персональных данных (ст. 6 п. 1 пп. 1 ФЗ-152)</li>
          <li>Необходимости исполнения договора, стороной которого является субъект персональных данных (ст. 6 п. 1 пп. 5 ФЗ-152)</li>
        </ul>
      </>
    ),
    "6. Порядок сбора и обработки персональных данных": (
      <>
        <p className="text-muted-foreground mb-4">Персональные данные собираются через форму обратной связи на Сайте. При отправке формы данные передаются напрямую в мессенджер Telegram для оперативной обработки заявки.</p>
        <p className="text-muted-foreground mb-4"><strong className="text-foreground">Важно:</strong> Персональные данные НЕ сохраняются на серверах Сайта и НЕ передаются на серверы за пределами Российской Федерации в целях хранения. Данные используются исключительно для оперативной связи с Пользователем.</p>
      </>
    ),
    "7. Передача персональных данных третьим лицам": (
      <>
        <p className="text-muted-foreground mb-4">Оператор не передаёт персональные данные третьим лицам, за исключением случаев:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Наличия согласия субъекта персональных данных</li>
          <li>Предусмотренных законодательством Российской Федерации</li>
        </ul>
      </>
    ),
    "8. Сроки обработки персональных данных": (
      <p className="text-muted-foreground mb-4">Персональные данные обрабатываются до момента достижения целей обработки или до отзыва согласия субъектом персональных данных. После достижения целей обработки персональные данные уничтожаются.</p>
    ),
    "9. Права субъекта персональных данных": (
      <>
        <p className="text-muted-foreground mb-4">Пользователь имеет право:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Получать информацию, касающуюся обработки его персональных данных</li>
          <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
          <li>Отозвать согласие на обработку персональных данных</li>
          <li>Обжаловать действия или бездействие Оператора в уполномоченный орган по защите прав субъектов персональных данных (Роскомнадзор)</li>
        </ul>
      </>
    ),
    "10. Отзыв согласия": (
      <p className="text-muted-foreground mb-4">Для отзыва согласия на обработку персональных данных необходимо направить соответствующее заявление на email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a> или позвонить по телефону: <a href="tel:89069989888" className="text-primary hover:underline">8 (906) 998-98-88</a>.</p>
    ),
    "11. Меры по защите персональных данных": (
      <p className="text-muted-foreground mb-4">Оператор принимает необходимые и достаточные организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий с ними.</p>
    ),
    "12. Изменение Политики конфиденциальности": (
      <p className="text-muted-foreground mb-4">Оператор оставляет за собой право вносить изменения в настоящую Политику. Новая редакция Политики вступает в силу с момента её размещения на Сайте. Продолжение использования Сайта после внесения изменений означает согласие Пользователя с новой редакцией Политики.</p>
    ),
    "13. Контактная информация": (
      <>
        <p className="text-muted-foreground mb-4">По всем вопросам, связанным с обработкой персональных данных, Вы можете обратиться:</p>
        <ul className="list-none text-muted-foreground space-y-2">
          <li>📧 Email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a></li>
          <li>📞 Телефон: <a href="tel:89069989888" className="text-primary hover:underline">8 (906) 998-98-88</a></li>
          <li>💬 Telegram: <a href="https://t.me/The_Suppor_t" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@The_Suppor_t</a></li>
        </ul>
      </>
    ),
  };
  return sections[title] || null;
}

export default Privacy;
