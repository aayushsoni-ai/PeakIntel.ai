"""
Agent 3: MarginAnalysisAgent
Calculates and analyzes margin metrics using DuckDB for analytics and Claude for reasoning.
"""

import json
import logging
from typing import Any

from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

from src.tools.db_query_tool import query_company_metadata, write_insight, write_computed_metric
from src.tools.duckdb_tool import calculate_margin_metrics, run_analytical_query
from src.tools.redis_tool import store_agent_findings, publish_agent_event
from src.shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.margin")

PROMPT = """You are the Margin Analysis Agent for Pinnacle Equity Group.

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
- low: informational

Tools available:
{tools}

Tool Names: {tool_names}

Thought: {agent_scratchpad}
Question: {input}"""


def create_margin_agent() -> AgentExecutor:
    """Create the Margin Analysis LangChain agent."""
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)
    tools = [
        query_company_metadata, write_insight, write_computed_metric,
        calculate_margin_metrics, run_analytical_query,
        store_agent_findings, publish_agent_event,
    ]
    prompt = PromptTemplate(
        input_variables=["input", "tools", "tool_names", "agent_scratchpad"],
        template=PROMPT + "\nQuestion: {input}",
    )
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=10, handle_parsing_errors=True)


async def run_margin_analysis(company_id: str) -> dict[str, Any]:
    """Run margin analysis for a company."""
    logger.info(f"Starting margin analysis for {company_id}")
    publish_event("agent:progress", {"agentName": "MarginAnalysis", "message": f"Analyzing margins for {company_id}", "percentComplete": 10})

    try:
        agent = create_margin_agent()
        result = agent.invoke({
            "input": f"Analyze all margin metrics for company '{company_id}' across all 36 months. "
                     "Calculate gross_margin, ebitda_margin, operating_margin trends. "
                     "Flag any critical margin declines. Store findings in Redis."
        })
        findings = {"company_id": company_id, "status": "completed", "output": result.get("output", "")}
        write_findings(f"margin:{company_id}", findings)
        publish_event("agent:progress", {"agentName": "MarginAnalysis", "message": f"Margin analysis complete for {company_id}", "percentComplete": 100})
        return findings
    except Exception as e:
        logger.error(f"Margin analysis failed for {company_id}: {e}")
        return {"company_id": company_id, "status": "failed", "error": str(e)}
