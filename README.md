# Pinnacle AI — Portfolio Intelligence Platform

### 🚀 Tech Stack Highlights

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white) ![tRPC](https://img.shields.io/badge/tRPC-2596be?logo=trpc&logoColor=white) |
| **Backend** | ![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white) ![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white) |
| **AI Agents** | ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) ![LangChain](https://img.shields.io/badge/🦜%20LangChain-1C3C3C?logoColor=white) ![LangGraph](https://img.shields.io/badge/LangGraph-000000?logo=langchain&logoColor=white) ![Groq](https://img.shields.io/badge/Groq-f55036?logo=groq&logoColor=white) ![Llama-3](https://img.shields.io/badge/Llama--3-04101E?logo=meta&logoColor=white) ![DuckDB](https://img.shields.io/badge/DuckDB-FFF000?logo=duckdb&logoColor=black) |
| **Infra/Dev** | ![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white) ![Turbo](https://img.shields.io/badge/Turbo-EF4444?logo=turbo&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![Resend](https://img.shields.io/badge/Resend-000000?logo=resend&logoColor=white) |

---

Pinnacle AI is a production-grade, autonomous multi-agent platform designed for Private Equity firms to monitor, analyze, and benchmark P&L performance across a diverse portfolio. The system automates the transition from raw, fragmented financial data to executive-level insights and board-ready reporting.

---

## 🏛️ System Architecture

Pinnacle AI is built as a high-performance monorepo, leveraging a hybrid TypeScript/Python stack to balance UI responsiveness with deep analytical intelligence.

### High-Level Design
```mermaid
graph TB
    subgraph "Frontend Layer (Next.js 15)"
        UI[Dashboard UI]
        Feed[Live Activity Feed]
        WB[Analytics Workbench]
        Charts[Recharts/Visx Analytics]
    end

    subgraph "API Gateway (NestJS 11)"
        TRPC[tRPC API Server]
        SCHED[Autonomous Scheduler]
        WS[Socket.io Gateway]
        Bull[BullMQ / Redis Queue]
    end

    subgraph "Agentic Layer (Python 3.12)"
        ORCH[Master Orchestrator]
        LangGraph[LangGraph State Machine]
        Agents[10 Specialized Agents]
        DuckDB[DuckDB Analytical Engine]
    end

    subgraph "Persistence & Messaging"
        PG[(PostgreSQL + Prisma)]
        Redis[(Redis Shared Memory)]
    end

    UI --> TRPC
    TRPC --> PG
    Feed --> WS
    WS --> Redis
    SCHED -->|Trigger| Bull
    Bull -->|Job| ORCH
    ORCH --> LangGraph
    LangGraph --> Agents
    Agents -->|Read/Write| PG
    Agents -->|Insights| Redis
    Agents -->|OLAP Queries| DuckDB
    DuckDB -->|Attach Read-Only| PG
```

---

## 🤖 Agentic Intelligence (4-Phase Pipeline)

The system utilizes 10 specialized agents coordinated by a **Master Orchestrator**. The pipeline follows a structured reasoning path to ensure data integrity before synthesis.

### Agent Workflow Diagram
```mermaid
sequenceDiagram
    participant S as Scheduler
    participant O as Master Orchestrator
    participant P1 as Phase 1: Normalization
    participant P2 as Phase 2: Core Analysis
    participant P3 as Phase 3: Comparative
    participant P4 as Phase 4: Synthesis

    S->>O: Trigger Run (Daily/Event)
    O->>P1: Normalize P&L (10 Companies)
    P1-->>O: Data Standardized
    
    par Core Analysis
        O->>P2: Margin Analysis
        O->>P2: Cost Structure
        O->>P2: Revenue Quality
        O->>P2: Trend Detection
    end
    
    P2-->>O: Findings Generated
    
    O->>P3: Benchmark Performance
    P3-->>O: Rankings & Anomalies
    
    O->>P4: Generate Executive Insights
    O->>P4: Send Automated Alerts
    P4-->>O: Analysis Complete
```

### The 10 Agents
1.  **Master Orchestrator**: Manages state, error recovery, and cross-phase handoffs.
2.  **P&L Normalization Agent**: Uses LLM reasoning to map disparate Chart of Accounts (CoA) to a standard PE hierarchy.
3.  **Margin Analysis Agent**: Decomposes Gross and EBITDA margins across time and segments.
4.  **Cost Structure Agent**: Identifies fixed vs. variable cost inefficiencies.
5.  **Revenue Quality Agent**: Analyzes customer concentration and recurring revenue health.
6.  **Benchmark & Peer Agent**: Ranks performance against internal portfolio and external industry percentiles.
7.  **Trend Detection Agent**: Signals early warnings on margin contraction or expense spikes.
8.  **Anomaly Detection Agent**: Flags statistical outliers in line-item spending.
9.  **Best Practice Identifier**: Connects "Top Performers" to "Low Performers" via actionable recommendations.
10. **Insight & Communication Agent**: Synthesizes all findings into board-ready natural language and sends Resend emails.

---

## 📊 Database Schema

The system uses **PostgreSQL** with **Prisma ORM** for high-integrity financial records.

```mermaid
erDiagram
    COMPANY ||--o{ PL_STATEMENT : owns
    COMPANY ||--o{ INSIGHT : generated_for
    COMPANY ||--o{ COMPUTED_METRIC : historical
    COMPANY ||--o{ KPI_RECORD : operational
    COMPANY ||--o{ EMAIL_RECIPIENT : notified
    
    COMPANY {
        string id PK
        string name
        string industry
        float annualRevenue
    }
    
    PL_STATEMENT {
        string id PK
        string companyId FK
        string period
        string accountName
        float amount
        boolean isNormalized
    }
    
    INSIGHT {
        string id PK
        string companyId FK
        string agentName
        string severity
        string summary
        json recommendations
    }
    
    AGENT_RUN {
        string id PK
        string agentName
        string status
        timestamp startedAt
    }
```

---

## 🚀 Exact Local Setup Guide

Follow these steps precisely to get the full Pinnacle AI platform running on your local machine.

### 📋 Prerequisites

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v22+` | Core platform runtime |
| **pnpm** | `v9+` | Fast package management |
| **Python** | `v3.12+` | Multi-agent logic (ML/Analytical layer) |
| **Docker Desktop** | Latest | Infrastructure (Postgres, Redis) |

### 1. Repository & Environment
```bash
# Clone the repository
git clone https://github.com/ankurraj2003/PinnacleAI.git
cd PinnacleAI

# Copy the example environment file
cp .env.example .env
```

> [!IMPORTANT]
> Update the `.env` file with your **GROQ_API_KEY** and **RESEND_API_KEY**. The default `DATABASE_URL` and `REDIS_URL` are pre-configured for the Docker local setup.

### 2. Node.js & Workspace Installation
```bash
# Install root and workspace dependencies (Web & API)
pnpm install
```

### 3. Python Multi-Agent Setup
We use a dedicated virtual environment for the AI agentic layer.
```bash
# 1. Create a virtual environment
python -m venv .venv

# 2. Activate the environment
# Windows:
.venv\Scripts\activate
# Mac / Linux:
source .venv/bin/activate

# 3. Install agent-specific dependencies
pip install -r packages/agents/requirements.txt
```

### 4. Infrastructure & Database Initialization
```bash
# Start Docker services (PostgreSQL & Redis)
docker compose up -d

# Initialize the Database Schema (Prisma)
pnpm db:push

# Seed the portfolio (14,000+ data points for 10 companies)
pnpm db:seed
```

### 5. Running the Application
To verify the full "Human-Agent" interaction, you must run all three services concurrently.

| Service | Command | Endpoints |
| :--- | :--- | :--- |
| **NestJS API** | `pnpm dev:api` | `http://localhost:3001` (tRPC/WS) |
| **Next.js Web** | `pnpm dev:web` | `http://localhost:3000` (Dashboard) |
| **Python AgentsCLI**| `python packages/agents/run_agents.py` | `http://localhost:8001` (Internal API) |

> [!TIP]
> You can also use the **"Run All"** task in VS Code if you have the recommended extensions installed.

---

## 🛠️ API & Tooling Documentation

### tRPC Procedures (Main)
- `agents.getPipelineStatus`: Returns real-time health of the 10-agent pipeline.
- `agents.getRecentRuns`: History of autonomous execution.
- `agents.triggerFullPipeline`: Manual trigger (for demo/testing).
- `workbench.nlQuery`: Real-time LLM-driven query against the entire portfolio.
- `email.sendTest`: Triggers the Resend production email flow.

### Monitoring & Observability
- **Socket.io**: Live events streamed on `agent:status` and `activity:new` channels.
- **Prisma Studio**: View and edit the 11 tables (`pnpm prisma studio`).

---

## 📝 Written Summary: Approach & Decisions

### 1. The Multi-Model Strategy
We utilize **Groq**'s ultra-fast Llama-3 inference. Specialized agents use `llama-3.1-8b-instant` for rapid data parsing/math, while the **Insight Synthesis Agent** uses `llama-3.3-70b-versatile` for high-reasoning board-ready commentary. This balances cost, speed, and analytical depth.

### 2. Redis-Backed Shared Memory
Agents communicate through a shared finding store in Redis. This allows Phase 3 agents (Benchmarking) to consume computed metrics generated by Phase 2 agents (Margin/Cost) without re-calculating or additional DB overhead.

### 3. DuckDB for Real-Time OLAP
For complex portfolio-wide benchmarking, the Python agents use **DuckDB** to query the PostgreSQL tables. This allows for columnar performance on a row-oriented database, enabling instant percentile calculations across 14,000+ financial records.

### 4. Autonomous First Architecture
The system is built on a "Pull" rather than "Push" model. The **Scheduler Service** in NestJS acts as the heartbeat, ensuring that even if the UI is closed, the Analytical Pipeline runs every minute (dev mode) or on its daily/weekly triggers.

---

## 🔮 Future Improvements & Limitations
- **PDF Export**: Currently, reports are generated as structured JSON/HTML; full PDF generation using Puppeteer is slated for V2.
- **Predictive Forecaster**: Moving from linear statistical trends to ML-based forecasting (Prophet).
- **RAG for Financial Docs**: Adding a vector store (Pinecone) to allow agents to read MD&A PDF documents alongside raw P&L numbers.
- **Langflow Execution**: The platform includes a visual `pipeline.json`, but currently uses code-based orchestration for reliability. Full runtime integration with the Langflow server is the next step.

---

**Contact**: Built for TalentDeel Developer Assessment — Assignment 3.
