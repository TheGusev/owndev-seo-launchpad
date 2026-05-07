# Санитарные Решения РФ — Demand Intelligence

Скрипты для запуска формулы (V3 pipeline) на проекте «Санитарные Решения РФ»
с реальными данными Yandex Cloud SearchAPI v2 (Wordstat).

## Файлы

- `seeds.json` — конфиг проекта: бренд, geo-таргеты, 31 seed-запрос (9 услуг + 14 city/service + 8 city-general)
- `setup-env-prod.sh` — подключение SearchAPI на проде 155.212.188.244 (правит .env, перезапускает PM2)
- `run-demand.sh` — запуск V3 pipeline через POST /api/v3/pipeline (только demand-стадия)

## Порядок действий

### 1. Получить API-ключ Yandex Cloud SearchAPI

Инструкция в чате (console.cloud.yandex.ru → Service Account `searchapi-wordstat`
с ролью `search-api.executor` → API key).

Понадобится:
- `YANDEX_FOLDER_ID` (формат `b1g...`, 20 символов)
- `YANDEX_IAM_TOKEN` (значение API-key, формат `AQVN...`, ~50 символов)

### 2. Подключить на проде

```bash
ssh root@155.212.188.244
cd /opt/owndev/owndev-backend
YANDEX_FOLDER_ID=b1g... YANDEX_IAM_TOKEN=AQVN... bash scripts/sanit-solutions-rf/setup-env-prod.sh
```

### 3. Запустить demand intelligence

```bash
bash scripts/sanit-solutions-rf/run-demand.sh https://owndev.ru
```

или локально:

```bash
bash scripts/sanit-solutions-rf/run-demand.sh http://localhost:3000
```

### 4. Получить результат

`GET /api/v3/pipeline/<job_id>` вернёт:
- `demand.clusters` — кластеры запросов с реальной частотностью
- `demand.geo_distribution` — реальная популярность по городам
- `demand.recommended_geos` — топ регионов
- `strategy.pages` — страницы которые формула рекомендует создать первой волной

## Лимиты

- Бесплатная квота: 100 000 sync-units/день
- Стоимость одного полного прогона: ~50-58 единиц (0.06% квоты)
- Можно прогонять формулу хоть каждый час
