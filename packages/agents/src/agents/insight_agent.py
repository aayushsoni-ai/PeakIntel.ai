"""
Agent 10: InsightGenerationAndCommunicationAgent
Synthesizes all findings into final insights and triggers emails.
"""
import json, logging
from typing import Any
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from tools.db_query_tool import write_insight
from tools.redis_tool import read_all_agent_findings, store_agent_findings, publish_agent_event
from shared_memory import write_findings, publish_event, read_all_findings

logger = logging.getLogger("pinnacle.agents.insight")

SYSTEM_PROMPT = """You are the Insight Generation Agent for Pinnacle Equity Group.
This is the final agent in the pipeline. Your job:
1. Read ALL agent findings from Redis (normalization:*, margin:*, costs:*, revenue:*, rankings:latest, trends:*, anomalies:*, bestpractices:latest)
2. Synthesize into a prioritized, deduplicated insight list
3. For each insight, generate:
   - Concise title (< 10 words)
   - Board-ready natural language summary (2-3 sentences)
   - 2-3 specific recommended actions
4. Write all Insight records to PostgreSQL
5. Trigger email events via Redis pub/sub"""

def create_insight_agent():
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1, max_tokens=8192)
    tools = [read_all_agent_findings, write_insight, store_agent_findings, publish_agent_event]
    return create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)

async def run_insight_generation() -> dict[str, Any]:
    logger.info("Starting insight generation and synthesis")
    publish_event("agent:progress", {"agentName": "InsightGeneration", "message": "Synthesizing all agent findings into insights"})
    try:
        agent = create_insight_agent()
        result = agent.invoke({"messages": [{"role": "user", "content": "Read all agent findings from Redis. Synthesize into prioritized insights. Write each insight to the database. For critical insights, publish to 'insights:new' channel. Generate concise, board-ready summaries."}]})
        output = result["messages"][-1].content
        findings = {"status": "completed", "output": output}
        write_findings("insights:latest", findings)
        publish_event("insights:new", {"message": "New insights generated", "source": "InsightGeneration"})
        return findings
    except Exception as e:
        logger.error(f"Insight generation failed: {e}")
        return {"status": "failed", "error": str(e)}