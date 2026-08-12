FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat procps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY apps/api/src/trpc/ ./apps/api/src/trpc/ 

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

WORKDIR /app
RUN pnpm run build --filter=@pinnacle/web...

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["pnpm", "run", "dev"]
