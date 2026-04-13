

## GitHub Actions: автодеплой на сервер после каждого пуша

### Схема

```text
Lovable пушит в GitHub
        ↓
GitHub Actions (on push to main)
        ↓
SSH на 155.212.188.244
        ↓
cd /var/www/owndev.ru && git pull
cd owndev-backend && npm run build && pm2 restart owndev-backend
npm run build (frontend)
```

### Что нужно сделать

#### 1. Создать `.github/workflows/deploy.yml`

```yaml
name: Deploy to production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/owndev.ru && git pull
            cd owndev-backend && npm run build && pm2 restart owndev-backend
            cd /var/www/owndev.ru && npm run build
```

#### 2. Настроить GitHub Secrets (ты делаешь руками)

В GitHub → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Значение |
|--------|----------|
| `SERVER_HOST` | `155.212.188.244` |
| `SERVER_USER` | `root` (или твой SSH-юзер) |
| `SERVER_SSH_KEY` | Приватный SSH-ключ (содержимое `~/.ssh/id_rsa` или `id_ed25519`) |

Как получить ключ (если ещё нет):
```bash
# На сервере:
ssh-keygen -t ed25519 -C "deploy" -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/deploy_key  # ← это вставить в SECRET SERVER_SSH_KEY
```

### Итого

- Lovable пишет код → пуш в GitHub → Actions автоматически деплоит на сервер
- Больше не нужно заходить на сервер руками
- Единственное ручное действие: один раз настроить 3 секрета в GitHub

