"""
Agent 2: PLNormalizationAgent
Normalizes P&L data by mapping raw GL accounts to standardized categories.
Uses LangChain ReAct agent with Claude for unmapped account inference.
"""

import json
import logging
from typing import Any

from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

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
- Operating Expense → subdivided into Sales & Marketing, R&D, G&A

Steps:
1. Query the P&L statements for the given company and period
2. Query existing account mappings
3. For any unmapped accounts, infer the correct standard category
4. Validate: sum(Revenue) - sum(COGS) should equal Gross Profit
5. Write normalized amounts and any flagged classifications as insights

You have these tools:
{tools}

Use this format:
Thought: what to do next
Action: tool name
Action Input: tool input
Observation: tool result
... (repeat)
Thought: I now know the final answer
Final Answer: summary of normalization results

{agent_scratchpad}
"""

def create_normalization_agent() -> AgentExecutor:
    """Create the P&L Normalization LangChain agent."""
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        max_tokens=4096,
    )

    tools = [
        query_pl_statements,
        query_account_mappings,
        write_insight,
        write_computed_metric,
        store_agent_findings,
        publish_agent_event,
    ]

    prompt = PromptTemplate(
        input_variables=["input", "tools", "tool_names", "agent_scratchpad"],
        template=SYSTEM_PROMPT + "\nTools available: {tool_names}\nQuestion: {input}",
    )

    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        max_iterations=10,
        handle_parsing_errors=True,
    )


async def run_normalization(company_id: str, period: str = "") -> dict[str, Any]:
    """Run the normalization agent for a company."""
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

        result = agent.invoke({"input": query})

        findings = {
            "company_id": company_id,
            "period": period,
            "status": "completed",
            "output": result.get("output", ""),
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
        error_result = {"company_id": company_id, "status": "failed", "error": str(e)}
        publish_event("agent:failed", {
            "agentName": "PLNormalization",
            "error": str(e),
        })
        return error_result
