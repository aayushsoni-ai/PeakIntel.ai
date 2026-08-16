"""
Agent 2: PLNormalizationAgent
Normalizes P&L data by mapping raw GL accounts to standardized categories.
Uses LangGraph ReAct agent with Groq for unmapped account inference.
"""
import json
import logging
from typing import Any
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from src.tools.db_query_tool import (
    query_pl_statements,
    query_account_mappings,
    write_insight,
    write_computed_metric,
)
from src.tools.redis_tool import store_agent_findings, publish_agent_event
from src.shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.normalization")

SYSTEM_PROMPT = """You are the P&L Normalization Agent for Pinnacle Equity Group.

Your job is to normalize P&L statements by mapping raw GL accounts to standardized categories:
- Revenue (Recurring, Services, Other)
- COGS (Materials, Labor, Infrastructure, etc.)
- Operating Expense -> subdivided into Sales & Marketing, R&D, G&A

If the dataset is large, process one period at a time to stay within context limits (12k tokens).

Steps:
1. Query the P&L statements for the given company
2. Query existing account mappings
3. For any unmapped accounts, infer the correct standard category
4. Validate: sum(Revenue) - sum(COGS) should equal Gross Profit
5. Write normalized amounts and any flagged classifications as insights"""

def create_normalization_agent():
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, max_tokens=4096)
    tools = [
        query_pl_statements,
        query_account_mappings,
        write_insight,
        write_computed_metric,
        store_agent_findings,
        publish_agent_event,
    ]
    return create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)

async def run_normalization(company_id: str, period: str = "") -> dict[str, Any]:
    logger.info(f"Starting normalization for {company_id} period={period}")
    publish_event("agent:progress", {
        "agentName": "PLNormalization",
        "message": f"Normalizing P&L for {company_id}",
        "percentComplete": 10,
    })
    try:
        agent = create_normalization_agent()
        query = (
            f"Normalize the P&L statements for company '{company_id}'. "
            f"{'For period: ' + period if period else 'For all periods.'} "
            "Map all GL accounts to standard categories (Revenue, COGS, Operating Expense). "
            "Flag any unusual classifications as medium-severity insights. "
            "Validate that Revenue - COGS = Gross Profit."
        )
        result = agent.invoke({"messages": [{"role": "user", "content": query}]})
        output = result["messages"][-1].content
        findings = {
            "company_id": company_id,
            "period": period,
            "status": "completed",
            "output": output,
        }
        write_findings(f"normalization:{company_id}:{period or 'all'}", findings)
        publish_event("agent:progress", {
            "agentName": "PLNormalization",
            "message": f"Normalization complete for {company_id}",
            "percentComplete": 100,
        })
        return findings
    except Exception as e:
        logger.error(f"Normalization failed for {company_id}: {e}")
        publish_event("agent:failed", {"agentName": "PLNormalization", "error": str(e)})
        return {"company_id": company_id, "status": "failed", "error": str(e)}