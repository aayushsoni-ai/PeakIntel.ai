"""
Agent 5: RevenueQualityAgent — Analyzes revenue composition, growth, and concentration risk.
"""
import json, logging
from typing import Any
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from tools.db_query_tool import query_pl_statements, query_company_metadata, write_insight, write_computed_metric
from tools.redis_tool import store_agent_findings
from shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.revenue")

SYSTEM_PROMPT = """You are the Revenue Quality Agent for Pinnacle Equity Group.
Analyze revenue quality:
1. Revenue composition: Recurring %, Services %, Other %
2. Revenue growth: MoM, YoY, 3-year CAGR
3. Organic vs inorganic growth patterns
4. Revenue concentration risk
5. Revenue per employee
6. Flag: high one-time revenue %, declining recurring %"""

def create_revenue_agent():
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)
    tools = [query_pl_statements, query_company_metadata, write_insight, write_computed_metric, store_agent_findings]
    return create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)

async def run_revenue_analysis(company_id: str) -> dict[str, Any]:
    logger.info(f"Starting revenue analysis for {company_id}")
    publish_event("agent:progress", {"agentName": "RevenueQuality", "message": f"Analyzing revenue for {company_id}"})
    try:
        agent = create_revenue_agent()
        result = agent.invoke({"messages": [{"role": "user", "content": f"Analyze revenue quality for company '{company_id}'. Calculate recurring %, growth rates, revenue per employee. Flag concentration risks."}]})
        output = result["messages"][-1].content
        findings = {"company_id": company_id, "status": "completed", "output": output}
        write_findings(f"revenue:{company_id}", findings)
        return findings
    except Exception as e:
        logger.error(f"Revenue analysis failed: {e}")
        return {"company_id": company_id, "status": "failed", "error": str(e)}