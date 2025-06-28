# Created with Gemini and ChatGPT
# =====================================================================================
# ЭТАП 1: "Сборщик" (Builder)
# На этом этапе мы устанавливаем ВСЕ зависимости, собираем проект и готовим артефакты.
# Используем 'bookworm-slim', т.к. он хорошо работает с нативными модулями (bcrypt, sharp)
# =====================================================================================
FROM node:20-bookworm-slim AS builder

# Устанавливаем системные пакеты, необходимые для сборки:
# - build-essential, python3: для компиляции нативных Node.js модулей (bcrypt, sharp)
# - git: для получения хеша коммита (`git rev-parse HEAD` в вашем build-скрипте)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential python3 git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Устанавливаем все зависимости (включая dev) из package-lock.json.
RUN npm install

# Копируем все остальные файлы проекта в контейнер.
COPY . .

# Аргумент сборки для передачи хеша коммита.
# Пример запуска: docker build --build-arg GIT_COMMIT=$(git rev-parse HEAD) -t my-app .
ARG GIT_COMMIT=unknown
ENV NODE_COMMIT=${GIT_COMMIT}

# Запускаем скрипт сборки. Nitro создаст папку .output/
RUN npm run build

# ✨ КЛЮЧЕВОЕ УЛУЧШЕНИЕ: Удаляем dev-зависимости ПОСЛЕ сборки.
# Это оставляет в node_modules только то, что нужно для работы приложения.
RUN npm prune --omit=dev

# =====================================================================================
# ЭТАП 2: "Исполнитель" (Runner)
# Это финальный, легковесный образ, который будет запускаться на сервере.
# В нем нет ничего лишнего, только скомпилированное приложение и production-зависимости.
# =====================================================================================
FROM node:20-bookworm-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем окружение для продакшена.
# PM2 и Nitro будут использовать эту переменную для оптимизаций.
ENV NODE_ENV=production

# Копируем "очищенные" production-зависимости из сборщика.
# Это самый эффективный способ: быстро и без доступа к сети.
COPY --from=builder /app/node_modules ./node_modules

# Копируем собранное приложение из сборщика.
COPY --from=builder /app/.output ./.output

# Копируем конфигурацию PM2.
COPY ecosystem.config.cjs .

# Устанавливаем PM2 глобально. Это небольшая зависимость.
RUN npm install -g pm2@latest

# Открываем порт, который слушает ваше приложение
EXPOSE 3300

# Команда для запуска. `pm2-runtime` — это специальная команда для Docker,
# которая запускает PM2 в "foreground" режиме, что позволяет Docker управлять процессом.
CMD ["pm2-runtime", "ecosystem.config.cjs"]