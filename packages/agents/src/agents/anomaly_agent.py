"""
Agent 8: AnomalyDetectionAgent — Statistical anomaly detection using z-score and IQR.
"""
import json, logging
from typing import Any
import numpy as np
from langchain.agents import AgentExecutor, create_react_agent
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.tools import tool
from src.tools.db_query_tool import query_pl_statements, write_insight
from src.tools.redis_tool import store_agent_findings
from src.shared_memory import write_findings, publish_event

logger = logging.getLogger("pinnacle.agents.anomaly")


@tool
def detect_anomalies_zscore(values_json: str, threshold: float = 2.5) -> str:
    """Detect anomalies using z-score method. Input: JSON array of numbers.
    Returns indices and values where |z-score| > threshold."""
    try:
        values = json.loads(values_json)
        arr = np.array(values, dtype=float)
        if len(arr) < 4:
            return json.dumps({"anomalies": [], "note": "Too few data points"})
        mean = float(np.mean(arr))
        std = float(np.std(arr))
        if std == 0:
            return json.dumps({"anomalies": [], "note": "Zero variance"})
        anomalies = []
        for i, v in enumerate(arr):
            z = (v - mean) / std
            if abs(z) > threshold:
                anomalies.append({"index": i, "value": float(v), "z_score": float(z)})
        return json.dumps({"anomalies": anomalies, "mean": mean, "std": std})
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def detect_anomalies_iqr(values_json: str, factor: float = 2.5) -> str:
    """Detect anomalies using IQR method. Flags values outside Q1-factor*IQR or Q3+factor*IQR."""
    try:
        values = json.loads(values_json)
        arr = np.array(values, dtype=float)
        q1, q3 = float(np.percentile(arr, 25)), float(np.percentile(arr, 75))
        iqr = q3 - q1
        lower, upper = q1 - factor * iqr, q3 + factor * iqr
        anomalies = [{"index": i, "value": float(v)} for i, v in enumerate(arr) if v < lower or v > upper]
        return json.dumps({"anomalies": anomalies, "q1": q1, "q3": q3, "iqr": iqr, "lower": lower, "upper": upper})
    except Exception as e:
        return json.dumps({"error": str(e)})


PROMPT = """You are the Anomaly Detection Agent for Pinnacle Equity Group.
1. For each P&L line item across 36 months, calculate z-scores
2. Flag anomalies with |z-score| > 2.5
3. Use IQR method as secondary check
4. Distinguish one-time events vs recurring anomalies
5. Detect seasonality anomalies (same month YoY, delta > 20%)
6. Reason about root causes
7. Generate critical/high insights for anomalies in revenue/GP/EBITDA lines

Tools available:
{tools}

Tool Names: {tool_names}
{agent_scratchpad}
Question: {input}"""

def create_anomaly_agent() -> AgentExecutor:
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)
    tools = [query_pl_statements, write_insight, store_agent_findings, detect_anomalies_zscore, detect_anomalies_iqr]
    prompt = PromptTemplate(input_variables=["input", "tools", "tool_names", "agent_scratchpad"], template=PROMPT)
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=10, handle_parsing_errors=True)

async def run_anomaly_detection(company_id: str) -> dict[str, Any]:
    logger.info(f"Starting anomaly detection for {company_id}")
    publish_event("agent:progress", {"agentName": "AnomalyDetection", "message": f"Scanning for anomalies in {company_id}"})
    try:
        agent = create_anomaly_agent()
        result = agent.invoke({"input": f"Detect anomalies in P&L data for company '{company_id}'. Use z-score and IQR methods. Flag one-time and seasonality anomalies."})
        findings = {"company_id": company_id, "status": "completed", "output": result.get("output", "")}
        write_findings(f"anomalies:{company_id}", findings)
        return findings
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        return {"company_id": company_id, "status": "failed", "error": str(e)}
