/**
 * Site Formula PRO — матрица «тип проекта → форма Шага 2».
 *
 * Описывает, какие поля показывать пользователю в зависимости от выбранного
 * типа проекта (23 вертикали из formula_project_types). Каждый тип попадает
 * в один из 7 «семейств», которые задают подписи и видимость полей.
 *
 * Зачем: например, для «Медиа / журнал» бессмысленно спрашивать «Отрасль /
 * основная услуга» и «Города работы» — там рубрики и нет геобинда. Для SaaS
 * города тоже не нужны, а отрасль превращается в «вертикаль клиентов».
 *
 * Используется в:
 *   • SiteFormulaV3.tsx (Шаг 2 — рендер UI)
 *   • SiteFormulaV3.tsx (handleSubmit — фильтрация payload)
 */

import type { ProjectTypeCodeV3 } from '@/lib/api/formulaV3';

/** Семейство типа: определяет подписи и видимость полей. */
export type IntakeFamily =
  | 'local_service' // service_geo, service_pro, service_b2b, medical, legal, realestate, hospitality, events, finance
  | 'ecom'          // ecommerce, marketplace
  | 'digital_product' // saas, mobile_app
  | 'content_media' // media, blog, b2b_media
  | 'education'     // education
  | 'personal'      // personal_brand, portfolio
  | 'special';      // promo_event, franchise_multi, nonprofit, gov

export interface IntakeShape {
  family: IntakeFamily;
  /** Подпись для поля industry (бывшая «Отрасль / основная услуга»). */
  industryLabel: string;
  /** Плейсхолдер для поля industry. */
  industryPlaceholder: string;
  /** Подсказка под полем industry. */
  industryHint: string;
  /** Показывать ли поле «Города работы». */
  showCities: boolean;
  /** Подпись поля городов (если showCities = true). */
  citiesLabel?: string;
  /** Подсказка под полем городов. */
  citiesHint?: string;
  /** Опциональны ли города (для ecom — самовывоз; иначе обязательны для local_service). */
  citiesOptional: boolean;
  /** Подпись свёрнутого блока «Уточнить услуги» (на каждый тип своё слово). */
  servicesBlockLabel: string;
  /** Подсказка над списком пресетов услуг. */
  servicesPresetHint: string;
  /** Плейсхолдер инпута «добавить свои через запятую». */
  servicesCustomPlaceholder: string;
}

/** Карта 27 кодов → семейство (PR-11). */
const FAMILY_BY_CODE: Record<ProjectTypeCodeV3, IntakeFamily> = {
  // local_service — нужен геобинд
  service_geo: 'local_service',
  service_pro: 'local_service',
  service_b2b: 'local_service',
  medical: 'local_service',
  legal: 'local_service',
  realestate: 'local_service',
  hospitality: 'local_service',
  events: 'local_service',
  finance: 'local_service',
  // PR-11: подкатегории локальных услуг — все требуют геобинда
  service_pest_control: 'local_service',
  service_repair_home: 'local_service',
  service_auto: 'local_service',
  service_beauty: 'local_service',
  // ecom — города опциональны (самовывоз / офлайн-точки)
  ecommerce: 'ecom',
  marketplace: 'ecom',
  // digital_product — города не нужны
  saas: 'digital_product',
  mobile_app: 'digital_product',
  // content_media — города не нужны, отрасль = тематика
  media: 'content_media',
  blog: 'content_media',
  b2b_media: 'content_media',
  // education — города опциональны (офлайн-программы)
  education: 'education',
  // personal — города опциональны
  personal_brand: 'personal',
  portfolio: 'personal',
  // special — города зависят от смысла, по умолчанию опциональны
  promo_event: 'special',
  franchise_multi: 'special',
  nonprofit: 'special',
  gov: 'special',
};

