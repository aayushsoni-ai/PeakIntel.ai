"""
Agent 6: BenchmarkAndPeerAnalysisAgent — Cross-company rankings and peer comparisons.
"""
import json, logging
from typing import Any
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from tools.db_query_tool import query_company_metadata, query_industry_benchmarks, write_insight, write_computed_metric
from tools.duckdb_tool import run_analytical_query
from tools.redis_tool import store_agent_findings
from shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.benchmark")

SYSTEM_PROMPT = """You are the Benchmark & Peer Analysis Agent for Pinnacle Equity Group.
1. Rank all 10 companies on: revenue growth, gross margin, EBITDA margin, cost efficiency
2. Calculate percentile rank vs industry benchmarks
3. Compare against PeerComp public comparables
4. Identify top and bottom performers
5. Analyze performance gaps with narrative explanations"""

def create_benchmark_agent():
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)
    tools = [query_company_metadata, query_industry_benchmarks, run_analytical_query, write_insight, write_computed_metric, store_agent_findings]
    return create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)

async def run_benchmark_analysis() -> dict[str, Any]:
    logger.info("Starting benchmark analysis")
    publish_event("agent:progress", {"agentName": "BenchmarkPeerAnalysis", "message": "Running portfolio-wide benchmarking"})
    try:
        agent = create_benchmark_agent()
        result = agent.invoke({"messages": [{"role": "user", "content": "Rank all 10 portfolio companies on key financial metrics. Compare against industry benchmarks and public peer comparables. Identify ZetaSoftware as top performer (78% GM) and analyze why."}]})
        output = result["messages"][-1].content
        findings = {"status": "completed", "output": output}
        write_findings("rankings:latest", findings)
        return findings
    except Exception as e:
        logger.error(f"Benchmark analysis failed: {e}")
        return {"status": "failed", "error": str(e)}