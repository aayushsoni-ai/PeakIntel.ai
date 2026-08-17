"""
Agent 9: BestPracticeIdentificationAgent — Identifies what top performers do differently.
"""
import json, logging
from typing import Any
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from tools.db_query_tool import write_insight
from tools.redis_tool import read_all_agent_findings, store_agent_findings
from shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.bestpractice")

SYSTEM_PROMPT = """You are the Best Practice Identification Agent for Pinnacle Equity Group.
1. Query all agents' Redis findings (margin:*, costs:*, revenue:*, rankings:latest)
2. Identify what top performers do differently:
   - ZetaSoftware: highest gross margins (78%) — analyze what drives this
   - BetaMfg: best operational efficiency in manufacturing
   - ThetaConsulting: strong utilization and margin consistency
3. Quantify value creation potential if applied to underperformers
4. Generate structured bestpractice insights"""

def create_bestpractice_agent():
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, max_tokens=4096)
    tools = [read_all_agent_findings, write_insight, store_agent_findings]
    return create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)

async def run_bestpractice_analysis() -> dict[str, Any]:
    logger.info("Starting best practice identification")
    publish_event("agent:progress", {"agentName": "BestPracticeIdentification", "message": "Identifying best practices across portfolio"})
    try:
        agent = create_bestpractice_agent()
        result = agent.invoke({"messages": [{"role": "user", "content": "Identify best practices by reading all agent findings from Redis. Focus on ZetaSoftware (78% GM), BetaMfg (manufacturing efficiency), ThetaConsulting (utilization). Quantify value if applied to underperformers."}]})
        output = result["messages"][-1].content
        findings = {"status": "completed", "output": output}
        write_findings("bestpractices:latest", findings)
        return findings
    except Exception as e:
        logger.error(f"Best practice analysis failed: {e}")
        return {"status": "failed", "error": str(e)}