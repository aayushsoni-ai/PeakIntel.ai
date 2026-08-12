"""
Agent 10: InsightGenerationAndCommunicationAgent
Synthesizes all findings into final insights and triggers emails.
Uses claude-opus for highest quality output.
"""
import json, logging
from typing import Any
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from src.tools.db_query_tool import write_insight
from src.tools.redis_tool import read_all_agent_findings, store_agent_findings, publish_agent_event
from src.shared_memory import write_findings, publish_event, read_all_findings

logger = logging.getLogger("pinnacle.agents.insight")

PROMPT = """You are the Insight Generation Agent for Pinnacle Equity Group.
This is the final agent in the pipeline. Your job:
1. Read ALL agent findings from Redis (normalization:*, margin:*, costs:*, revenue:*, rankings:latest, trends:*, anomalies:*, bestpractices:latest)
2. Synthesize into a prioritized, deduplicated insight list
3. For each insight, generate:
   - Concise title (< 10 words)
   - Board-ready natural language summary (2-3 sentences)
   - 2-3 specific recommended actions
4. Write all Insight records to PostgreSQL
5. Trigger email events via Redis pub/sub

Tools available:
{tools}

Tool Names: {tool_names}
{agent_scratchpad}
Question: {input}"""

def create_insight_agent() -> AgentExecutor:
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1, max_tokens=8192)
    tools = [read_all_agent_findings, write_insight, store_agent_findings, publish_agent_event]
    prompt = PromptTemplate(input_variables=["input", "tools", "tool_names", "agent_scratchpad"], template=PROMPT)
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=15, handle_parsing_errors=True)

async def run_insight_generation() -> dict[str, Any]:
    logger.info("Starting insight generation and synthesis")
    publish_event("agent:progress", {"agentName": "InsightGeneration", "message": "Synthesizing all agent findings into insights"})
    try:
        agent = create_insight_agent()
        result = agent.invoke({"input": "Read all agent findings from Redis. Synthesize into prioritized insights. Write each insight to the database. For critical insights, publish to 'insights:new' channel. Generate concise, board-ready summaries."})
        findings = {"status": "completed", "output": result.get("output", "")}
        write_findings("insights:latest", findings)
        publish_event("insights:new", {"message": "New insights generated", "source": "InsightGeneration"})
        return findings
    except Exception as e:
        logger.error(f"Insight generation failed: {e}")
        return {"status": "failed", "error": str(e)}
