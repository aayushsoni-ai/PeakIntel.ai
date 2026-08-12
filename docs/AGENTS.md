# Agent Ecosystem

Pinnacle AI uses a PaperclipAI and LangChain-based multi-agent orchestration model. Agents are broadly specialized into phases: Preparation, Core Analysis, Comparative Analysis, and Synthesis. All agents run autonomously when triggered.

## The Pipeline

**Phase 1: Preparation**
1. **PLNormalizationAgent**: Standardizes raw GL accounts into the foundational "Revenue", "COGS", "S&M", "R&D", "G&A" taxonomy. Utilizes Claude to interpret unusual/unmapped account names.

**Phase 2: Core Analysis (Parallel Execution)**
2. **MarginAnalysisAgent**: Measures profitability, Gross/EBITDA/Op. Margins.
3. **CostStructureAgent**: Investigates operating leverage and fixed/variable decompositions.
4. **RevenueQualityAgent**: Assesses concentration risk, organic vs inorganic segmentations, and recurring composition.
5. **TrendDetectionAgent**: Runs linear regressions natively through NumPy to determine growth trajectories across revenue and margins. 

**Phase 3: Comparative Analysis**
6. **BenchmarkPeerAnalysisAgent**: Composes gap analysis comparing internal portfolio companies against broader generic industry percentiles and public comps.
7. **AnomalyDetectionAgent**: Uses IQR and Z-Scores to spot one-time events, reporting extreme variance outliers to the synthesis step.
8. **BestPracticeIdentificationAgent**: Pulls intermediate findings from all preceding agents via Redis to spot "what the best do differently", allowing transference of optimal operating strategies.

**Phase 4: Synthesis**
9. **InsightGenerationAgent**: Curates, deduplicates, and synthesizes thousands of metric outputs and interim hypotheses into 10-15 "Board-Ready" observations, translating numbers into compelling natural language directives and updating Postgres `insights`.

**Orchestrator**
10. **MasterOrchestrator**: Not fundamentally an "analytical" agent, but the programmatic glue invoking agents in topological order, batching parallelizable steps, enforcing timeouts, parsing errors, emitting WebSocket telemetry, and bridging the NestJS trigger to actual execution.
