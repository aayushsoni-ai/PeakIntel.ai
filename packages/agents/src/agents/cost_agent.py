"""
Agent 4: CostStructureAgent — Analyzes cost ratios, fixed/variable decomposition, and benchmarking.
"""
import json, logging
from typing import Any
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from src.tools.db_query_tool import query_pl_statements, query_company_metadata, query_industry_benchmarks, write_insight, write_computed_metric
from src.tools.redis_tool import store_agent_findings, publish_agent_event
from src.shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.cost")

SYSTEM_PROMPT = """You are the Cost Structure Agent for Pinnacle Equity Group.
Analyze cost structure for portfolio companies:
1. Calculate COGS%, S&M%, R&D%, G&A% as percentage of revenue
2. Separate fixed vs variable costs using industry heuristics
3. Calculate operating leverage
4. Benchmark each ratio against IndustryBenchmark percentiles
5. Flag outliers (e.g., DeltaRetail SG&A creep, EpsilonLogistics margin compression)
6. Model cost reduction scenarios"""

def create_cost_agent():
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)
    tools = [query_pl_statements, query_company_metadata, query_industry_benchmarks, write_insight, write_computed_metric, store_agent_findings, publish_agent_event]
    return create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)

async def run_cost_analysis(company_id: str) -> dict[str, Any]:
    logger.info(f"Starting cost analysis for {company_id}")
    publish_event("agent:progress", {"agentName": "CostStructure", "message": f"Analyzing costs for {company_id}"})
    try:
        agent = create_cost_agent()
        result = agent.invoke({"messages": [{"role": "user", "content": f"Analyze the cost structure of company '{company_id}'. Calculate COGS%, SG&A%, R&D%, G&A% ratios. Benchmark against industry. Flag any cost outliers."}]})
        output = result["messages"][-1].content
        findings = {"company_id": company_id, "status": "completed", "output": output}
        write_findings(f"costs:{company_id}", findings)
        return findings
    except Exception as e:
        logger.error(f"Cost analysis failed: {e}")
        return {"company_id": company_id, "status": "failed", "error": str(e)}