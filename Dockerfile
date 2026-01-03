# syntax=docker/dockerfile:1

# =====================================================================================
# STAGE 1: builder
# =====================================================================================
FROM node:20-bookworm-slim AS builder

# build tools + git (т.к. в твоём build-скрипте есть git rev-parse) + curl/unzip для установки bun
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential python3 git curl ca-certificates unzip && \
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.com/install | bash

ENV BUN_INSTALL=/root/.bun
ENV PATH=$BUN_INSTALL/bin:$PATH

WORKDIR /app

# Копируем манифесты и lockfile отдельно — чтобы кэшировался слой установки зависимостей
COPY package.json bun.lock ./
# если у тебя есть .npmrc для приватного registry — раскомментируй
# COPY .npmrc ./

# Ставим ВСЕ зависимости (dev нужны для nitropack)
RUN bun install --frozen-lockfile

# Копируем проект
COPY . .

# Твои аргументы сборки — оставляем как есть
ARG NODE_COMMIT_TEAPOT
ENV NODE_COMMIT_TEAPOT=${NODE_COMMIT_TEAPOT}

ARG ENVIR
# чуть безопаснее, чем echo (не ломает логику, но меньше сюрпризов с \n)
RUN printf '%s' "$ENVIR" > /app/.env

# Сборка (используем bun для запуска скрипта)
RUN bun run build

# Оставляем только production-зависимости (аналог npm prune --omit=dev)
RUN rm -rf node_modules && bun install --production --frozen-lockfile

# =====================================================================================
# STAGE 2: runner
# =====================================================================================
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/.env ./.env
COPY ecosystem.config.cjs .

RUN npm install -g pm2@latest && npm cache clean --force

EXPOSE 3300

CMD ["sh", "-c", "set -a && . ./.env && pm2-runtime ecosystem.config.cjs"]
