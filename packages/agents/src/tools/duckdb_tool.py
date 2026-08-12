"""
DuckDB analytical tool for LangChain agents — in-process OLAP queries.
"""

import os
import json
import logging

import duckdb
from langchain.tools import tool
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("pinnacle.tools.duckdb")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://pinnacle:password@localhost:5432/pinnacle_db")


def _get_duckdb_conn():
    """Get a DuckDB connection with PostgreSQL data loaded."""
    conn = duckdb.connect()
    try:
        conn.execute("INSTALL postgres; LOAD postgres;")
        pg_url = DATABASE_URL
        if pg_url.startswith("prisma+postgres://"):
            pg_url = pg_url.replace("prisma+postgres://", "postgresql://")
        conn.execute(f"ATTACH '{pg_url}' AS pg (TYPE postgres, READ_ONLY);")
    except Exception as e:
        logger.warning(f"Could not attach PostgreSQL to DuckDB: {e}")
    return conn


@tool
def run_analytical_query(sql: str) -> str:
    """Run an analytical SQL query using DuckDB for fast OLAP processing.
    Available tables (prefix with pg.public.): pl_statements, companies,
    computed_metrics, kpi_records, industry_benchmarks, peer_comps.
    Returns JSON results."""
    conn = _get_duckdb_conn()
    try:
        result = conn.execute(sql).fetchdf()
        return result.to_json(orient="records")
    except Exception as e:
        return json.dumps({"error": str(e)})
    finally:
        conn.close()


@tool
def calculate_margin_metrics(company_id: str, period: str) -> str:
    """Calculate margin metrics for a company in a specific period using DuckDB.
    Returns gross_margin, ebitda_margin, operating_margin."""
    conn = _get_duckdb_conn()
    try:
        sql = f"""
        SELECT
            SUM(CASE WHEN "standardCategory" = 'Revenue' THEN amount ELSE 0 END) as revenue,
            SUM(CASE WHEN "standardCategory" = 'COGS' THEN amount ELSE 0 END) as cogs,
            SUM(CASE WHEN "standardCategory" = 'Operating Expense' THEN amount ELSE 0 END) as opex
        FROM pg.public.pl_statements
        WHERE "companyId" = '{company_id}' AND period = '{period}'
        """
        result = conn.execute(sql).fetchone()
        if result:
            revenue, cogs, opex = float(result[0]), float(result[1]), float(result[2])
            gross_profit = revenue + cogs  # cogs is negative
            ebitda = gross_profit + opex  # opex is negative
            return json.dumps({
                "revenue": revenue,
                "cogs": cogs,
                "gross_profit": gross_profit,
                "opex": opex,
                "ebitda": ebitda,
                "gross_margin": gross_profit / revenue if revenue else 0,
                "ebitda_margin": ebitda / revenue if revenue else 0,
                "operating_margin": (gross_profit + opex) / revenue if revenue else 0,
            })
        return json.dumps({"error": "No data found"})
    except Exception as e:
        return json.dumps({"error": str(e)})
    finally:
        conn.close()
