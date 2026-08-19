"""
Agent 3: MarginAnalysisAgent
Calculates and analyzes margin metrics using DuckDB for analytics and Groq for reasoning.
"""
import json
import logging
from typing import Any
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from src.tools.db_query_tool import query_company_metadata, write_insight, write_computed_metric
from src.tools.duckdb_tool import calculate_margin_metrics, run_analytical_query
from src.tools.redis_tool import store_agent_findings, publish_agent_event
from src.shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.margin")

SYSTEM_PROMPT = """You are the Margin Analysis Agent for Pinnacle Equity Group.

Analyze margins for portfolio companies:
1. Calculate gross_margin, ebitda_margin, operating_margin for each period
2. Analyze 36-month trend using linear regression direction
3. Decompose margin movements (volume, price/mix, cost effects)
4. Compare against portfolio median and top quartile
5. Identify improvement opportunities

Severity rules:
- critical: margin declined > 3 percentage points in 3 months
- high: margin below industry p25
- medium: negative margin trend
- low: informational"""

def create_margin_agent():
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, max_tokens=4096)
    tools = [
        query_company_metadata, write_insight, write_computed_metric,
        calculate_margin_metrics, run_analytical_query,
        store_agent_findings, publish_agent_event,
    ]
    return create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)

async def run_margin_analysis(company_id: str) -> dict[str, Any]:
    logger.info(f"Starting margin analysis for {company_id}")
    publish_event("agent:progress", {"agentName": "MarginAnalysis", "message": f"Analyzing margins for {company_id}", "percentComplete": 10})
    try:
        agent = create_margin_agent()
        result = agent.invoke({
            "messages": [{"role": "user", "content": (
                f"Analyze all margin metrics for company '{company_id}' across all 36 months. "
                "Calculate gross_margin, ebitda_margin, operating_margin trends. "
                "Flag any critical margin declines. Store findings in Redis."
            )}]
        })
        output = result["messages"][-1].content
        findings = {"company_id": company_id, "status": "completed", "output": output}
        write_findings(f"margin:{company_id}", findings)
        publish_event("agent:progress", {"agentName": "MarginAnalysis", "message": f"Margin analysis complete for {company_id}", "percentComplete": 100})
        return findings
    except Exception as e:
        logger.error(f"Margin analysis failed for {company_id}: {e}")
        return {"company_id": company_id, "status": "failed", "error": str(e)}