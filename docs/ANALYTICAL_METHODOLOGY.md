# Analytical Methodology

Pinnacle AI is fundamentally a financial analytics engine governed by rigorous statistical modeling and standardized definitions. This document outlines the primary analytical methodologies implemented by the Python Agents.

## 1. P&L Normalization
Raw General Ledger (GL) accounts exhibit broad inconsistency across portfolio companies (e.g., "Hosting Fees AWS" vs "Cloud Expenses"). 
- **Methodology**: LLM-aided mapping using Anthropic's Claude. The agent references historical mappings and uses deductive reasoning from context to map unclassified accounts into `Revenue`, `COGS`, `S&M`, `R&D`, or `G&A`.
- **Validation Check**: $\sum \text{Revenue} - \sum \text{COGS} \equiv \text{Gross Profit}$

## 2. In-Process OLAP via DuckDB
We avoid heavy, decoupled data warehouses by embedding DuckDB within the FastAPI agent worker. 
- **Mechanism**: Agents query the Postgres database dynamically. DuckDB attaches to Postgres via the Postgres scanner extension, allowing vectorized OLAP queries directly into memory. 
- **Advantage**: Massively speeds up metric calculation (Gross Margin, EBITDA, Operating Leverage) preventing database context switching.

## 3. Trend Detection (Linear Regression)
Instead of relying on an LLM to "guess" trends, we utilize `numpy.polyfit`.
- **Calculation**: Trailing 12-to-36 month linear regression ($y = mx + b$). 
- **Classification Boundaries**:
  - $m > +0.005$ : `Improving`
  - $m < -0.005$ : `Declining`
  - Otherwise : `Stable`
- Provides the $R^2$ value to indicate the confidence/variance of the trend.

## 4. Anomaly Detection
The `AnomalyDetectionAgent` utilizes twin statistical checks to flag one-time P&L events without human intervention.
1. **Z-Scores**: Measures standard deviations from the mean.
   - Anomaly flagged when $|Z| > 2.5$
2. **Interquartile Range (IQR)**: More robust to extreme outlier skew.
   - Computes $Q1$ and $Q3$. 
   - Anomaly flagged outside bounds: $[Q1 - 2.5 \times \text{IQR}, Q3 + 2.5 \times \text{IQR}]$

## 5. Peer Benchmarking
- **Internal Rank-Ordering**: Evaluates a company's relative performance amongst the internal 10-company portfolio.
- **External Benchmarking**: Calculates gap-to-top-quartile utilizing hardcoded generic industry percentiles ($P_{25}, P_{50}, P_{75}, P_{90}$).
