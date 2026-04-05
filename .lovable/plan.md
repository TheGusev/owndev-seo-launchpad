

## Добавление фото-обложек на все статьи блога

### Подход

Добавить поле `coverImage` в тип `BlogPost` и присвоить каждой из 28 статей релевантное фото с Unsplash (бесплатные, не требуют API-ключа). Обновить компоненты Blog.tsx, BlogPost.tsx и BlogPreview.tsx — показывать фото вместо `DefaultBlogCover`.

### Файлы

| Файл | Изменение |
|------|-----------|
| `src/data/blog/types.ts` | Добавить `coverImage?: string` |
| `src/data/blog/cluster-llm.ts` | Добавить coverImage к 4 статьям |
| `src/data/blog/cluster-ai-overviews.ts` | Добавить coverImage к 6 статьям |
| `src/data/blog/cluster-pseo.ts` | Добавить coverImage к 4 статьям |
| `src/data/blog/cluster-schema.ts` | Добавить coverImage к 5 статьям |
| `src/data/blog/cluster-content.ts` | Добавить coverImage к 5 статьям |
| `src/data/blog/cluster-technical.ts` | Добавить coverImage к 4 статьям |
| `src/pages/Blog.tsx` | Показывать фото или fallback на DefaultBlogCover |
| `src/pages/BlogPost.tsx` | Показывать обложку в шапке статьи |
| `src/components/BlogPreview.tsx` | Показывать фото на главной |

### Изображения

Unsplash прямые ссылки (`images.unsplash.com/photo-...?w=800&q=80`) — тематически подобранные:

- **LLM/AI**: нейросети, мозг, чипы, код
- **Schema/JSON-LD**: код на экране, структуры данных
- **pSEO**: города, карты, масштабирование
- **Content**: написание текстов, блокноты, контент
- **Technical**: аудит, чек-листы, дашборды, скорость
- **AI Overviews**: Google, поиск, AI-интерфейсы

### UI-изменение

В Blog.tsx строка 124 — вместо всегда `DefaultBlogCover`:
```tsx
{post.coverImage ? (
  <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover" loading="lazy" />
) : (
  <DefaultBlogCover title={post.title} category={post.tags[0]} />
)}
```

Аналогично в BlogPreview.tsx и BlogPost.tsx (hero-обложка).

