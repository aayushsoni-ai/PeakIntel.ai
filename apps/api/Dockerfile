# --- STAGE 1: Build ---
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat procps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies using pnpm workspace
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/packages/database
RUN pnpm prisma generate
WORKDIR /app

# Build API and its dependencies
RUN pnpm run build --filter=@pinnacle/api...

# Deploy the API to a pruned directory for production
# This command ensures all local workspace dependencies are correctly bundled without broken symlinks
RUN pnpm --filter=@pinnacle/api --prod deploy /app/pruned

# --- STAGE 2: Runner ---
FROM node:22-alpine AS runner

WORKDIR /app

# Copy the production-ready pruned package from builder
COPY --from=builder /app/pruned ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# The entry point is located within the nested dist folder produced by tsc
CMD ["node", "dist/apps/api/src/main.js"]
