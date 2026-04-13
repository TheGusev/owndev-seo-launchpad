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
        <meta name="description" content="Политика конфиденциальности OWNDEV. Порядок обработки персональных данных на сайте owndev.ru." />
        <link rel="canonical" href="https://owndev.ru/privacy" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <main className="pt-24 pb-16 relative">
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="primary" lineCount={{ h: 3, v: 4 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 max-w-3xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] py-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Вернуться на главную
            </Link>
          </motion.div>

          <motion.article className="max-w-none" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h1 className="text-2xl md:text-3xl font-bold mb-6 font-serif text-foreground">
              Политика конфиденциальности
            </h1>
            <p className="text-muted-foreground mb-8">Дата вступления в силу: 13 апреля 2026 года</p>

            {sections.map((section, idx) => (
              <motion.section
                key={idx}
                className="mb-8"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">{section.title}</h2>
                {section.content}
              </motion.section>
            ))}
          </motion.article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const sections = [
  {
    title: "1. Общие положения",
    content: (
      <>
        <p className="text-muted-foreground mb-4">
          Настоящая Политика конфиденциальности (далее — «Политика») разработана в соответствии с
          требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет
          порядок обработки персональных данных и меры по обеспечению безопасности персональных данных,
          предпринимаемые Оператором.
        </p>
        <p className="text-muted-foreground mb-4">
          <strong className="text-foreground">Оператор персональных данных:</strong><br />
          Индивидуальный предприниматель<br />
          ИНН: 511007293446<br />
          Сайт: owndev.ru<br />
          Email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a><br />
          Телефон: <a href="tel:+79939289488" className="text-primary hover:underline">+7 993 928-94-88</a>
        </p>
      </>
    ),
  },
  {
    title: "2. Определения",
    content: (
      <ul className="list-disc pl-6 text-muted-foreground space-y-2">
        <li><strong className="text-foreground">Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому или определяемому физическому лицу (субъекту персональных данных).</li>
        <li><strong className="text-foreground">Обработка персональных данных</strong> — любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными.</li>
        <li><strong className="text-foreground">Оператор</strong> — ИП (ИНН 511007293446), организующий и (или) осуществляющий обработку персональных данных.</li>
        <li><strong className="text-foreground">Пользователь</strong> — любое лицо, осуществляющее доступ к Сайту.</li>
        <li><strong className="text-foreground">Сайт</strong> — веб-сайт owndev.ru и его поддомены.</li>
      </ul>
    ),
  },
  {
    title: "3. Перечень обрабатываемых персональных данных",
    content: (
      <>
        <p className="text-muted-foreground mb-4">Оператор обрабатывает следующие персональные данные Пользователей:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Имя (как представляется Пользователь)</li>
          <li>Адрес электронной почты (email)</li>
          <li>Номер телефона (при указании)</li>
          <li>URL-адрес сайта (при использовании сервиса проверки)</li>
          <li>Выбранная услуга</li>
          <li>Текст сообщения (при наличии)</li>
        </ul>
        <p className="text-muted-foreground mt-4 mb-4">
          <strong className="text-foreground">Платёжные данные:</strong> Банковские реквизиты (номер карты, срок действия, CVV) НЕ обрабатываются и НЕ хранятся Оператором. Все платежи обрабатываются платёжным сервисом ЮKassa (ООО «ЮКасса», ИНН 7750005725) в соответствии с требованиями PCI DSS.
        </p>
      </>
    ),
  },
  {
    title: "4. Цели обработки персональных данных",
    content: (
      <>
        <p className="text-muted-foreground mb-4">Персональные данные обрабатываются в следующих целях:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Обработка входящих заявок и запросов от Пользователей</li>
          <li>Осуществление обратной связи с Пользователем</li>
          <li>Предоставление доступа к платным услугам (Полный GEO-аудит)</li>
          <li>Отправка результатов проверки на email Пользователя</li>
          <li>Предоставление консультаций по услугам Оператора</li>
          <li>Заключение и исполнение договоров на оказание услуг</li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Правовые основания обработки",
    content: (
      <>
        <p className="text-muted-foreground mb-4">Обработка персональных данных осуществляется на основании:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Согласия субъекта персональных данных на обработку его персональных данных (ст. 6 п. 1 пп. 1 ФЗ-152)</li>
          <li>Необходимости исполнения договора, стороной которого является субъект персональных данных (ст. 6 п. 1 пп. 5 ФЗ-152)</li>
        </ul>
      </>
    ),
  },
  {
    title: "6. Порядок сбора и обработки персональных данных",
    content: (
      <>
        <p className="text-muted-foreground mb-4">Персональные данные собираются через:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Форму обратной связи на Сайте</li>
          <li>Форму оплаты при заказе Полного GEO-аудита (email)</li>
        </ul>
        <p className="text-muted-foreground mt-4 mb-4">
          При отправке формы обратной связи данные передаются в мессенджер Telegram для оперативной обработки заявки.
        </p>
        <p className="text-muted-foreground mb-4">
          <strong className="text-foreground">Важно:</strong> Персональные данные из формы обратной связи НЕ сохраняются на серверах Сайта. Email, указанный при оплате, хранится в базе данных Оператора для исполнения обязательств по договору (отправка отчёта, обработка возвратов).
        </p>
      </>
    ),
  },
  {
    title: "7. Передача персональных данных третьим лицам",
    content: (
      <>
        <p className="text-muted-foreground mb-4">Оператор передаёт персональные данные следующим третьим лицам в рамках оказания услуг:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li><strong className="text-foreground">ООО «ЮКасса»</strong> (ИНН 7750005725) — обработка платежей. Передаётся: email Пользователя. Банковские реквизиты вводятся непосредственно на странице ЮKassa и не проходят через серверы Оператора.</li>
          <li><strong className="text-foreground">Яндекс.Метрика</strong> — аналитика посещаемости Сайта. Собираются обезличенные данные: IP-адрес, информация о браузере, поведение на сайте. Данные обрабатываются ООО «Яндекс» (ИНН 7736207543) на территории РФ.</li>
        </ul>
        <p className="text-muted-foreground mt-4 mb-4">
          В иных случаях Оператор не передаёт персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством Российской Федерации.
        </p>
      </>
    ),
  },
  {
    title: "8. Файлы cookie и аналитика",
    content: (
      <>
        <p className="text-muted-foreground mb-4">Сайт использует файлы cookie для:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Обеспечения работоспособности Сайта (технические cookie)</li>
          <li>Сбора статистики посещаемости через Яндекс.Метрику (аналитические cookie)</li>
        </ul>
        <p className="text-muted-foreground mt-4 mb-4">
          Пользователь может отключить использование cookie в настройках браузера. При этом некоторые функции Сайта могут работать некорректно.
        </p>
      </>
    ),
  },
  {
    title: "9. Сроки обработки персональных данных",
    content: (
      <p className="text-muted-foreground mb-4">Персональные данные обрабатываются до момента достижения целей обработки или до отзыва согласия субъектом персональных данных. Данные, связанные с оплатой (email, идентификатор платежа), хранятся в течение 3 лет в соответствии с требованиями бухгалтерского учёта.</p>
    ),
  },
  {
    title: "10. Права субъекта персональных данных",
    content: (
      <>
        <p className="text-muted-foreground mb-4">Пользователь имеет право:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
          <li>Получать информацию, касающуюся обработки его персональных данных</li>
          <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
          <li>Отозвать согласие на обработку персональных данных</li>
          <li>Обжаловать действия или бездействие Оператора в Роскомнадзор</li>
        </ul>
      </>
    ),
  },
  {
    title: "11. Отзыв согласия",
    content: (
      <p className="text-muted-foreground mb-4">Для отзыва согласия на обработку персональных данных необходимо направить соответствующее заявление на email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a> или позвонить по телефону: <a href="tel:+79939289488" className="text-primary hover:underline">+7 993 928-94-88</a>.</p>
    ),
  },
  {
    title: "12. Меры по защите персональных данных",
    content: (
      <p className="text-muted-foreground mb-4">Оператор принимает необходимые и достаточные организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий с ними. Платёжные данные защищены в соответствии со стандартом PCI DSS платёжным сервисом ЮKassa.</p>
    ),
  },
  {
    title: "13. Изменение Политики конфиденциальности",
    content: (
      <p className="text-muted-foreground mb-4">Оператор оставляет за собой право вносить изменения в настоящую Политику. Новая редакция Политики вступает в силу с момента её размещения на Сайте. Продолжение использования Сайта после внесения изменений означает согласие Пользователя с новой редакцией Политики.</p>
    ),
  },
  {
    title: "14. Контактная информация",
    content: (
      <>
        <p className="text-muted-foreground mb-4">По всем вопросам, связанным с обработкой персональных данных, Вы можете обратиться:</p>
        <ul className="list-none text-muted-foreground space-y-2">
          <li><strong className="text-foreground">ИП, ИНН:</strong> 511007293446</li>
          <li>📧 Email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a></li>
          <li>📞 Телефон: <a href="tel:+79939289488" className="text-primary hover:underline">+7 993 928-94-88</a></li>
          <li>💬 Telegram: <a href="https://t.me/one_help" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@one_help</a></li>
        </ul>
      </>
    ),
  },
];

export default Privacy;
