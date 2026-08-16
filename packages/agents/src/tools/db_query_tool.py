"""
LangChain tools for database queries — used by all agents.
"""

import os
import json
import logging
from typing import Any

import psycopg2
from langchain.tools import tool
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("pinnacle.tools.db_query")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://pinnacle:password@localhost:5432/pinnacle_db")


def _get_connection():
    """Get a PostgreSQL connection."""
    # Parse the DATABASE_URL for psycopg2
    url = DATABASE_URL
    if url.startswith("prisma+postgres://"):
        # Convert Prisma URL to standard postgres URL
        url = url.replace("prisma+postgres://", "postgresql://")
    return psycopg2.connect(url)


@tool
def query_pl_statements(company_id: str, period: str = "") -> str:
    """Query P&L statements for a company. Optionally filter by period (e.g., '2023-01').
    Returns JSON array of rows with account_code, account_name, standard_category, amount."""
    conn = _get_connection()
    try:
        cur = conn.cursor()
        if period:
            cur.execute(
                'SELECT "accountCode", "accountName", "standardCategory", "amount" '
                'FROM pl_statements WHERE "companyId" = %s AND "period" = %s',
                (company_id, period),
            )
        else:
            cur.execute(
                'SELECT "accountCode", "accountName", "standardCategory", "amount", "period" '
                'FROM pl_statements WHERE "companyId" = %s ORDER BY "period"',
                (company_id,),
            )
        columns = [desc[0] for desc in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]
        # Reduce limit to 100 rows to fit within TPM limits (12k tokens)
        return json.dumps(rows[:100], default=str)
    except Exception as e:
        logger.error(f"DB query failed: {e}")
        return json.dumps({"error": str(e)})
    finally:
        conn.close()


@tool
def query_account_mappings(company_id: str) -> str:
    """Query account mappings for a company. Returns mapping of account codes to standard categories."""
    conn = _get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            'SELECT "originalAccountCode", "originalAccountName", "standardCategory", '
            '"standardSubcategory" FROM account_mappings WHERE "companyId" = %s',
            (company_id,),
        )
        columns = [desc[0] for desc in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]
        return json.dumps(rows[:100], default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
    finally:
        conn.close()


@tool
def query_company_metadata(company_id: str) -> str:
    """Get company metadata including name, industry, revenue, margin profile."""
    conn = _get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            'SELECT id, name, industry, sector, "annualRevenue", "employeeCount", '
            '"marginProfile", geography FROM companies WHERE id = %s',
            (company_id,),
        )
        row = cur.fetchone()
        if row:
            columns = [desc[0] for desc in cur.description]
            return json.dumps(dict(zip(columns, row)), default=str)
        return json.dumps({"error": "Company not found"})
    except Exception as e:
        return json.dumps({"error": str(e)})
    finally:
        conn.close()


@tool
def query_industry_benchmarks(industry: str) -> str:
    """Get industry benchmark percentiles for a given industry."""
    conn = _get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            'SELECT "metricName", p25, p50, p75, p90 '
            "FROM industry_benchmarks WHERE industry = %s",
            (industry,),
        )
        columns = [desc[0] for desc in cur.description]
        rows = [dict(zip(columns, row)) for row in cur.fetchall()]
        return json.dumps(rows, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
    finally:
        conn.close()


@tool
def write_insight(
    company_id: str,
    agent_name: str,
    severity: str,
    category: str,
    title: str,
    summary: str,
    recommendations: str,
) -> str:
    """Write an insight record to the database.
    severity: critical, high, medium, low
    category: margin, cost, revenue, benchmark, trend, anomaly, bestpractice
    recommendations: JSON-encoded array of strings"""
    conn = _get_connection()
    try:
        cur = conn.cursor()
        import uuid

        insight_id = str(uuid.uuid4())[:25]
        recs = json.loads(recommendations) if recommendations else []
        cur.execute(
            "INSERT INTO insights "
            '(id, "companyId", "agentName", severity, category, title, summary, '
            'recommendations, status, "createdAt") '
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())",
            (insight_id, company_id, agent_name, severity, category, title, summary,
             json.dumps(recs), "new"),
        )
        conn.commit()
        return json.dumps({"success": True, "insight_id": insight_id})
    except Exception as e:
        conn.rollback()
        return json.dumps({"error": str(e)})
    finally:
        conn.close()


@tool
def write_computed_metric(
    company_id: str, period: str, metric_name: str, value: float
) -> str:
    """Write a computed metric to the database."""
    conn = _get_connection()
    try:
        cur = conn.cursor()
        import uuid

        metric_id = str(uuid.uuid4())[:25]
        cur.execute(
            "INSERT INTO computed_metrics "
            '(id, "companyId", period, "metricName", value, "createdAt") '
            "VALUES (%s, %s, %s, %s, %s, NOW())",
            (metric_id, company_id, period, metric_name, value),
        )
        conn.commit()
        return json.dumps({"success": True})
    except Exception as e:
        conn.rollback()
        return json.dumps({"error": str(e)})
    finally:
        conn.close()
