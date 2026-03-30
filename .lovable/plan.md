

## Добавить AI-краулеры в robots.txt

**Файл:** `public/robots.txt`

Добавить блоки для основных AI-краулеров (GPTBot, ChatGPT-User, Google-Extended, PerplexityBot, ClaudeBot, Applebot-Extended) с `Allow: /` и указанием пути к `llms.txt` через нестандартную, но широко поддерживаемую директиву. Также добавить универсальное поле `LLMs-Txt` в конец файла.

```
# AI Crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Applebot-Extended
Allow: /

# LLM manifest
# https://llmstxt.org
LLMs-Txt: https://owndev.ru/llms.txt
```

Один файл, одна правка.

