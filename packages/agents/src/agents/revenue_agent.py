"""
Agent 5: RevenueQualityAgent — Analyzes revenue composition, growth, and concentration risk.
"""
import json, logging
from typing import Any
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from src.tools.db_query_tool import query_pl_statements, query_company_metadata, write_insight, write_computed_metric
from src.tools.redis_tool import store_agent_findings
from src.shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.revenue")

PROMPT = """You are the Revenue Quality Agent for Pinnacle Equity Group.
Analyze revenue quality:
1. Revenue composition: Recurring %, Services %, Other %
2. Revenue growth: MoM, YoY, 3-year CAGR
3. Organic vs inorganic growth patterns
4. Revenue concentration risk
5. Revenue per employee
6. Flag: high one-time revenue %, declining recurring %

Tools available:
{tools}

Tool Names: {tool_names}
{agent_scratchpad}
Question: {input}"""

def create_revenue_agent() -> AgentExecutor:
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)
    tools = [query_pl_statements, query_company_metadata, write_insight, write_computed_metric, store_agent_findings]
    prompt = PromptTemplate(input_variables=["input", "tools", "tool_names", "agent_scratchpad"], template=PROMPT)
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=10, handle_parsing_errors=True)

async def run_revenue_analysis(company_id: str) -> dict[str, Any]:
    logger.info(f"Starting revenue analysis for {company_id}")
    publish_event("agent:progress", {"agentName": "RevenueQuality", "message": f"Analyzing revenue for {company_id}"})
    try:
        agent = create_revenue_agent()
        result = agent.invoke({"input": f"Analyze revenue quality for company '{company_id}'. Calculate recurring %, growth rates, revenue per employee. Flag concentration risks."})
        findings = {"company_id": company_id, "status": "completed", "output": result.get("output", "")}
        write_findings(f"revenue:{company_id}", findings)
        return findings
    except Exception as e:
        logger.error(f"Revenue analysis failed: {e}")
        return {"company_id": company_id, "status": "failed", "error": str(e)}
