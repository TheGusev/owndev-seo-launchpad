/**
 * Site Formula PRO — пресеты для UX wizard'а (Шаг 2).
 *
 * • INDUSTRY_PRESETS — typeahead-список популярных отраслей.
 * • AUDIENCE_PRESETS — мульти-выбор чипами целевой аудитории.
 * • POPULAR_CITIES   — автодополнение городов РФ.
 *
 * Группировка отраслей по project_code из 23 типов проектов помогает
 * подсветить релевантные пресеты в зависимости от выбранного типа.
 */

import type { ProjectTypeCodeV3 } from '@/lib/api/formulaV3';

export interface IndustryPreset {
  /** Что юзер увидит и что отправится в brand.industry */
  label: string;
  /** Подходящие коды проекта — для группировки/приоритизации (опц.). */
  matches?: ProjectTypeCodeV3[];
}

/** ~50 популярных отраслей малого/среднего бизнеса в РФ. */
export const INDUSTRY_PRESETS: IndustryPreset[] = [
  // service_geo — локальные услуги
  { label: 'Грузоперевозки', matches: ['service_geo'] },
  { label: 'Ремонт квартир', matches: ['service_geo'] },
  { label: 'Клининг / уборка', matches: ['service_geo'] },
  { label: 'Автосервис / СТО', matches: ['service_geo'] },
  { label: 'Шиномонтаж', matches: ['service_geo'] },
  { label: 'Эвакуатор', matches: ['service_geo'] },
  { label: 'Натяжные потолки', matches: ['service_geo'] },
  { label: 'Окна и двери', matches: ['service_geo'] },
  { label: 'Сантехнические услуги', matches: ['service_geo'] },
  { label: 'Электромонтаж', matches: ['service_geo'] },
  { label: 'Бурение скважин', matches: ['service_geo'] },
  { label: 'Изготовление мебели на заказ', matches: ['service_geo'] },

  // service_pro — профессиональные услуги
  { label: 'Юридические услуги', matches: ['service_pro', 'legal'] },
  { label: 'Бухгалтерское сопровождение', matches: ['service_pro'] },
  { label: 'Финансовый консалтинг', matches: ['service_pro', 'finance'] },
  { label: 'Маркетинговое агентство', matches: ['service_pro', 'service_b2b'] },
  { label: 'Дизайн интерьера', matches: ['service_pro'] },
  { label: 'Архитектурное бюро', matches: ['service_pro'] },
  { label: 'Психология / коучинг', matches: ['service_pro'] },

  // medical
  { label: 'Стоматология', matches: ['medical'] },
  { label: 'Косметология', matches: ['medical'] },
  { label: 'Многопрофильная клиника', matches: ['medical'] },
  { label: 'Ветеринарная клиника', matches: ['medical'] },
  { label: 'Лабораторные анализы', matches: ['medical'] },

  // realestate
  { label: 'Агентство недвижимости', matches: ['realestate'] },
  { label: 'Застройщик / девелопер', matches: ['realestate'] },
  { label: 'Аренда жилья посуточно', matches: ['realestate'] },

  // education
  { label: 'Онлайн-школа', matches: ['education'] },
  { label: 'Языковая школа', matches: ['education'] },
  { label: 'Детский развивающий центр', matches: ['education'] },
  { label: 'Курсы повышения квалификации', matches: ['education'] },

  // ecommerce / marketplace
  { label: 'Интернет-магазин одежды', matches: ['ecommerce'] },
  { label: 'Интернет-магазин электроники', matches: ['ecommerce'] },
  { label: 'Интернет-магазин косметики', matches: ['ecommerce'] },
  { label: 'Магазин товаров для дома', matches: ['ecommerce'] },
  { label: 'Маркетплейс услуг', matches: ['marketplace'] },
  { label: 'Маркетплейс товаров', matches: ['marketplace'] },

  // service_b2b / saas
  { label: 'B2B SaaS-продукт', matches: ['saas', 'service_b2b'] },
  { label: 'CRM / автоматизация бизнеса', matches: ['saas'] },
  { label: 'Корпоративные сервисы', matches: ['service_b2b'] },
  { label: 'IT-аутсорсинг', matches: ['service_b2b'] },

  // hospitality / events
  { label: 'Ресторан / кафе', matches: ['hospitality'] },
  { label: 'Гостиница / отель', matches: ['hospitality'] },
  { label: 'Организация мероприятий', matches: ['events'] },
  { label: 'Свадебное агентство', matches: ['events'] },

  // media / blog / portfolio
  { label: 'Личный бренд / блогер', matches: ['personal_brand', 'portfolio'] },
  { label: 'Медиапроект / блог', matches: ['blog', 'media'] },
  { label: 'Фотограф / видеограф', matches: ['portfolio'] },

  // финансы / прочее
  { label: 'Микрофинансовая организация', matches: ['finance'] },
  { label: 'Страховое агентство', matches: ['finance'] },
  { label: 'Франчайзинговая сеть', matches: ['franchise_multi'] },
  { label: 'Промо-сайт / лендинг под акцию', matches: ['promo_event'] },
];

/** Чипы для целевой аудитории — мульти-выбор. */
export const AUDIENCE_PRESETS: string[] = [
  'B2C — частные клиенты',
  'B2B — компании и организации',
  'Малый бизнес / ИП',
  'Премиум-сегмент',
  'Молодёжь 18–30',
  'Семьи с детьми',
  'Старшее поколение 55+',
  'Государственные учреждения',
];

/** Топ-50 городов РФ для автодополнения (по населению). */
export const POPULAR_CITIES: string[] = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
  'Нижний Новгород', 'Челябинск', 'Самара', 'Уфа', 'Ростов-на-Дону',
  'Краснодар', 'Омск', 'Воронеж', 'Пермь', 'Волгоград',
  'Красноярск', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск',
  'Барнаул', 'Ульяновск', 'Иркутск', 'Хабаровск', 'Ярославль',
  'Махачкала', 'Владивосток', 'Оренбург', 'Томск', 'Кемерово',
  'Новокузнецк', 'Рязань', 'Астрахань', 'Набережные Челны', 'Пенза',
  'Липецк', 'Киров', 'Чебоксары', 'Балашиха', 'Тула',
  'Калининград', 'Курск', 'Ставрополь', 'Севастополь', 'Сочи',
  'Тверь', 'Магнитогорск', 'Иваново', 'Брянск', 'Белгород',
];

/**
 * Названия табов для группировки 23 типов проекта.
 * Бэк по-прежнему хранит tier='A'/'B'/'C', но юзеру показываем
 * понятные слова без терминологии Tier.
 */
export const TIER_TAB_LABELS: Record<'A' | 'B' | 'C', string> = {
  A: 'Сайты (Web/SEO)',
  B: 'Приложения',
  C: 'Особые ниши',
};

/**
 * Подсказка к каждому табу — краткое объяснение что это значит.
 */
export const TIER_TAB_DESCRIPTIONS: Record<'A' | 'B' | 'C', string> = {
  A: 'Веб-сайты с упором на SEO: услуги, e-commerce, маркетплейсы, SaaS-лендинги, медиа.',
  B: 'Мобильные и веб-приложения с упором на onboarding, retention, app store.',
  C: 'Регулируемые ниши и нестандартные проекты: медицина, юристы, недвижимость, личный бренд, франшизы.',
};
