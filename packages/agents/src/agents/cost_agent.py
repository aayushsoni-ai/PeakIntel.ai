"""
Agent 4: CostStructureAgent — Analyzes cost ratios, fixed/variable decomposition, and benchmarking.
"""
import json, logging
from typing import Any
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from src.tools.db_query_tool import query_pl_statements, query_company_metadata, query_industry_benchmarks, write_insight, write_computed_metric
from src.tools.redis_tool import store_agent_findings, publish_agent_event
from src.shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.cost")

PROMPT = """You are the Cost Structure Agent for Pinnacle Equity Group.
Analyze cost structure for portfolio companies:
1. Calculate COGS%, S&M%, R&D%, G&A% as percentage of revenue
2. Separate fixed vs variable costs using industry heuristics
3. Calculate operating leverage
4. Benchmark each ratio against IndustryBenchmark percentiles
5. Flag outliers (e.g., DeltaRetail SG&A creep, EpsilonLogistics margin compression)
6. Model cost reduction scenarios

Tools available:
{tools}

Tool Names: {tool_names}
{agent_scratchpad}
Question: {input}"""

def create_cost_agent() -> AgentExecutor:
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)
    tools = [query_pl_statements, query_company_metadata, query_industry_benchmarks, write_insight, write_computed_metric, store_agent_findings, publish_agent_event]
    prompt = PromptTemplate(input_variables=["input", "tools", "tool_names", "agent_scratchpad"], template=PROMPT)
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=10, handle_parsing_errors=True)

async def run_cost_analysis(company_id: str) -> dict[str, Any]:
    logger.info(f"Starting cost analysis for {company_id}")
    publish_event("agent:progress", {"agentName": "CostStructure", "message": f"Analyzing costs for {company_id}"})
    try:
        agent = create_cost_agent()
        result = agent.invoke({"input": f"Analyze the cost structure of company '{company_id}'. Calculate COGS%, SG&A%, R&D%, G&A% ratios. Benchmark against industry. Flag any cost outliers."})
        findings = {"company_id": company_id, "status": "completed", "output": result.get("output", "")}
        write_findings(f"costs:{company_id}", findings)
        return findings
    except Exception as e:
        logger.error(f"Cost analysis failed: {e}")
        return {"company_id": company_id, "status": "failed", "error": str(e)}
