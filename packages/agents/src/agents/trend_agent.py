"""
Agent 7: TrendDetectionAgent — Statistical trend analysis with numpy.
"""
import json, logging
from typing import Any
import numpy as np
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from tools.db_query_tool import query_company_metadata, write_insight, write_computed_metric
from tools.duckdb_tool import run_analytical_query
from tools.redis_tool import store_agent_findings
from shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.trend")


@tool
def fit_linear_trend(values_json: str) -> str:
    """Fit a linear regression to a series of numeric values.
    Input: JSON array of numbers. Output: slope, direction, r_squared."""
    try:
        values = json.loads(values_json)
        x = np.arange(len(values), dtype=float)
        y = np.array(values, dtype=float)
        if len(y) < 3:
            return json.dumps({"error": "Need at least 3 data points"})
        coeffs = np.polyfit(x, y, 1)
        slope = float(coeffs[0])
        direction = "improving" if slope > 0.005 else "declining" if slope < -0.005 else "stable"
        y_pred = np.polyval(coeffs, x)
        ss_res = float(np.sum((y - y_pred) ** 2))
        ss_tot = float(np.sum((y - np.mean(y)) ** 2))
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        projected_6m = float(np.polyval(coeffs, len(values) + 6))
        return json.dumps({"slope": slope, "direction": direction, "r_squared": r_squared, "projected_6m": projected_6m})
    except Exception as e:
        return json.dumps({"error": str(e)})


SYSTEM_PROMPT = """You are the Trend Detection Agent for Pinnacle Equity Group.
1. For each company and metric, fit linear regression over trailing 12 months
2. Classify: improving (slope > 0.5%/mo), declining (< -0.5%/mo), stable
3. Detect inflection points
4. Calculate 3-year CAGR
5. Project forward 6 months
6. Flag concerning trends (e.g., EpsilonLogistics EBITDA margin declining)"""

def create_trend_agent():
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, max_tokens=4096)
    tools = [query_company_metadata, run_analytical_query, write_insight, write_computed_metric, store_agent_findings, fit_linear_trend]
    return create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)

async def run_trend_detection(company_id: str) -> dict[str, Any]:
    logger.info(f"Starting trend detection for {company_id}")
    publish_event("agent:progress", {"agentName": "TrendDetection", "message": f"Detecting trends for {company_id}"})
    try:
        agent = create_trend_agent()
        result = agent.invoke({"messages": [{"role": "user", "content": f"Detect trends for company '{company_id}' across revenue, gross_margin, ebitda_margin, opex_pct over 36 months. Use the fit_linear_trend tool. Flag concerning trends."}]})
        output = result["messages"][-1].content
        findings = {"company_id": company_id, "status": "completed", "output": output}
        write_findings(f"trends:{company_id}", findings)
        return findings
    except Exception as e:
        logger.error(f"Trend detection failed: {e}")
        return {"company_id": company_id, "status": "failed", "error": str(e)}