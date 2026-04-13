import 'dotenv/config';
import postgres from 'postgres';

type SeedRow = {
  domain: string;
  display_name: string;
  category: string;
  llm_score: number;
  seo_score: number;
  schema_score: number;
  direct_score: number;
  has_llms_txt: boolean;
  has_faqpage: boolean;
  has_schema: boolean;
  errors_count: number;
  top_errors: unknown[];
};

const SEED_DATA: SeedRow[] = [
  { domain: "owndev.ru", display_name: "OWNDEV", category: "Сервисы", llm_score: 90, seo_score: 100, schema_score: 100, direct_score: 79, has_llms_txt: true, has_faqpage: true, has_schema: true, errors_count: 5, top_errors: [{"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "Размытый тематический фокус страницы", "severity": "high"}, {"title": "Несколько тематик на одной посадочной", "severity": "high"}] },
  { domain: "goruslugimsk.ru", display_name: "ГорУслуги МСК", category: "Услуги", llm_score: 90, seo_score: 82, schema_score: 100, direct_score: 79, has_llms_txt: true, has_faqpage: true, has_schema: true, errors_count: 10, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "Несколько H1 на странице (2)", "severity": "high"}] },
  { domain: "vc.ru", display_name: "VC.ru", category: "Медиа", llm_score: 80, seo_score: 74, schema_score: 85, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 14, top_errors: [{"title": "42 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "H1 отсутствует", "severity": "critical"}] },
  { domain: "iz.ru", display_name: "Известия", category: "Медиа", llm_score: 80, seo_score: 69, schema_score: 85, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 17, top_errors: [{"title": "robots.txt недоступен", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "7 изображений без width/height (риск CLS)", "severity": "high"}] },
  { domain: "tinkoff.ru", display_name: "Тинькофф", category: "Банки", llm_score: 80, seo_score: 65, schema_score: 85, direct_score: 58, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 18, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "Canonical указывает на другую страницу", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}] },
  { domain: "habr.com", display_name: "Хабр", category: "Медиа", llm_score: 78, seo_score: 84, schema_score: 75, direct_score: 70, has_llms_txt: true, has_faqpage: true, has_schema: true, errors_count: 6, top_errors: ["Неполный llms.txt", "Нет HowTo", "Мало FAQ на хабах"] },
  { domain: "cian.ru", display_name: "ЦИАН", category: "Недвижимость", llm_score: 65, seo_score: 83, schema_score: 85, direct_score: 58, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 19, top_errors: [{"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "30 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "9 битых внутренних ссылок", "severity": "critical"}] },
  { domain: "pikabu.ru", display_name: "Пикабу", category: "Медиа", llm_score: 65, seo_score: 82, schema_score: 30, direct_score: 64, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 18, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "32 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "kommersant.ru", display_name: "Коммерсантъ", category: "Медиа", llm_score: 65, seo_score: 81, schema_score: 85, direct_score: 58, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 22, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}] },
  { domain: "invitro.ru", display_name: "Инвитро", category: "Здоровье", llm_score: 65, seo_score: 79, schema_score: 85, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 15, top_errors: [{"title": "27 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "H1 отсутствует", "severity": "critical"}] },
  { domain: "sports.ru", display_name: "Sports.ru", category: "Медиа", llm_score: 65, seo_score: 74, schema_score: 30, direct_score: 58, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 19, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "80 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "hh.ru", display_name: "HeadHunter", category: "Сервисы", llm_score: 65, seo_score: 74, schema_score: 30, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 16, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "21 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "3 битых внутренних ссылок", "severity": "critical"}] },
  { domain: "avaho.ru", display_name: "Avaho", category: "Недвижимость", llm_score: 65, seo_score: 70, schema_score: 30, direct_score: 58, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 21, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "42 изображений без width/height (риск CLS)", "severity": "high"}] },
  { domain: "ivi.ru", display_name: "ivi", category: "Сервисы", llm_score: 65, seo_score: 67, schema_score: 85, direct_score: 79, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 19, top_errors: [{"title": "Canonical указывает на другую страницу", "severity": "high"}, {"title": "100 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "ria.ru", display_name: "РИА Новости", category: "Медиа", llm_score: 65, seo_score: 66, schema_score: 30, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 16, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "10 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "megafon.ru", display_name: "МегаФон", category: "Телеком", llm_score: 65, seo_score: 62, schema_score: 30, direct_score: 79, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 19, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "Canonical указывает на другую страницу", "severity": "high"}, {"title": "33 изображений без width/height (риск CLS)", "severity": "high"}] },
  { domain: "mts.ru", display_name: "МТС", category: "Телеком", llm_score: 65, seo_score: 62, schema_score: 85, direct_score: 79, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 22, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "86 изображений без width/height (риск CLS)", "severity": "high"}] },
  { domain: "lenta.ru", display_name: "Лента.ру", category: "Медиа", llm_score: 65, seo_score: 61, schema_score: 85, direct_score: 79, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 21, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "beeline.ru", display_name: "Билайн", category: "Телеком", llm_score: 65, seo_score: 54, schema_score: 85, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 21, top_errors: [{"title": "Canonical указывает на другую страницу", "severity": "high"}, {"title": "Медленная загрузка (2.7с)", "severity": "high"}, {"title": "30 изображений без width/height (риск CLS)", "severity": "high"}] },
  { domain: "skillbox.ru", display_name: "Skillbox", category: "Образование", llm_score: 60, seo_score: 87, schema_score: 85, direct_score: 58, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 18, top_errors: [{"title": "26 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "Размытый тематический фокус страницы", "severity": "high"}] },
  { domain: "2gis.ru", display_name: "2ГИС", category: "Сервисы", llm_score: 60, seo_score: 82, schema_score: 30, direct_score: 85, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 15, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "fontanka.ru", display_name: "Фонтанка", category: "Медиа", llm_score: 60, seo_score: 74, schema_score: 30, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 16, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "56 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "docplus.ru", display_name: "DocPlus", category: "Здоровье", llm_score: 60, seo_score: 71, schema_score: 30, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 17, top_errors: [{"title": "20 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "H1 отсутствует", "severity": "critical"}] },
  { domain: "detmir.ru", display_name: "Детский мир", category: "E-commerce", llm_score: 60, seo_score: 69, schema_score: 30, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 18, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "47 изображений без width/height (риск CLS)", "severity": "high"}] },
  { domain: "gazprombank.ru", display_name: "Газпромбанк", category: "Банки", llm_score: 60, seo_score: 66, schema_score: 30, direct_score: 79, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 18, top_errors: [{"title": "87 изображений без width/height (риск CLS)", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "H1 отсутствует", "severity": "critical"}] },
  { domain: "bibinet.ru", display_name: "Bibinet", category: "Авто", llm_score: 60, seo_score: 60, schema_score: 30, direct_score: 79, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 19, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "lamoda.ru", display_name: "Lamoda", category: "E-commerce", llm_score: 55, seo_score: 87, schema_score: 30, direct_score: 79, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 17, top_errors: [{"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "Title и H1 тематически расходятся", "severity": "high"}] },
  { domain: "gazeta.ru", display_name: "Газета.ру", category: "Медиа", llm_score: 55, seo_score: 64, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 17, top_errors: [{"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}, {"title": "H1 отсутствует", "severity": "critical"}] },
  { domain: "vk.com", display_name: "ВКонтакте", category: "Сервисы", llm_score: 55, seo_score: 58, schema_score: 0, direct_score: 64, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 20, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "1 битых внутренних ссылок", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "wildberries.ru", display_name: "Wildberries", category: "E-commerce", llm_score: 50, seo_score: 62, schema_score: 0, direct_score: 64, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 20, top_errors: [{"title": "HTTP статус 498 (не 200)", "severity": "critical"}, {"title": "robots.txt недоступен", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}] },
  { domain: "foxford.ru", display_name: "Foxford", category: "Образование", llm_score: 50, seo_score: 59, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 19, top_errors: [{"title": "HTTP статус 401 (не 200)", "severity": "critical"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}] },
  { domain: "kinopoisk.ru", display_name: "Кинопоиск", category: "Сервисы", llm_score: 50, seo_score: 59, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 16, top_errors: [{"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}, {"title": "Тег <title> отсутствует", "severity": "critical"}] },
  { domain: "dns-shop.ru", display_name: "DNS", category: "E-commerce", llm_score: 50, seo_score: 59, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 18, top_errors: [{"title": "HTTP статус 401 (не 200)", "severity": "critical"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}] },
  { domain: "gosuslugi.ru", display_name: "Госуслуги", category: "Госорганы", llm_score: 50, seo_score: 59, schema_score: 30, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 17, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "gb.ru", display_name: "GeekBrains", category: "Образование", llm_score: 50, seo_score: 59, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 19, top_errors: [{"title": "HTTP статус 401 (не 200)", "severity": "critical"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}] },
  { domain: "tass.ru", display_name: "ТАСС", category: "Медиа", llm_score: 50, seo_score: 57, schema_score: 0, direct_score: 85, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 18, top_errors: [{"title": "HTTP статус 403 (не 200)", "severity": "critical"}, {"title": "robots.txt недоступен", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}] },
  { domain: "alfabank.ru", display_name: "Альфа-Банк", category: "Банки", llm_score: 50, seo_score: 57, schema_score: 0, direct_score: 85, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 18, top_errors: [{"title": "HTTP статус 403 (не 200)", "severity": "critical"}, {"title": "robots.txt недоступен", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}] },
  { domain: "drom.ru", display_name: "Дром", category: "E-commerce", llm_score: 50, seo_score: 57, schema_score: 85, direct_score: 100, has_llms_txt: false, has_faqpage: true, has_schema: true, errors_count: 24, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}] },
  { domain: "auto.ru", display_name: "Авто.ру", category: "Авто", llm_score: 50, seo_score: 54, schema_score: 30, direct_score: 64, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 21, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Title не содержит ключевое слово тематики", "severity": "high"}] },
  { domain: "mail.ru", display_name: "Mail.ru", category: "Сервисы", llm_score: 50, seo_score: 54, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 17, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Тег <title> отсутствует", "severity": "critical"}] },
  { domain: "yandex.ru", display_name: "Яндекс", category: "Сервисы", llm_score: 50, seo_score: 54, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 19, top_errors: [{"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}] },
  { domain: "domclick.ru", display_name: "ДомКлик", category: "Недвижимость", llm_score: 50, seo_score: 54, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 19, top_errors: [{"title": "HTTP статус 401 (не 200)", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}] },
  { domain: "rbc.ru", display_name: "РБК", category: "Медиа", llm_score: 50, seo_score: 54, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 20, top_errors: [{"title": "HTTP статус 401 (не 200)", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}] },
  { domain: "av.ru", display_name: "АвтоВАЗ", category: "Авто", llm_score: 50, seo_score: 54, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 20, top_errors: [{"title": "HTTP статус 450 (не 200)", "severity": "critical"}, {"title": "robots.txt недоступен", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}] },
  { domain: "sber.ru", display_name: "Сбер", category: "Банки", llm_score: 50, seo_score: 54, schema_score: 30, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 19, top_errors: [{"title": "robots.txt недоступен", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}] },
  { domain: "eapteka.ru", display_name: "Еаптека", category: "Здоровье", llm_score: 50, seo_score: 46, schema_score: 0, direct_score: 85, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 21, top_errors: [{"title": "HTTP статус 503 (не 200)", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}] },
  { domain: "avito.ru", display_name: "Авито", category: "E-commerce", llm_score: 50, seo_score: 46, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 24, top_errors: [{"title": "HTTP статус 429 (не 200)", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}] },
  { domain: "citilink.ru", display_name: "Ситилинк", category: "E-commerce", llm_score: 50, seo_score: 41, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 21, top_errors: [{"title": "HTTP статус 429 (не 200)", "severity": "critical"}, {"title": "robots.txt недоступен", "severity": "critical"}, {"title": "sitemap.xml недоступен", "severity": "high"}] },
  { domain: "goldapple.ru", display_name: "Золотое Яблоко", category: "E-commerce", llm_score: 50, seo_score: 41, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 20, top_errors: [{"title": "Страница закрыта от индексации в robots.txt", "severity": "critical"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}] },
  { domain: "rt.ru", display_name: "Ростелеком", category: "Телеком", llm_score: 50, seo_score: 41, schema_score: 0, direct_score: 61, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 21, top_errors: [{"title": "robots.txt недоступен", "severity": "critical"}, {"title": "Отсутствует <link rel=\"canonical\">", "severity": "high"}, {"title": "Нет meta viewport — сайт не адаптивный", "severity": "critical"}] },
  { domain: "rostelecom.ru", display_name: "Ростелеком", category: "Телеком", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "prodoctorov.ru", display_name: "ПроДокторов", category: "Здоровье", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "sberhealth.ru", display_name: "СберЗдоровье", category: "Здоровье", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "n1.ru", display_name: "N1.RU", category: "Недвижимость", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "yandex-realty.ru", display_name: "Яндекс Недвижимость", category: "Недвижимость", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "kp.ru", display_name: "Комсомольская правда", category: "Медиа", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "stepik.org", display_name: "Stepik", category: "Образование", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "skillfactory.ru", display_name: "SkillFactory", category: "Образование", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "ozon.ru", display_name: "Ozon", category: "E-commerce", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 1, top_errors: [{"title": "Сайт недоступен или заблокировал запрос", "severity": "critical"}] },
  { domain: "mvideo.ru", display_name: "М.Видео", category: "E-commerce", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 1, top_errors: [{"title": "Сайт недоступен или заблокировал запрос", "severity": "critical"}] },
  { domain: "tele2.ru", display_name: "Tele2", category: "Телеком", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "sportmaster.ru", display_name: "Спортмастер", category: "E-commerce", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "sbermegamarket.ru", display_name: "Мегамаркет", category: "E-commerce", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "vseinstrumenti.ru", display_name: "ВсеИнструменты", category: "E-commerce", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "petrovich.ru", display_name: "Петрович", category: "E-commerce", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "rg.ru", display_name: "Российская газета", category: "Медиа", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "vedomosti.ru", display_name: "Ведомости", category: "Медиа", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "vtb.ru", display_name: "ВТБ", category: "Банки", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "raiffeisen.ru", display_name: "Райффайзен", category: "Банки", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "open.ru", display_name: "Открытие", category: "Банки", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "sovcombank.ru", display_name: "Совкомбанк", category: "Банки", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "uralsib.ru", display_name: "Уралсиб", category: "Банки", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "youla.ru", display_name: "Юла", category: "Сервисы", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "superjob.ru", display_name: "SuperJob", category: "Сервисы", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "zoon.ru", display_name: "Zoon", category: "Сервисы", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "netology.ru", display_name: "Нетология", category: "Образование", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "leroymerlin.ru", display_name: "Леруа Мерлен", category: "E-commerce", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: true, has_schema: false, errors_count: 1, top_errors: [{"title": "Сайт недоступен или заблокировал запрос", "severity": "critical"}] },
  { domain: "nalog.gov.ru", display_name: "ФНС", category: "Госорганы", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "mos.ru", display_name: "Mos.ru", category: "Госорганы", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] },
  { domain: "pfr.gov.ru", display_name: "СФР", category: "Госорганы", llm_score: 0, seo_score: 0, schema_score: 0, direct_score: 0, has_llms_txt: false, has_faqpage: false, has_schema: false, errors_count: 0, top_errors: [] }
];

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

  const sql = postgres(DATABASE_URL, { max: 5, idle_timeout: 10, connect_timeout: 10 });

  try {
    console.log(`📦 Seed data: ${SEED_DATA.length} rows`);

    // Check for duplicates
    const dupes = await sql`
      SELECT domain, count(*)::int as cnt
      FROM geo_rating
      GROUP BY domain
      HAVING count(*) > 1
    `;

    if (dupes.length > 0) {
      console.error(`❌ Found ${dupes.length} duplicate domain(s) in local geo_rating:`);
      for (const d of dupes) {
        console.error(`   ${d.domain} — ${d.cnt} rows`);
      }
      console.error('Fix duplicates manually before running migration.');
      process.exit(1);
    }

    console.log('✅ No duplicates in local geo_rating — safe to proceed');

    // Create unique index
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_rating_domain ON geo_rating(domain)`;
    console.log('✅ Unique index on domain ensured');

    // Upsert rows
    let upserted = 0;
    for (const row of SEED_DATA) {
      await sql`
        INSERT INTO geo_rating (
          domain, display_name, category,
          llm_score, seo_score, schema_score, direct_score,
          has_llms_txt, has_faqpage, has_schema,
          errors_count, top_errors,
          last_checked_at, created_at
        ) VALUES (
          ${row.domain},
          ${row.display_name},
          ${row.category},
          ${row.llm_score},
          ${row.seo_score},
          ${row.schema_score},
          ${row.direct_score},
          ${row.has_llms_txt},
          ${row.has_faqpage},
          ${row.has_schema},
          ${row.errors_count},
          ${JSON.stringify(row.top_errors)},
          ${new Date().toISOString()},
          ${new Date().toISOString()}
        )
        ON CONFLICT (domain) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          category = EXCLUDED.category,
          llm_score = EXCLUDED.llm_score,
          seo_score = EXCLUDED.seo_score,
          schema_score = EXCLUDED.schema_score,
          direct_score = EXCLUDED.direct_score,
          has_llms_txt = EXCLUDED.has_llms_txt,
          has_faqpage = EXCLUDED.has_faqpage,
          has_schema = EXCLUDED.has_schema,
          errors_count = EXCLUDED.errors_count,
          top_errors = EXCLUDED.top_errors,
          last_checked_at = EXCLUDED.last_checked_at
      `;
      upserted++;
    }

    console.log(`✅ Upserted ${upserted} rows into local geo_rating`);

    // Verify
    const [{ cnt }] = await sql`SELECT count(*)::int as cnt FROM geo_rating`;
    console.log(`✅ Total rows in local geo_rating: ${cnt}`);

    const sample = await sql`SELECT domain, llm_score, seo_score FROM geo_rating ORDER BY llm_score DESC LIMIT 5`;
    console.log('📊 Top 5:');
    for (const r of sample) {
      console.log(`   ${r.domain} — llm: ${r.llm_score}, seo: ${r.seo_score}`);
    }

    console.log('\n🎉 Done!');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
