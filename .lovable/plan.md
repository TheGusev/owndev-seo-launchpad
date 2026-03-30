

## Исправление 3 критических SEO-багов

### Баг 1: Дублирование мета-тегов в `index.html`

**Файл:** `index.html`

Удалить из `<head>`: `meta[name=description]`, `meta[name=keywords]`, `meta[name=author]`, все `og:*` теги, все `twitter:*` теги. Оставить только:
- `<meta charset>`, `<meta name="viewport">`, шрифт
- `<title>OWNDEV</title>` (пустой fallback)
- `<link rel="canonical">`, `<link rel="icon">`

Helmet в компонентах полностью управляет мета-тегами на каждой странице.

### Баг 2: Добавить `og:url` на ключевые страницы

| Страница | Файл | og:url |
|----------|------|--------|
| `/` | `src/pages/Index.tsx` | ❌ → добавить `og:url` + `og:type` |
| `/blog` | `src/pages/Blog.tsx` | ✅ уже есть |
| `/tools` | `src/pages/Tools.tsx` | ❌ → добавить |
| `/contacts` | `src/pages/Contacts.tsx` | ❌ → добавить |

### Баг 3: Автор в блоге (E-E-A-T)

**3a. Тип** — `src/data/blog/types.ts`: добавить `author: string` и `authorRole?: string`.

**3b. Данные** — 6 файлов кластеров (`cluster-llm.ts`, `cluster-ai-overviews.ts`, `cluster-pseo.ts`, `cluster-schema.ts`, `cluster-content.ts`, `cluster-technical.ts`): добавить `author: "OWNDEV Team"` и `authorRole: "SEO & AI эксперты"` ко всем ~24 постам.

**3c. Рендер** — `src/pages/BlogPost.tsx`:
- Аватар-инициал + имя + роль под заголовком
- Обновить Article JSON-LD: добавить `author.name` из `post.author`

### Файлы (11 штук)

| Файл | Изменение |
|------|-----------|
| `index.html` | Удалить дублирующие мета-теги |
| `src/pages/Index.tsx` | Добавить og:url, og:type |
| `src/pages/Tools.tsx` | Добавить og:url, og:type |
| `src/pages/Contacts.tsx` | Добавить og:url, og:type |
| `src/data/blog/types.ts` | Добавить author, authorRole? |
| `src/data/blog/cluster-llm.ts` | author ко всем постам |
| `src/data/blog/cluster-ai-overviews.ts` | author ко всем постам |
| `src/data/blog/cluster-pseo.ts` | author ко всем постам |
| `src/data/blog/cluster-schema.ts` | author ко всем постам |
| `src/data/blog/cluster-content.ts` | author ко всем постам |
| `src/data/blog/cluster-technical.ts` | author ко всем постам |
| `src/pages/BlogPost.tsx` | Рендер автора + JSON-LD |

