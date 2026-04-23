

## Sprint 9 — обновление UI прогресса и списка «Что проверяем»

### Что не так сейчас

1. **`SiteCheck.tsx` строки 28–39** — список «Что проверяем» врёт: показывает «Топ‑10 конкурентов», «200+ ключевых слов», «Минус‑слова для Директа», «Direct Readiness», «AI‑генерация Директа» — этого больше нет в pipeline (удалили в Sprint 2). Реально pipeline отдаёт GEO/SEO/CRO + robots/sitemap/llms/security.txt + Schema.org + бенчмарк по категории.
2. **`ScanProgress.tsx`** — этапы пролетают за 5–10 сек, пользователь не успевает прочитать. На мобильной версии — тем более. Нужны под‑шаги (sub‑steps) внутри каждой стадии и микро‑анимации в стиле кода/терминала, чтобы каждая стадия «жила» 1.5–3 сек минимум визуально.
3. **`SiteCheck.tsx` строка 222** — meta description врёт про «конкуренты, 200+ ключей, минус‑слова».
4. **`ReportValue.tsx`** — список содержимого PDF/Word врёт про конкурентов, семантику 150+, минус‑слова.

### Что делаем

#### 1. Обновить «Что проверяем» (`SiteCheck.tsx`)

Заменить 10 пунктов на актуальные 10 пунктов под новый pipeline:

| Иконка | Текст |
|--------|-------|
| `Brain` | **GEO Score** — AI‑видимость (Schema, llms.txt, контент) |
| `Search` | **SEO Score** — title/meta/H1/canonical/OG/robots |
| `Target` | **CRO Score** — формы, CTA, контакты, доверие |
| `FileText` | robots.txt + AI‑боты (GPTBot, Claude, Perplexity) |
| `Globe` | sitemap.xml + редиректы + HTTPS/HSTS |
| `ShieldCheck` | llms.txt / llms‑full.txt / security.txt |
| `Cpu` | Schema.org (Organization, Product, FAQ, Article) |
| `Sparkles` | Глубокий анализ HTML: ресурсы, GEO‑сигналы (E‑E‑A‑T) |
| `Key` | Сравнение с эталоном категории (бенчмарк) |
| `Download` | Экспорт PDF / Word |

Также: 
- сделать карточки в **«стиле кода»** — моноширинный префикс `> check:` слева, как в терминале;
- добавить тонкое cyan свечение на иконках; 
- убрать `CSV` из последнего пункта (его в реальности нет).

#### 2. ScanProgress: «живой терминал» с под‑шагами

Под каждой из 6 стадий показывать **бегущий ticker** под‑операций в стиле псевдо‑кода (моноширинный, с `▸` префиксом). При активной стадии — циклически прокручивать через 3–5 строк раз в ~700мс. Это имитирует «работу» даже когда бэк уже завершил стадию.

Минимальная длительность визуального показа стадии — **1.5 сек** (lerp prop `displayProgress` к `realProgress`, скорость подъёма ≤ 30%/сек).

Под‑шаги по стадиям:

```text
[Запуск]
  ▸ resolve DNS...
  ▸ init scan_id
  ▸ check rate-limit

[Загрузка и заголовки]
  ▸ GET / → 200
  ▸ trace redirects (max 10)
  ▸ TLS handshake · HSTS
  ▸ parse response headers
  ▸ check cache-control

[Технические файлы]
  ▸ fetch /robots.txt
  ▸ check AI bots: GPTBot, Claude, Perplexity
  ▸ fetch /sitemap.xml
  ▸ fetch /llms.txt + /llms-full.txt
  ▸ fetch /.well-known/security.txt

[Глубокий анализ HTML]
  ▸ parse <head> · meta · canonical
  ▸ count H1/H2/H3 · word count
  ▸ extract Schema.org JSON-LD
  ▸ scan resources · images · scripts
  ▸ detect GEO signals (E-E-A-T)
  ▸ detect CRO signals (CTA, forms)

[AI-анализ темы и контента]
  ▸ build prompt · 1 LLM call
  ▸ classify category
  ▸ score content quality
  ▸ extract topics

[Расчёт скоров]
  ▸ calc GEO score (7 components)
  ▸ calc SEO score (5 components)
  ▸ calc CRO score (6 components)
  ▸ compare to category benchmark
  ▸ build issues + priority
```

Дополнительно:
- **Tabular‑numbers таймер** уже есть, оставить;
- На мобиле список под‑шагов — высота 1 строка (показывать только текущий сабстеп с fade‑transition), на десктопе — 2 строки одновременно;
- Добавить мини «pulsing cursor» `▮` в конце активного сабстепа — как в терминале;
- Замедление: `displayProgress` догоняет `realProgress` через `useAnimationFrame`, шаг ≤ 30%/сек; если `realProgress=100`, то догон до 100% + 400мс задержка перед `onComplete`.

#### 3. Обновить meta и описания

- **`SiteCheck.tsx:222`** — meta description: `"Проверьте GEO Score, SEO Score и CRO Score сайта бесплатно. Schema.org, llms.txt, robots.txt, бенчмарк по категории. PDF и Word отчёт за 60 секунд."`
- **`ReportValue.tsx`** — обновить `pdfItems` и `wordItems`:
  - PDF: «Триада скоров (GEO/SEO/CRO)», «Технический паспорт сайта», «Schema.org валидация», «robots.txt + AI‑боты», «llms.txt анализ», «GEO/CRO сигналы», «Бенчмарк по категории», «Приоритетный action plan с шагами»
  - Word: «Все разделы PDF + редактирование», «Пример кода для каждой ошибки», «Оглавление с навигацией», «Колонтитулы», «Тёмная тема (Calibri, A4)», «Идеально для клиентских презентаций»
  - Убрать строку про «CSV ключевых слов · TXT минус‑слов» внизу.
- **`TypingCodeBlock` пример** в ReportValue: заменить `"seo_score": 87, "llm_score": 74` → показать триаду:
  ```
  { "url": "https://yoursite.ru",
    "geo_score": 78, "seo_score": 87, "cro_score": 65,
    "issues": 12, "fixes": 12,
    "exports": ["pdf", "docx"] }
  ```

### Технические детали

**Файлы:**
- `src/pages/SiteCheck.tsx` — `checkItems[]` (строки 28–39), meta description (строка 222), импорты иконок.
- `src/components/site-check/ScanProgress.tsx` — добавить `subSteps: string[]` в `Stage`, новый компонент `<SubstepTicker>` с цикличной сменой строк через `useEffect + setInterval`, добавить `displayProgress` через `requestAnimationFrame` lerp.
- `src/components/landing/ReportValue.tsx` — `pdfItems`, `wordItems`, footer‑строка, `TypingCodeBlock.lines`.

**Адаптив:**
- mobile (`< sm`): 1 видимый сабстеп, высота карточки стадии не растёт более чем на 18px.
- desktop: 2 видимых сабстепа, высота +28px.
- Никаких новых зависимостей. Только `framer-motion` (уже есть) для fade‑transition сабстепов.

**Производительность:**
- Сабстеп‑тикер — `setInterval(700ms)`, очищается при unmount/смене стадии.
- `displayProgress` lerp — `requestAnimationFrame`, останавливается при ≥100%.

**Изменений в бэке нет** — деплой автоматический, только фронт. После пуша автоматом разъедется через GitHub Actions.

