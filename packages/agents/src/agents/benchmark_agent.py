"""
Agent 6: BenchmarkAndPeerAnalysisAgent — Cross-company rankings and peer comparisons.
"""
import json, logging
from typing import Any
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from src.tools.db_query_tool import query_company_metadata, query_industry_benchmarks, write_insight, write_computed_metric
from src.tools.duckdb_tool import run_analytical_query
from src.tools.redis_tool import store_agent_findings
from src.shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.benchmark")

PROMPT = """You are the Benchmark & Peer Analysis Agent for Pinnacle Equity Group.
1. Rank all 10 companies on: revenue growth, gross margin, EBITDA margin, cost efficiency
2. Calculate percentile rank vs industry benchmarks
3. Compare against PeerComp public comparables
4. Identify top and bottom performers
5. Analyze performance gaps with narrative explanations

Tools available:
{tools}

Tool Names: {tool_names}
{agent_scratchpad}
Question: {input}"""

def create_benchmark_agent() -> AgentExecutor:
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)
    tools = [query_company_metadata, query_industry_benchmarks, run_analytical_query, write_insight, write_computed_metric, store_agent_findings]
    prompt = PromptTemplate(input_variables=["input", "tools", "tool_names", "agent_scratchpad"], template=PROMPT)
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=10, handle_parsing_errors=True)

async def run_benchmark_analysis() -> dict[str, Any]:
    logger.info("Starting benchmark analysis")
    publish_event("agent:progress", {"agentName": "BenchmarkPeerAnalysis", "message": "Running portfolio-wide benchmarking"})
    try:
        agent = create_benchmark_agent()
        result = agent.invoke({"input": "Rank all 10 portfolio companies on key financial metrics. Compare against industry benchmarks and public peer comparables. Identify ZetaSoftware as top performer (78% GM) and analyze why."})
        findings = {"status": "completed", "output": result.get("output", "")}
        write_findings("rankings:latest", findings)
        return findings
    except Exception as e:
        logger.error(f"Benchmark analysis failed: {e}")
        return {"status": "failed", "error": str(e)}
