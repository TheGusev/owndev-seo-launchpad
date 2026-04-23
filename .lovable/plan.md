

## OWNDEV → 100/100: финальный план (ИНН-only)

### Реквизиты
В видимом блоке и комментариях: **«ИП, ИНН 511007293446»**. Никаких ОГРНИП/ФИО — ни в HTML, ни в TODO.

### Что делаю

#### 1. `index.html` — статический SEO-fallback внутри `<div id="root">`
React при монтировании заменяет содержимое — пользователь видит SPA, краулер (без JS) получает полноценный HTML. ~700+ слов, 1×H1, 6×H2, CTA above-the-fold.

```text
<header>OWNDEV · nav: Инструменты · GEO-аудит · Блог · Контакты</header>
<main>
  <h1>GEO и AI-ready аудит сайта — проверка готовности к ChatGPT, Perplexity, Яндекс Нейро</h1>
  <p>Лид 80–100 слов</p>
  <a class="cta" href="/tools/site-check">Проверить сайт бесплатно →</a>

  <h2>Что проверяет OWNDEV</h2><ul>10 пунктов pipeline</ul>
  <h2>Кому подходит GEO-аудит</h2><p>~80 слов</p>
  <h2>Чем GEO-аудит отличается от классического SEO</h2><p>~100 слов</p>
  <h2>Что вы получите в отчёте</h2><p>~80 слов</p>
  <h2>Часто задаваемые вопросы</h2><details>×4</details>

  <h2>Контакты и реквизиты</h2>
  <address>
    ИП, ИНН 511007293446<br>
    Тел: +7 (906) 998-98-88<br>
    Email: west-centro@mail.ru<br>
    Telegram: @The_Suppor_t<br>
    Адрес: Россия
  </address>
</main>
<footer>© 2026 OWNDEV.ru · Сделано ❤️ в России 🇷🇺</footer>
```

Trust signals: телефон + email + Telegram + ИНН + юр.форма = **5/4** ✓

#### 2. `index.html` — метаданные
- `description` → 149 симв.: `OWNDEV — GEO и AI-ready аудит сайта в Рунете. SEO Score, GEO Score, CRO Score, Schema.org, llms.txt. PDF и Word отчёт за 60 секунд. Бесплатно.`
- `logo` → `https://owndev.ru/favicon.ico` (вместо несуществующего `/logo.png`)
- **+ BreadcrumbList** JSON-LD (5-й блок в `@graph`)
- **+ Organization → telephone, email, address** в существующий блок

#### 3. `src/pages/Index.tsx` — синхронизировать description ≤160 в Helmet

#### 4. `public/.well-known/security.txt` — RFC 9116
```
Contact: mailto:west-centro@mail.ru
Contact: https://t.me/The_Suppor_t
Expires: 2027-04-23T00:00:00.000Z
Preferred-Languages: ru, en
Canonical: https://owndev.ru/.well-known/security.txt
```

#### 5. Alt-атрибуты
Пройдусь по `Footer.tsx`, `Header.tsx`, `BlogPreview.tsx` — добавлю описательные alt где их нет.

#### 6. `DEPLOYMENT.md` — секция «Security headers (nginx)»
Готовый сниппет для серверного применения: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Cache-Control (immutable для статики, 5 мин для HTML).

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://mc.yandex.ru; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://mc.yandex.ru https://*.supabase.co https://api.owndev.ru; frame-ancestors 'self';" always;

location ~* \.(js|css|woff2|svg|png|jpg|jpeg|webp|ico)$ {
  add_header Cache-Control "public, max-age=31536000, immutable" always;
  try_files $uri =404;
}
location / {
  add_header Cache-Control "public, max-age=300, must-revalidate" always;
  try_files $uri /index.html;
}
```

С инструкцией: `nginx -t && systemctl reload nginx`.

### Ожидаемый результат

| Скор | Сейчас | После фронта | После фронта + nginx |
|---|---|---|---|
| Общий | 60 | 88–92 | **96–100** |
| SEO | 58 | 95+ | 100 |
| Директ/CRO | 35 | 85+ | 90+ |
| Schema | 85 | 100 | 100 |
| GEO/AI | 68 | 95+ | 100 |
| Безопасность | 40 | 55 | **100** |

### Файлы

- `index.html` — fallback в `<div id="root">`, BreadcrumbList, description ≤160, logo path, Organization contacts.
- `src/pages/Index.tsx` — description ≤160 в Helmet.
- `public/.well-known/security.txt` — новый.
- `src/components/Footer.tsx`, `src/components/Header.tsx`, `src/components/BlogPreview.tsx` — alt-атрибуты при необходимости.
- `DEPLOYMENT.md` — секция nginx security headers.

### После деплоя
1. GitHub Actions автодеплой фронта.
2. Применить nginx-сниппет на сервере по `DEPLOYMENT.md`.
3. Запустить наш scan для `owndev.ru` — ожидается 96–100/100.

