FROM node:22-alpine AS base

# Install dev dependencies
RUN apk add --no-cache libc6-compat procps

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root configurations
COPY package.json pnpm-workspace.yaml turbo.json ./

# Copy all packages and apps (since it's a monorepo, turbo will only build what's needed)
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies using pnpm workspace
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/packages/database
RUN pnpm prisma generate

# Build API and its dependencies
WORKDIR /app
RUN pnpm run build --filter=@pinnacle/api...

# Setup production run
WORKDIR /app/apps/api
EXPOSE 3001

# Run in dev mode for hot reloading during development, 
# would be node dist/main.js in production
CMD ["pnpm", "run", "start:dev"]
