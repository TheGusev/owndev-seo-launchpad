

## Вставка ID Яндекс.Метрики

**`src/utils/analytics.ts`** — строка 1: заменить `const YM_COUNTER_ID = 0;` на `const YM_COUNTER_ID = 108194492;`

**`index.html`** — вставить скрипт счётчика Яндекс.Метрики перед `</body>`:
```html
<script type="text/javascript">
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
  ym(108194492, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/108194492" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
```

2 файла, 2 правки.

