# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

COPY nest-cli.json tsconfig.build.json tsconfig.json ./
COPY src ./src

RUN pnpm run build

FROM dependencies AS development

COPY nest-cli.json tsconfig.build.json tsconfig.json ./
COPY src ./src

CMD ["pnpm", "run", "start:dev"]

FROM base AS production-dependencies

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

FROM node:22-alpine AS runner

ENV NODE_ENV=prd

WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

CMD ["sh", "-c", "node ./node_modules/typeorm/cli.js -d dist/core/database/data-source.js migration:run && node dist/main"]
