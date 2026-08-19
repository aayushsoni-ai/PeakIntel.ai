"""
Agent 1: MasterAnalyticsOrchestrator
Coordinates the full 4-phase pipeline across all 10 agents using LangGraph and PaperclipAI.
"""
import asyncio
import os
import logging
from typing import Any


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
from src.paperclipai import PaperclipAI, PipelineState

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

# Initialize PaperclipAI orchestrator
config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "paperclip_config", "config.yaml")
orchestrator = PaperclipAI(config_path)

# Define Node Operations mapped to the 4 phases in config.yaml

async def phase_1_preparation(state: PipelineState) -> PipelineState:
    logger.info("Phase 1: P&L Normalization for all companies")
    publish_event("agent:started", {"agentName": "MasterOrchestrator", "phase": "Phase 1: Normalization"})
    
    phase1_results = []
    # Sequential execution of normalization
    for company_id in state["companies"]:
        result = await run_normalization(company_id)
        phase1_results.append(result)
        await asyncio.sleep(3) # Increased delay between company normalizations (TPM limit 12k)
        
    state["results"]["normalization"] = phase1_results
    state["current_phase"] = "Phase 1 complete"
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 1 complete", "percentComplete": 25})
    return state

async def phase_2_core_analysis(state: PipelineState) -> PipelineState:
    await asyncio.sleep(2) # Delay between phases
    logger.info("Phase 2: Core Analysis (parallel for each company)")
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 2: Core Analysis"})
    
    phase2_results: dict[str, list[Any]] = {"margin": [], "cost": [], "revenue": [], "trend": []}
    for company_id in state["companies"]:
        # Staggered execution of core agents to avoid hitting TPM limits (12k tokens)
        margin_r = await run_margin_analysis(company_id)
        await asyncio.sleep(2)
        cost_r = await run_cost_analysis(company_id)
        await asyncio.sleep(2)
        revenue_r = await run_revenue_analysis(company_id)
        await asyncio.sleep(2)
        trend_r = await run_trend_detection(company_id)
        phase2_results["margin"].append(margin_r)
        phase2_results["cost"].append(cost_r)
        phase2_results["revenue"].append(revenue_r)
        phase2_results["trend"].append(trend_r)
        await asyncio.sleep(5) # Delay between company batches to avoid cumulative TPM spikes
        
    state["results"]["core_analysis"] = phase2_results
    state["current_phase"] = "Phase 2 complete"
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 2 complete", "percentComplete": 60})
    return state

async def phase_3_comparative_analysis(state: PipelineState) -> PipelineState:
    await asyncio.sleep(2) # Delay between phases
    logger.info("Phase 3: Comparative Analysis")
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 3: Comparative Analysis"})
    
    benchmark_result = await run_benchmark_analysis()
    anomaly_results = []
    for company_id in state["companies"]:
        anomaly_r = await run_anomaly_detection(company_id)
        anomaly_results.append(anomaly_r)
        await asyncio.sleep(1) # Delay between sequential anomaly runs
        
    bestpractice_result = await run_bestpractice_analysis()
    
    state["results"]["comparative"] = {
        "benchmark": benchmark_result,
        "anomalies": anomaly_results,
        "bestpractices": bestpractice_result,
    }
    state["current_phase"] = "Phase 3 complete"
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 3 complete", "percentComplete": 85})
    return state

async def phase_4_synthesis(state: PipelineState) -> PipelineState:
    await asyncio.sleep(2) # Delay before final synthesis
    logger.info("Phase 4: Insight Generation")
    publish_event("agent:progress", {"agentName": "MasterOrchestrator", "phase": "Phase 4: Insight Synthesis"})
    
    insight_result = await run_insight_generation()
    state["results"]["synthesis"] = insight_result
    state["current_phase"] = "Complete"
    
    publish_event("agent:completed", {
        "agentName": "MasterOrchestrator",
        "phase": "Complete",
        "percentComplete": 100,
        "message": "Full analysis pipeline completed successfully via LangGraph",
    })
    return state


# Register functions with PaperclipAI based on the names in config.yaml
orchestrator.register_node("Phase 1 - Preparation", phase_1_preparation)
orchestrator.register_node("Phase 2 - Core Analysis", phase_2_core_analysis)
orchestrator.register_node("Phase 3 - Comparative Analysis", phase_3_comparative_analysis)
orchestrator.register_node("Phase 4 - Synthesis", phase_4_synthesis)

async def run_full_pipeline() -> dict[str, Any]:
    """Execute the full pipeline using the LangGraph engine orchestrated by PaperclipAI."""
    logger.info("=== Starting Full Analysis Pipeline (PaperclipAI & LangGraph) ===")
    
    initial_state = PipelineState(
        companies=COMPANIES,
        current_phase="Init",
        results={"phases": {}} # maintain structure for older UI payload expectations if possible
    )
    
    # Invokes the compiled LangGraph StateGraph internally
    final_state = await orchestrator.invoke(initial_state)
    logger.info("=== Pipeline Complete ===")
    
    # Map back to old expected dict result structure for caller
    return {"phases": final_state["results"]}
