

## Анимированный SVG-маскот BorderBot

### Новый файл: `src/components/mascot/BorderBot.tsx`

Один самодостаточный компонент (~400 строк), обёрнутый в `React.memo`:

**SVG робот (`BotSvg`):**
- 36x44px, glassmorphism purple стиль
- Голова (rect r=6, fill rgba(139,92,246,0.15), stroke 0.6)
- Антенна с пульсирующим кружком
- Глаза с зрачками, которые смещаются по направлению движения
- Моргание: случайный интервал 3-5сек, scaleY 1→0.1→1
- Тело с экранчиком (3 полоски-loading bars)
- Ноги с анимацией ходьбы (попеременный translateY)

**State machine через `useReducer`:**
```
walking → stopping → looking | thinking → walking
```
- `walking`: движение вдоль текущей стороны, покачивание тела, шаги ног
- `looking`: зрачки смотрят лево→право→верх, 2-4 сек
- `thinking`: быстрое мигание антенны, "..." над головой
- Углы: пауза 0.5сек + смена `facing`

**Маршрут по границам экрана:**
- bottom → right → top → left → bottom (замкнутый цикл)
- Framer Motion `animate` для перемещения, duration от distance/speed
- Скорость 80-120px/сек (рандом)
- 30% шанс остановки посередине стороны
- На мобильных (< 768px): только bottom

**Доп. детали:**
- Тень-эллипс под ногами (blur, purple/20)
- Hover: при курсоре < 80px — бот смотрит на курсор (pointer-events на wrapper)
- Тройной клик → бот уходит за экран, `localStorage.setItem('hideBot', 'true')`
- `will-change: transform` для 60fps

**Скрытие:**
- `localStorage.getItem('hideBot')` → не рендерить
- `location.pathname.includes('/result/')` → не рендерить

### Изменение: `src/App.tsx`

Добавить `<BorderBot />` после `<CookieBanner />` внутри `<BrowserRouter>`:

```tsx
import BorderBot from '@/components/mascot/BorderBot';
// ...
<CookieBanner />
<BorderBot />
```

### Файлы

| Файл | Действие |
|------|----------|
| `src/components/mascot/BorderBot.tsx` | Новый — маскот |
| `src/App.tsx` | Добавить import + компонент |

