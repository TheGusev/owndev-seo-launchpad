
## План: Исправление загрузки изображений и добавление индикатора свайпа

### Проблема 1: Изображения не загружаются в карусели

**Причина:** IntersectionObserver в компоненте `OptimizedImage` не видит элементы внутри горизонтального scroll-контейнера Embla Carousel. Элементы за пределами видимой области карусели считаются "не в viewport", хотя они уже находятся в DOM.

**Решение:** Установить `isInView: true` сразу при монтировании для изображений в карусели, либо расширить `rootMargin` на горизонтальную область.

---

### Проблема 2: Нет индикации свайпа на мобильных

**Причина:** Кнопки карусели скрыты на мобильных (`hidden md:flex`), и пользователь не понимает, что можно свайпать.

**Решение:** Добавить визуальный индикатор свайпа с анимированной иконкой и точками пагинации.

---

## Технические изменения

### Файл 1: `src/components/ui/optimized-image.tsx`

Добавить проп `eager` для принудительной загрузки без lazy-loading:

```tsx
interface OptimizedImageProps {
  // ... existing props
  eager?: boolean; // Новый проп для отключения lazy-loading
}

export const OptimizedImage = ({
  // ...
  eager = false,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(eager); // Если eager=true, сразу загружаем
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eager) return; // Пропускаем observer если eager
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 500px' } // Увеличиваем для горизонтального скролла
    );
    // ...
  }, [eager]);
  // ...
};
```

### Файл 2: `src/components/Portfolio.tsx`

1. Передать `eager={true}` для изображений в карусели
2. Добавить индикатор свайпа и точки пагинации

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

const Portfolio = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section id="portfolio">
      {/* ... */}
      
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {projects.map((project, index) => (
            <CarouselItem key={index}>
              <OptimizedImage 
                src={project.image} 
                eager={true}  // Загружаем сразу
                // ...
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Мобильный индикатор свайпа */}
        <div className="flex md:hidden items-center justify-center gap-4 mt-6">
          <ChevronLeft className="w-5 h-5 text-muted-foreground animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground animate-pulse" />
        </div>
      </Carousel>
    </section>
  );
};
```

---

## Результат

| Проблема | Было | Станет |
|----------|------|--------|
| **Изображения** | Не загружаются из-за IntersectionObserver | Загружаются сразу с `eager={true}` |
| **Мобильный UX** | Нет индикации свайпа | Стрелки + точки пагинации + анимация |
| **Пагинация** | Отсутствует | Кликабельные точки показывают текущий слайд |

---

## Визуальный результат на мобильном

```text
┌─────────────────────────┐
│  Реальные проекты.      │
│  Реальные результаты.   │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │   [ИЗОБРАЖЕНИЕ]   │  │ ← Теперь загружается
│  │   Салон красоты   │  │
│  │   Иридиум         │  │
│  └───────────────────┘  │
│                         │
│   ◀  ●━━○━━○━━○━━○  ▶   │ ← Индикатор свайпа
│      Свайпните →        │
└─────────────────────────┘
```
