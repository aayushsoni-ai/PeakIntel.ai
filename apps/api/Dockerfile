# --- STAGE 1: Build ---
FROM node:22-alpine AS builder

# Install dev dependencies
RUN apk add --no-cache libc6-compat procps

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root configurations
COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml ./

# Copy packages and apps 
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

# --- STAGE 2: Runner ---
FROM node:22-alpine AS runner

WORKDIR /app

# Copy only what's needed to run the app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Use node instead of pnpm start for lower memory overhead
CMD ["node", "apps/api/dist/main.js"]
