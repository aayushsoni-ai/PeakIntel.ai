
import asyncio
import logging
import os
import sys
from typing import Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("pinnacle.agent_server")

app = FastAPI(
    title="Pinnacle AI Agent Server",
    description="Autonomous agent pipeline for portfolio financial analysis",
    version="1.0.0",
)

# Global task tracker
active_tasks: dict[str, asyncio.Task] = {}


@app.post("/run/stop")
async def stop_agents():
    """Cancel all active agent orchestration tasks."""
    cancelled_count = 0
    for task_id, task in list(active_tasks.items()):
        if not task.done():
            task.cancel()
            cancelled_count += 1
            logger.info(f"Cancelled task {task_id}")

    # Also publish a stopped event via shared memory if any tasks were cancelled
    if cancelled_count > 0:
        from src.shared_memory import publish_event
        publish_event("agent:terminated", {
            "message": "All active agent runs have been manually terminated.",
            "timestamp": "now"
        })

    return {"status": "ok", "cancelled_tasks": cancelled_count}


class AgentRequest(BaseModel):
    """Request to run an agent."""
    company_id: str = ""
    period: str = ""


class AgentResponse(BaseModel):
    """Response from an agent run."""
    status: str
    agent_name: str
    result: dict[str, Any] = {}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "pinnacle-agent-server"}


@app.post("/run/full_pipeline", response_model=AgentResponse)
async def run_full_pipeline_endpoint():
    """Run the complete 4-phase analysis pipeline with task tracking.
    Returns immediately and runs the pipeline as a background task."""
    import uuid
    task_id = str(uuid.uuid4())
    
    async def _execute():
        try:
            from src.agents.orchestrator_agent import run_full_pipeline
            result = await run_full_pipeline()
            logger.info(f"Pipeline task {task_id} completed successfully.")
            return result
        except asyncio.CancelledError:
            logger.info(f"Pipeline task {task_id} was cancelled.")
        except Exception as e:
            logger.error(f"Full pipeline task {task_id} failed: {e}")
        finally:
            active_tasks.pop(task_id, None)

    task = asyncio.create_task(_execute())
    active_tasks[task_id] = task
    
    # Return immediately — pipeline runs in the background
    return AgentResponse(status="running", agent_name="MasterOrchestrator", result={"task_id": task_id})


@app.post("/run/normalization", response_model=AgentResponse)
async def run_normalization_endpoint(req: AgentRequest):
    """Run P&L normalization for a company."""
    try:
        from src.agents.normalization_agent import run_normalization
        result = await run_normalization(req.company_id, req.period)
        return AgentResponse(status="completed", agent_name="PLNormalization", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/margin_analysis", response_model=AgentResponse)
async def run_margin_endpoint(req: AgentRequest):
    """Run margin analysis for a company."""
    try:
        from src.agents.margin_agent import run_margin_analysis
        result = await run_margin_analysis(req.company_id)
        return AgentResponse(status="completed", agent_name="MarginAnalysis", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/cost_analysis", response_model=AgentResponse)
async def run_cost_endpoint(req: AgentRequest):
    """Run cost structure analysis for a company."""
    try:
        from src.agents.cost_agent import run_cost_analysis
        result = await run_cost_analysis(req.company_id)
        return AgentResponse(status="completed", agent_name="CostStructure", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/revenue_analysis", response_model=AgentResponse)
async def run_revenue_endpoint(req: AgentRequest):
    """Run revenue quality analysis for a company."""
    try:
        from src.agents.revenue_agent import run_revenue_analysis
        result = await run_revenue_analysis(req.company_id)
        return AgentResponse(status="completed", agent_name="RevenueQuality", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/benchmark_analysis", response_model=AgentResponse)
async def run_benchmark_endpoint():
    """Run benchmark and peer analysis."""
    try:
        from src.agents.benchmark_agent import run_benchmark_analysis
        result = await run_benchmark_analysis()
        return AgentResponse(status="completed", agent_name="BenchmarkPeerAnalysis", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/trend_detection", response_model=AgentResponse)
async def run_trend_endpoint(req: AgentRequest):
    """Run trend detection for a company."""
    try:
        from src.agents.trend_agent import run_trend_detection
        result = await run_trend_detection(req.company_id)
        return AgentResponse(status="completed", agent_name="TrendDetection", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/anomaly_detection", response_model=AgentResponse)
async def run_anomaly_endpoint(req: AgentRequest):
    """Run anomaly detection for a company."""
    try:
        from src.agents.anomaly_agent import run_anomaly_detection
        result = await run_anomaly_detection(req.company_id)
        return AgentResponse(status="completed", agent_name="AnomalyDetection", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/bestpractice_analysis", response_model=AgentResponse)
async def run_bestpractice_endpoint():
    """Run best practice identification."""
    try:
        from src.agents.bestpractice_agent import run_bestpractice_analysis
        result = await run_bestpractice_analysis()
        return AgentResponse(status="completed", agent_name="BestPracticeIdentification", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/insight_generation", response_model=AgentResponse)
async def run_insight_endpoint():
    """Run insight generation and synthesis."""
    try:
        from src.agents.insight_agent import run_insight_generation
        result = await run_insight_generation()
        return AgentResponse(status="completed", agent_name="InsightGeneration", result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class NLQueryRequest(BaseModel):
    """Natural language query request."""
    query: str
    context: dict[str, Any] = {}


@app.post("/query")
async def nl_query_endpoint(req: NLQueryRequest):
    """Answer natural language questions about the portfolio using LLM."""
    try:
        from langchain_groq import ChatGroq
        llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1, max_tokens=2048)

        context_str = ""
        if req.context.get("companies"):
            context_str += "Portfolio Companies:\n"
            for c in req.context["companies"]:
                context_str += f"- {c['name']}: {c['industry']}, Revenue=${c['revenue']:,.0f}, Margin={c['margin']*100:.1f}%\n"

        if req.context.get("recentInsights"):
            context_str += "\nRecent Insights:\n"
            for i in req.context["recentInsights"][:10]:
                context_str += f"- [{i['severity']}] {i['title']}: {i['summary'][:100]}\n"

        prompt = f"""You are an expert private equity financial analyst for Pinnacle Equity Group.
Answer the following question using the portfolio data provided. Be specific with numbers and company names.
Keep your answer concise (3-5 sentences) and actionable.

{context_str}

Question: {req.query}

Answer:"""

        response = llm.invoke(prompt)
        return {"answer": response.content}
    except Exception as e:
        logger.error(f"NL query failed: {e}")
        return {"answer": f"Unable to process query. Error: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

