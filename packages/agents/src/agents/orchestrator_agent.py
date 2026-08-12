"""
Agent 1: MasterAnalyticsOrchestrator
Coordinates the full 4-phase pipeline across all 10 agents.
"""
import asyncio
import json
import logging
from typing import Any

from langchain.agents import AgentExecutor, create_react_agent

from langchain.prompts import PromptTemplate

from src.agents.normalization_agent import run_normalization
from src.agents.margin_agent import run_margin_analysis
from src.agents.cost_agent import run_cost_analysis
from src.agents.revenue_agent import run_revenue_analysis
from src.agents.trend_agent import run_trend_detection
from src.agents.benchmark_agent import run_benchmark_analysis
from src.agents.anomaly_agent import run_anomaly_detection
from src.agents.bestpractice_agent import run_bestpractice_analysis
from src.agents.insight_agent import run_insight_generation
from src.shared_memory import publish_event

logger = logging.getLogger("pinnacle.agents.orchestrator")

COMPANIES = [
    "alphatech_saas",
    "betamfg_inc",
    "gammacare_health",
    "deltaretail_co",
    "epsilonlogistics",
    "zetasoftware",
    "etaindustrial",
    "thetaconsulting",
    "iotadistribution",
    "kappamedia",
]


async def run_full_pipeline() -> dict[str, Any]:
    """Execute the full 4-phase analysis pipeline."""
    logger.info("=== Starting Full Analysis Pipeline ===")
    results: dict[str, Any] = {"phases": {}}

    # Phase 1: Preparation (Sequential) — Normalize all 10 companies
    publish_event("agent:started", {"agentName": "MasterOrchestrator", "phase": "Phase 1: Normalization"})
    logger.info("Phase 1: P&L Normalization for all companies")
    phase1_results = []
    for company_id in COMPANIES:
        result = await run_normalization(company_id)
        phase1_results.append(result)
    results["phases"]["normalization"] = phase1_results
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 1 complete", "percentComplete": 25})

    # Phase 2: Core Analysis (Parallel) — Margin, Cost, Revenue, Trend
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 2: Core Analysis"})
    logger.info("Phase 2: Core Analysis (parallel for each company)")
    phase2_results: dict[str, list[Any]] = {"margin": [], "cost": [], "revenue": [], "trend": []}
    for company_id in COMPANIES:
        margin_r, cost_r, revenue_r, trend_r = await asyncio.gather(
            run_margin_analysis(company_id),
            run_cost_analysis(company_id),
            run_revenue_analysis(company_id),
            run_trend_detection(company_id),
        )
        phase2_results["margin"].append(margin_r)
        phase2_results["cost"].append(cost_r)
        phase2_results["revenue"].append(revenue_r)
        phase2_results["trend"].append(trend_r)
    results["phases"]["core_analysis"] = phase2_results
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 2 complete", "percentComplete": 60})

    # Phase 3: Comparative Analysis (Sequential)
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 3: Comparative Analysis"})
    logger.info("Phase 3: Comparative Analysis")
    benchmark_result = await run_benchmark_analysis()

    anomaly_results = []
    for company_id in COMPANIES:
        anomaly_r = await run_anomaly_detection(company_id)
        anomaly_results.append(anomaly_r)

    bestpractice_result = await run_bestpractice_analysis()
    results["phases"]["comparative"] = {
        "benchmark": benchmark_result,
        "anomalies": anomaly_results,
        "bestpractices": bestpractice_result,
    }
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 3 complete", "percentComplete": 85})

    # Phase 4: Synthesis
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 4: Insight Synthesis"})
    logger.info("Phase 4: Insight Generation")
    insight_result = await run_insight_generation()
    results["phases"]["synthesis"] = insight_result

    publish_event("agent:completed", {
        "agentName": "MasterOrchestrator",
        "phase": "Complete",
        "percentComplete": 100,
        "message": "Full analysis pipeline completed successfully",
    })

    logger.info("=== Pipeline Complete ===")
    return results
