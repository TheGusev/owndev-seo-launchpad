

## Починка BorderBot — видимость и надёжность

### Диагноз

Код структурно корректен, ошибок нет, подключение в App.tsx на месте. Вероятные причины невидимости:

1. **Начальная позиция `x:0, y:0`** — `controls.set()` вызывается в `useEffect`, но до этого Framer Motion рендерит div в `(0,0)` без `initial` prop — бот может быть за пределами видимой области или в углу под шапкой
2. **`isMobile` стартует как `undefined` → `false`** — `useIsMobile()` возвращает `!!undefined = false` на первом рендере, потом меняется — effect перезапускается, `abortRef` сбрасывается, но позиция может не обновиться
3. **`sleep` не проверяет abort корректно** — проверка `abortRef.current` происходит синхронно до `setTimeout`, а не после
4. **localStorage ключ `hideBot`** — пользователь мог случайно тройным кликом скрыть бота, и теперь он не виден

### Изменения (1 файл)

#### `src/components/mascot/BorderBot.tsx`

1. **Добавить `console.log('[BorderBot] mounted, shouldHide:', shouldHide)`** — для отладки

2. **Добавить `initial` prop** на `motion.div`:
```tsx
initial={{ x: getPos("bottom", 0, false).x, y: getPos("bottom", 0, false).y }}
```
Это гарантирует что бот виден сразу, а не ждёт effect

3. **Расширить `shouldHide`** — добавить `/report/`:
```tsx
const shouldHide = hidden || location.pathname.includes("/result/") || location.pathname.includes("/report/");
```

4. **Сменить localStorage ключ** на `owndev_bot_hidden` (как в ТЗ):
```tsx
localStorage.getItem("owndev_bot_hidden")
localStorage.setItem("owndev_bot_hidden", "true")
```

5. **Исправить `sleep`** — abort должен проверяться внутри промиса:
```tsx
const sleep = (ms: number) => new Promise<void>((res) => {
  const t = setTimeout(() => res(), ms);
  const check = setInterval(() => {
    if (abortRef.current) { clearTimeout(t); clearInterval(check); res(); }
  }, 100);
});
```

6. **Защита от SSR/initial render** — дождаться `isMobile !== undefined`:
```tsx
// В useEffect: если isMobile ещё undefined, не запускать loop
```
Но `useIsMobile` уже возвращает `boolean`, так что достаточно добавить `initial` prop.

7. **Минимизация анимаций** — убрать SVG `<animate>` на экранчике (3 полоски) и тени, оставить только движение + моргание. Добавить их обратно позже если FPS ок.

### Файлы

| Файл | Изменение |
|------|-----------|
| `src/components/mascot/BorderBot.tsx` | initial prop, localStorage ключ, sleep fix, console.log, /report/ hide, упрощение анимаций |

