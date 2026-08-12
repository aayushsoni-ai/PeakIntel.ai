# Pinnacle AI Architecture Overview

## Monorepo Structure

Pinnacle AI is structured as a pnpm workspace-managed Turborepo with clearly delineated boundaries between frontend, API, business logic, agents, and shared types.

```
pinnacle-intelligence/
├── apps/
│   ├── web/               ← Next.js 14 (App Router) frontend
│   └── api/               ← NestJS backend
├── packages/
│   ├── database/          ← Prisma schema and seed scripts
│   ├── shared/            ← Zod schemas and tRPC types
│   ├── email/             ← React Email templates
│   └── agents/            ← Python LangChain agent pipeline
├── docs/                  ← Architecture & Methodology Markdown docs
├── docker/                ← Infrastructure configuration
├── pnpm-workspace.yaml    
├── turbo.json             
└── package.json           
```

## Backend Services (NestJS)

- **tRPC API**: Fully end-to-end type-safe API matching Zod schemas in `@pinnacle/shared`.
- **Socket.IO Gateway**: Bridges backend Redis Pub/Sub events directly to the Next.js frontend to stream real-time agent execution status without HTTP polling.
- **Node-Cron Scheduler**: Autonomously kicks off the `MasterOrchestrator` agent based on triggers (daily flash, weekly full analysis, monthly board review).

## Frontend Technologies (Next.js)

- **App Router**: Next.js 14 App Router for Server Components + Client Hooks.
- **Styling**: `oklch` variable-based Tailwind configuration, removing external dependencies while ensuring exact, consistent "premium" visual palettes that adapt beautifully to dark mode. 
- **Charting**: A hybrid of Recharts for standard visualizations and Visx for dense hierarchical grids and heatmap analysis.

## Agent Architecture (Python + FastAPI)

The `packages/agents/` service operates independently via FastAPI, offering REST endpoints for triggering agents. 
- Agents communicate primarily via `src/shared_memory.py` utilizing the Redis backend.
- Agent outputs are either stored temporarily in Redis (for intermediate artifacts) or persisted to the PostgreSQL instance via the API or direct DB tools.

See `AGENTS.md` for details on the Orchestrator and specific agent modules.
