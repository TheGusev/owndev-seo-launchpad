

## Расширение GEO Рейтинга до 100+ сайтов + авто-номинация

### Концепция

**Два источника пополнения рейтинга:**

1. **Ручной seed** — добавить ещё ~70 доменов в таблицу `geo_rating` (сейчас 30), покрывая больше категорий и ниш
2. **Авто-номинация** — когда пользователь прогоняет свой сайт через Site Check и получает высокий балл, показать ему предложение «Попасть в GEO Рейтинг»

### Как работает авто-номинация

На странице результатов (`SiteCheckResult`) — если `total >= 70` (проходной балл), появляется карточка-баннер:

```
🏆 Ваш сайт набрал 82/100 — это уровень ТОП-рейтинга!
[Добавить в GEO Рейтинг]
```

По клику — модалка с формой:
- Название бренда (prefilled из домена)
- Категория (выбор из списка + «Другое»)
- Email (для уведомления о добавлении)

Заявка сохраняется в новую таблицу `geo_rating_nominations` со статусом `pending`. Мы можем вручную одобрять или настроить авто-одобрение для баллов 80+.

### Что нужно сделать

#### 1. Новая таблица `geo_rating_nominations`
```sql
CREATE TABLE geo_rating_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL DEFAULT 'Другое',
  email text,
  scan_id uuid,
  total_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending / approved / rejected
  created_at timestamptz DEFAULT now()
);
```
С RLS: public INSERT (чтобы анонимные пользователи могли номинировать), service_role для UPDATE/DELETE.

#### 2. Добавить ~70 новых доменов в `geo_rating`
INSERT батчами — российские топ-сайты по категориям:
- **E-commerce**: lamoda, dns-shop, citilink, mvideo, detmir, sportmaster, leroy, ikea и др.
- **Медиа**: lenta.ru, rbc.ru, kommersant.ru, iz.ru, kp.ru и др.
- **Банки**: sber.ru, vtb.ru, alfabank.ru, raiffeisen.ru и др.
- **Сервисы**: avito.ru, hh.ru, 2gis.ru, drom.ru и др.
- **Образование**: skillbox.ru, gb.ru, netology.ru и др.
- **Госорганы**: gosuslugi.ru, nalog.gov.ru и др.
- **Телеком**: rostelecom.ru, megafon.ru и др.
- **Новые категории**: «Услуги», «Здоровье», «Авто», «Недвижимость»

#### 3. Баннер номинации на `SiteCheckResult`
Новый компонент `GeoRatingNomination` — появляется при `total >= 70`. Отправляет INSERT в `geo_rating_nominations`.

#### 4. Обновить фильтры категорий на `/geo-rating`
Вместо хардкода — динамически из БД (`SELECT DISTINCT category FROM geo_rating`).

#### 5. Обновить данные
После добавления новых доменов — прогнать `geo-rating-cron` батчами для получения реальных баллов.

### Изменения

| Что | Действие |
|-----|----------|
| БД: `geo_rating_nominations` | Новая таблица + RLS |
| БД: `geo_rating` | INSERT ~70 новых доменов |
| `src/components/site-check/GeoRatingNomination.tsx` | Новый компонент — баннер + форма |
| `src/pages/SiteCheckResult.tsx` | Добавить баннер номинации |
| `src/pages/GeoRating.tsx` | Динамические категории из БД |