/** Шаблоны полей для каждого семейства. */
const SHAPES: Record<IntakeFamily, Omit<IntakeShape, 'family'>> = {
  local_service: {
    industryLabel: 'Отрасль / основная услуга',
    industryPlaceholder: 'Выберите или начните вводить…',
    industryHint:
      'Нажмите и выберите из списка или введите свою формулировку.',
    showCities: true,
    citiesLabel: 'Города работы',
    citiesHint: 'Нужны для локальных услуг. Первый в списке — основной для SEO.',
    citiesOptional: false,
    servicesBlockLabel: 'Уточнить услуги вручную',
    servicesPresetHint:
      'Кликайте по подходящим услугам — это сузит seed-запросы для Wordstat.',
    servicesCustomPlaceholder: 'Добавить свои через запятую…',
  },
  ecom: {
    industryLabel: 'Категория товаров',
    industryPlaceholder: 'Выберите или введите категорию…',
    industryHint:
      'Главная категория каталога. Семантика и атрибуты подберутся под неё.',
    showCities: true,
    citiesLabel: 'Города (если есть самовывоз / офлайн-точки)',
    citiesHint:
      'Нужны только если у вас есть пункты выдачи или офлайн-магазины. Иначе оставьте пустым.',
    citiesOptional: true,
    servicesBlockLabel: 'Уточнить категории каталога',
    servicesPresetHint:
      'Кликайте по подходящим категориям — формула соберёт под них структуру каталога.',
    servicesCustomPlaceholder: 'Добавить свои категории через запятую…',
  },
  digital_product: {
    industryLabel: 'Отраслевая ниша клиентов',
    industryPlaceholder: 'Например: HR-tech, ритейл, B2B-логистика…',
    industryHint:
      'В какой вертикали работают ваши клиенты. Используется для семантики и AI-ready контента.',
    showCities: false,
    citiesOptional: true,
    servicesBlockLabel: 'Уточнить use-cases / сценарии',
    servicesPresetHint:
      'Кликайте по сценариям — формула соберёт под них use-case-страницы и semantic-кластеры.',
    servicesCustomPlaceholder: 'Добавить свои сценарии через запятую…',
  },
  content_media: {
    industryLabel: 'Тематика медиа',
    industryPlaceholder: 'Например: финансы, маркетинг, IT…',
    industryHint:
      'Главная тематика проекта. Города не нужны — медиа работает без геобинда.',
    showCities: false,
    citiesOptional: true,
    servicesBlockLabel: 'Уточнить рубрики',
    servicesPresetHint:
      'Кликайте по рубрикам — формула соберёт под них структуру навигации и тегов.',
    servicesCustomPlaceholder: 'Добавить свои рубрики через запятую…',
  },
  education: {
    industryLabel: 'Направление обучения',
    industryPlaceholder: 'Например: IT-курсы, языки, подготовка к ЕГЭ…',
    industryHint:
      'Основная тематика курсов. Семантика и страницы программ подберутся под неё.',
    showCities: true,
    citiesLabel: 'Города (только для офлайн-программ)',
    citiesHint:
      'Нужны, если ведёте офлайн-набор. Для онлайн-школ оставьте пустым.',
    citiesOptional: true,
    servicesBlockLabel: 'Уточнить курсы / программы',
    servicesPresetHint:
      'Кликайте по программам — формула соберёт под них кластеры и landings.',
    servicesCustomPlaceholder: 'Добавить свои программы через запятую…',
  },
  personal: {
    industryLabel: 'Сфера деятельности',
    industryPlaceholder: 'Например: фотограф, дизайнер, разработчик…',
    industryHint: 'Кто вы и чем занимаетесь. Используется для портфолио и SEO.',
    showCities: true,
    citiesLabel: 'Города (опционально)',
    citiesHint: 'Если работаете локально — добавьте. Иначе оставьте пустым.',
    citiesOptional: true,
    servicesBlockLabel: 'Уточнить услуги / типы работ',
    servicesPresetHint:
      'Кликайте по своим услугам — формула соберёт под них семантику и кейсы.',
    servicesCustomPlaceholder: 'Добавить свои услуги через запятую…',
  },
  special: {
    industryLabel: 'Тематика проекта',
    industryPlaceholder: 'Опишите коротко…',
    industryHint:
      'Сфера или ниша. Если не уверены — формула возьмёт значение по типу проекта.',
    showCities: true,
    citiesLabel: 'Города (опционально)',
    citiesHint: 'Заполните, если проект привязан к конкретным локациям.',
    citiesOptional: true,
    servicesBlockLabel: 'Уточнить направления',
    servicesPresetHint:
      'Кликайте по подходящим направлениям, чтобы сузить семантику.',
    servicesCustomPlaceholder: 'Добавить свои направления через запятую…',
  },
};

/** Главный геттер — возвращает форму Шага 2 для конкретного типа проекта. */
export function getIntakeShapeFor(code: ProjectTypeCodeV3): IntakeShape {
  const family = FAMILY_BY_CODE[code];
  return { family, ...SHAPES[family] };
}

/** Семейство по коду — для условной логики снаружи. */
export function getIntakeFamily(code: ProjectTypeCodeV3): IntakeFamily {
  return FAMILY_BY_CODE[code];
}
