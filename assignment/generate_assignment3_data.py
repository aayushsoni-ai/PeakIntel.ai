#!/usr/bin/env python3
"""
Sample Data Generator for Assignment 3: P&L Analysis
Run: python generate_assignment3_data.py --output ./assignment3_data
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import argparse
import json

np.random.seed(42)

COMPANIES = [
    {'id': 'alphatech_saas', 'name': 'AlphaTech SaaS', 'revenue': 52_000_000, 'margin': 0.65, 'industry': 'SaaS'},
    {'id': 'betamfg_inc', 'name': 'BetaMfg Inc', 'revenue': 180_000_000, 'margin': 0.35, 'industry': 'Manufacturing'},
    {'id': 'gammacare_health', 'name': 'GammaCare Health', 'revenue': 45_000_000, 'margin': 0.55, 'industry': 'Healthcare'},
    {'id': 'deltaretail_co', 'name': 'DeltaRetail Co', 'revenue': 220_000_000, 'margin': 0.28, 'industry': 'Retail'},
    {'id': 'epsilon_logistics', 'name': 'EpsilonLogistics', 'revenue': 95_000_000, 'margin': 0.18, 'industry': 'Logistics'},
    {'id': 'zetasoftware', 'name': 'ZetaSoftware', 'revenue': 38_000_000, 'margin': 0.78, 'industry': 'SaaS'},
    {'id': 'etaindustrial', 'name': 'EtaIndustrial', 'revenue': 160_000_000, 'margin': 0.42, 'industry': 'Manufacturing'},
    {'id': 'thetaconsulting', 'name': 'ThetaConsulting', 'revenue': 32_000_000, 'margin': 0.68, 'industry': 'Services'},
    {'id': 'iotadistribution', 'name': 'IotaDistribution', 'revenue': 280_000_000, 'margin': 0.22, 'industry': 'Distribution'},
    {'id': 'kappamedia', 'name': 'KappaMedia', 'revenue': 68_000_000, 'margin': 0.48, 'industry': 'Media'}
]

def _ensure_min_accounts(revenue_accounts, cogs_accounts, opex_accounts, min_total=40):
    """
    Ensure we have at least `min_total` accounts across all categories by
    cloning patterns into additional 'Other' accounts. This guarantees
    high row counts per company while keeping structure realistic.
    """
    all_lists = [revenue_accounts, cogs_accounts, opex_accounts]
    while sum(len(lst) for lst in all_lists) < min_total:
        # Always pad operating expenses first (they're naturally more granular),
        # then COGS, then Revenue.
        if len(opex_accounts) <= len(cogs_accounts) and len(opex_accounts) <= len(revenue_accounts):
            base_list = opex_accounts
        elif len(cogs_accounts) <= len(revenue_accounts):
            base_list = cogs_accounts
        else:
            base_list = revenue_accounts

        template = base_list[-1]
        new_code = template[0] + 10
        new_name = f"{template[1]} - Other"
        new_weight = template[4] * 0.5
        base_list.append((new_code, new_name, template[2], template[3], new_weight))

    return revenue_accounts, cogs_accounts, opex_accounts


def _get_industry_account_structure(industry: str):
    """
    Return a rich set of GL accounts for the given industry.
    Each entry: (account_code, account_name, standard_category, standard_subcategory, weight)
    We intentionally vary codes and names by industry to require normalization.
    """
    if industry == "SaaS":
        revenue_accounts = [
            (4100, "Subscription Revenue - SMB", "Revenue", "Recurring Revenue", 0.22),
            (4110, "Subscription Revenue - Mid-Market", "Revenue", "Recurring Revenue", 0.28),
            (4120, "Subscription Revenue - Enterprise", "Revenue", "Recurring Revenue", 0.24),
            (4130, "Implementation Services", "Revenue", "Services Revenue", 0.08),
            (4140, "Training & Certification", "Revenue", "Services Revenue", 0.05),
            (4150, "Professional Services - Time & Materials", "Revenue", "Services Revenue", 0.05),
            (4160, "Marketplace Revenue", "Revenue", "Other Revenue", 0.04),
            (4170, "Usage-based Overage Revenue", "Revenue", "Usage Revenue", 0.04)
        ]
        cogs_accounts = [
            (5100, "Cloud Infrastructure", "COGS", "Infrastructure", 0.35),
            (5110, "Customer Support Payroll", "COGS", "Support", 0.28),
            (5120, "Third-Party Support Tools", "COGS", "Support", 0.07),
            (5130, "Payment Processing Fees", "COGS", "Transaction Fees", 0.09),
            (5140, "Customer Onboarding Services", "COGS", "Services Delivery", 0.12),
            (5150, "Implementation Contractors", "COGS", "Services Delivery", 0.09)
        ]
        opex_accounts = [
            # Sales & Marketing
            (6100, "Sales Salaries", "Operating Expense", "Sales & Marketing", 0.10),
            (6110, "Sales Commissions", "Operating Expense", "Sales & Marketing", 0.07),
            (6120, "Marketing Programs", "Operating Expense", "Sales & Marketing", 0.06),
            (6130, "Digital Advertising", "Operating Expense", "Sales & Marketing", 0.05),
            (6140, "Partner Marketing Funds", "Operating Expense", "Sales & Marketing", 0.03),
            # R&D
            (6200, "Engineering Salaries", "Operating Expense", "R&D", 0.13),
            (6210, "Product Management", "Operating Expense", "R&D", 0.04),
            (6220, "QA & Testing", "Operating Expense", "R&D", 0.03),
            (6230, "Developer Tools & Licenses", "Operating Expense", "R&D", 0.02),
            # G&A
            (6300, "General & Administrative Salaries", "Operating Expense", "G&A", 0.09),
            (6310, "Rent & Facilities", "Operating Expense", "G&A", 0.05),
            (6320, "IT & Corporate Systems", "Operating Expense", "G&A", 0.04),
            (6330, "Professional Fees", "Operating Expense", "G&A", 0.03),
            (6340, "Travel & Entertainment", "Operating Expense", "G&A", 0.02),
            (6350, "Recruiting & HR", "Operating Expense", "G&A", 0.04),
        ]
    elif industry in ("Manufacturing", "Distribution"):
        revenue_accounts = [
            (4000, "Product Sales - Domestic", "Revenue", "Product Revenue", 0.45),
            (4010, "Product Sales - International", "Revenue", "Product Revenue", 0.30),
            (4020, "Service & Maintenance", "Revenue", "Service Revenue", 0.15),
            (4030, "Spare Parts", "Revenue", "Product Revenue", 0.10),
        ]
        cogs_accounts = [
            (5000, "Direct Materials", "COGS", "Materials", 0.40),
            (5010, "Direct Labor", "COGS", "Labor", 0.25),
            (5020, "Manufacturing Overhead", "COGS", "Overhead", 0.15),
            (5030, "Inbound Freight", "COGS", "Logistics", 0.06),
            (5040, "Packaging Supplies", "COGS", "Supplies", 0.05),
            (5050, "Warranty Costs", "COGS", "Warranty", 0.05),
            (5060, "Inventory Adjustments", "COGS", "Adjustments", 0.04),
        ]
        opex_accounts = [
            (6100, "Sales & Marketing", "Operating Expense", "Sales & Marketing", 0.18),
            (6200, "R&D", "Operating Expense", "R&D", 0.05),
            (6300, "G&A Salaries", "Operating Expense", "G&A", 0.15),
            (6310, "Rent & Utilities", "Operating Expense", "G&A", 0.08),
            (6320, "Corporate Insurance", "Operating Expense", "G&A", 0.06),
            (6330, "Logistics & Distribution", "Operating Expense", "Operations", 0.10),
            (6340, "IT & Systems", "Operating Expense", "G&A", 0.05),
            (6350, "Travel & Entertainment", "Operating Expense", "G&A", 0.05),
            (6360, "Depreciation & Amortization", "Operating Expense", "Non-cash", 0.08),
        ]
    elif industry in ("Retail", "Media", "Logistics"):
        revenue_accounts = [
            (4200, "Store Sales", "Revenue", "Product Revenue", 0.40),
            (4210, "E-commerce Sales", "Revenue", "Product Revenue", 0.35),
            (4220, "Advertising Revenue", "Revenue", "Other Revenue", 0.10),
            (4230, "Subscription & Membership", "Revenue", "Recurring Revenue", 0.10),
            (4240, "Other Operating Revenue", "Revenue", "Other Revenue", 0.05),
        ]
        cogs_accounts = [
            (5200, "Merchandise Purchases", "COGS", "Materials", 0.55),
            (5210, "Freight & Duties", "COGS", "Logistics", 0.10),
            (5220, "Store Labor", "COGS", "Labor", 0.20),
            (5230, "Warehouse Labor", "COGS", "Labor", 0.10),
            (5240, "Inventory Shrink", "COGS", "Adjustments", 0.05),
        ]
        opex_accounts = [
            (6100, "Marketing & Promotions", "Operating Expense", "Sales & Marketing", 0.16),
            (6110, "Advertising", "Operating Expense", "Sales & Marketing", 0.10),
            (6200, "Store Rent & Occupancy", "Operating Expense", "G&A", 0.14),
            (6210, "Corporate Salaries", "Operating Expense", "G&A", 0.14),
            (6220, "Logistics Admin", "Operating Expense", "Operations", 0.10),
            (6230, "IT & Digital", "Operating Expense", "G&A", 0.10),
            (6240, "Bank & Card Fees", "Operating Expense", "G&A", 0.06),
            (6250, "Other G&A", "Operating Expense", "G&A", 0.10),
        ]
    else:  # Services, Healthcare, default
        revenue_accounts = [
            (4300, "Professional Services Fees", "Revenue", "Services Revenue", 0.55),
            (4310, "Retainer Revenue", "Revenue", "Recurring Revenue", 0.25),
            (4320, "Success Fees", "Revenue", "Other Revenue", 0.10),
            (4330, "Other Service Revenue", "Revenue", "Services Revenue", 0.10),
        ]
        cogs_accounts = [
            (5400, "Billable Staff Salaries", "COGS", "Labor", 0.60),
            (5410, "Billable Contractors", "COGS", "Labor", 0.20),
            (5420, "Project Travel", "COGS", "Travel", 0.10),
            (5430, "Other Project Costs", "COGS", "Other", 0.10),
        ]
        opex_accounts = [
            (6100, "Sales & Marketing", "Operating Expense", "Sales & Marketing", 0.18),
            (6200, "Non-billable Staff Salaries", "Operating Expense", "G&A", 0.20),
            (6210, "Office Rent", "Operating Expense", "G&A", 0.10),
            (6220, "IT & Software", "Operating Expense", "G&A", 0.12),
            (6230, "Professional Fees", "Operating Expense", "G&A", 0.12),
            (6240, "Travel & Entertainment", "Operating Expense", "G&A", 0.10),
            (6250, "Other G&A", "Operating Expense", "G&A", 0.18),
        ]

    return _ensure_min_accounts(revenue_accounts, cogs_accounts, opex_accounts, min_total=40)


def _allocate_to_accounts(total_amount, accounts):
    """Allocate a category total to individual accounts using weights and some randomness, preserving the total."""
    weights = np.array([a[4] for a in accounts], dtype=float)
    # Add small noise to avoid perfectly fixed proportions
    noise = np.random.normal(loc=1.0, scale=0.05, size=len(weights))
    noisy_weights = np.clip(weights * noise, 0.001, None)
    noisy_weights = noisy_weights / noisy_weights.sum()
    allocated = noisy_weights * total_amount
    return allocated


def generate_pl_statements(
    companies,
    periods=36,
    misclass_pct: float = 0.04,
    spike_prob: float = 0.03,
):
    """
    Generate detailed P&L with different account structures per company.
    Ensures > 1000 rows per company by using many GL accounts across 36 months.
    """
    records = []
    start_date = datetime(2023, 1, 1)

    for company in companies:
        rev_accounts, cogs_accounts, opex_accounts = _get_industry_account_structure(
            company["industry"]
        )
        months = pd.date_range(start_date, periods=periods, freq="MS")

        # Base monthly revenue and modest growth over time
        base_monthly_rev = company["revenue"] / 12
        growth_rate = 0.10 if company["industry"] in ["SaaS", "Technology", "Media"] else 0.04

        for i, date in enumerate(months):
            # Apply growth and mild seasonality
            trend_factor = (1 + growth_rate) ** (i / 12)
            seasonality = 1.0
            if company["industry"] in ["Retail", "Logistics"]:
                # Q4 stronger
                if date.month in (10, 11, 12):
                    seasonality = 1.15
                elif date.month in (1, 2):
                    seasonality = 0.92
            elif company["industry"] == "SaaS":
                if date.month in (11, 12):
                    seasonality = 1.05

            total_revenue = (
                base_monthly_rev
                * trend_factor
                * seasonality
                * np.random.uniform(0.95, 1.05)
            )
            target_margin = company["margin"]
            total_cogs = (
                total_revenue
                * (1 - target_margin)
                * np.random.uniform(0.97, 1.03)
            )

            # Operating expenses as a % of revenue by rough industry norms
            if company["industry"] in ["SaaS", "Technology", "Media"]:
                opex_pct = np.random.uniform(0.38, 0.55)
            elif company["industry"] in ["Manufacturing", "Distribution", "Logistics"]:
                opex_pct = np.random.uniform(0.22, 0.32)
            else:
                opex_pct = np.random.uniform(0.30, 0.42)
            total_opex = total_revenue * opex_pct

            # Occasionally create "spike" / "dip" months to make trends less clean
            if np.random.rand() < spike_prob:
                shock = np.random.choice(
                    [0.7, 0.75, 1.25, 1.35], p=[0.25, 0.25, 0.25, 0.25]
                )
                total_revenue *= shock
                total_cogs *= shock * np.random.uniform(0.95, 1.05)
                total_opex *= shock * np.random.uniform(0.95, 1.05)

            # Allocate to individual GL accounts
            rev_alloc = _allocate_to_accounts(total_revenue, rev_accounts)
            cogs_alloc = _allocate_to_accounts(total_cogs, cogs_accounts)
            opex_alloc = _allocate_to_accounts(total_opex, opex_accounts)

            period_str = date.strftime("%Y-%m")

            # Build row objects so we can mutate for anomalies
            month_rows = []

            for (acct, amt) in zip(rev_accounts, rev_alloc):
                month_rows.append(
                    {
                        "company": company["id"],
                        "period": period_str,
                        "account_code": acct[0],
                        "account_name": acct[1],
                        "category": acct[2],
                        "amount": float(amt),
                    }
                )

            for (acct, amt) in zip(cogs_accounts, cogs_alloc):
                month_rows.append(
                    {
                        "company": company["id"],
                        "period": period_str,
                        "account_code": acct[0],
                        "account_name": acct[1],
                        "category": acct[2],
                        "amount": -float(amt),
                    }
                )

            for (acct, amt) in zip(opex_accounts, opex_alloc):
                month_rows.append(
                    {
                        "company": company["id"],
                        "period": period_str,
                        "account_code": acct[0],
                        "account_name": acct[1],
                        "category": acct[2],
                        "amount": -float(amt),
                    }
                )

            # Intentional anomalies:
            # 1) Misclassified expenses: move some opex rows into COGS category
            if np.random.rand() < misclass_pct:
                opex_indices = [
                    idx
                    for idx, r in enumerate(month_rows)
                    if r["category"] == "Operating Expense"
                ]
                if opex_indices:
                    idx = int(np.random.choice(opex_indices))
                    month_rows[idx]["category"] = "COGS"

            # 2) Some COGS lines that really behave like opex
            if np.random.rand() < misclass_pct:
                cogs_indices = [
                    idx for idx, r in enumerate(month_rows) if r["category"] == "COGS"
                ]
                if cogs_indices:
                    idx = int(np.random.choice(cogs_indices))
                    month_rows[idx]["category"] = "Operating Expense"

            # 3) Tiny negative revenue or positive COGS lines (returns/true-ups)
            if np.random.rand() < misclass_pct / 2:
                rev_indices = [
                    idx for idx, r in enumerate(month_rows) if r["category"] == "Revenue"
                ]
                cogs_indices = [
                    idx for idx, r in enumerate(month_rows) if r["category"] == "COGS"
                ]
                if rev_indices and cogs_indices:
                    r_idx = int(np.random.choice(rev_indices))
                    c_idx = int(np.random.choice(cogs_indices))
                    adj = abs(month_rows[r_idx]["amount"]) * np.random.uniform(0.01, 0.03)
                    month_rows[r_idx]["amount"] -= adj  # small negative adjustment
                    month_rows[c_idx]["amount"] += adj  # slightly less negative COGS

            records.extend(month_rows)

    df = pd.DataFrame(records)

    # Sanity check: ensure at least 1000 rows per company
    counts = df.groupby("company")["period"].count()
    assert (counts >= 1000).all(), f"Expected at least 1000 rows per company, got {counts.to_dict()}"

    return df


def generate_account_mappings(companies):
    """Generate account mapping table as per spec."""
    rows = []
    for company in companies:
        rev_accounts, cogs_accounts, opex_accounts = _get_industry_account_structure(company["industry"])
        for acct in rev_accounts + cogs_accounts + opex_accounts:
            rows.append(
                {
                    "company": company["id"],
                    "original_account_code": acct[0],
                    "original_account_name": acct[1],
                    "standard_category": acct[2],
                    "standard_subcategory": acct[3],
                }
            )
    return pd.DataFrame(rows).drop_duplicates()


def generate_industry_benchmarks():
    """Static industry benchmark table aligned with the specification."""
    data = [
        {"industry": "SaaS", "metric": "gross_margin", "p10": 0.65, "p25": 0.70, "median": 0.75, "p75": 0.80, "p90": 0.85},
        {"industry": "SaaS", "metric": "sgna_pct_revenue", "p10": 0.50, "p25": 0.55, "median": 0.60, "p75": 0.65, "p90": 0.70},
        {"industry": "SaaS", "metric": "rd_pct_revenue", "p10": 0.15, "p25": 0.20, "median": 0.25, "p75": 0.30, "p90": 0.35},
        {"industry": "SaaS", "metric": "ebitda_margin", "p10": -0.05, "p25": 0.05, "median": 0.15, "p75": 0.25, "p90": 0.35},
        {"industry": "Manufacturing", "metric": "gross_margin", "p10": 0.25, "p25": 0.30, "median": 0.35, "p75": 0.40, "p90": 0.45},
        {"industry": "Retail", "metric": "gross_margin", "p10": 0.20, "p25": 0.25, "median": 0.30, "p75": 0.35, "p90": 0.40},
        {"industry": "Logistics", "metric": "ebitda_margin", "p10": 0.05, "p25": 0.08, "median": 0.12, "p75": 0.16, "p90": 0.20},
        {"industry": "Healthcare", "metric": "gross_margin", "p10": 0.45, "p25": 0.50, "median": 0.55, "p75": 0.60, "p90": 0.65},
        {"industry": "Services", "metric": "ebitda_margin", "p10": 0.10, "p25": 0.15, "median": 0.22, "p75": 0.28, "p90": 0.35},
    ]
    return pd.DataFrame(data)


def generate_kpi_data(pl_df: pd.DataFrame):
    """
    Aggregate P&L into KPI-style metrics similar to Assignment 2 structure.
    company,period,kpi_name,value,target
    """
    rows = []
    grouped = pl_df.groupby(["company", "period", "category"])["amount"].sum().unstack(fill_value=0)
    for (company, period), vals in grouped.iterrows():
        revenue = vals.get("Revenue", 0.0)
        cogs = vals.get("COGS", 0.0)
        opex = vals.get("Operating Expense", 0.0)
        gross_profit = revenue + cogs  # cogs is negative
        ebitda = gross_profit + opex   # opex is negative

        gross_margin = gross_profit / revenue if revenue else 0.0
        ebitda_margin = ebitda / revenue if revenue else 0.0
        sgna_pct_rev = -opex / revenue if revenue else 0.0

        metrics = {
            "revenue": revenue,
            "gross_margin": gross_margin,
            "ebitda_margin": ebitda_margin,
            "sgna_pct_revenue": sgna_pct_rev,
        }

        for kpi_name, value in metrics.items():
            target = value  # simple target equal to actual; can be adjusted if needed
            rows.append(
                {
                    "company": company,
                    "period": period,
                    "kpi_name": kpi_name,
                    "value": float(value),
                    "target": float(target),
                }
            )

    return pd.DataFrame(rows)


def generate_peer_comps():
    """Peer comparables table from the specification example plus a few extras."""
    data = [
        {
            "company_name": "Salesforce",
            "ticker": "CRM",
            "industry": "SaaS",
            "revenue": 31_352_000_000,
            "gross_margin": 0.76,
            "ebitda_margin": 0.31,
            "revenue_growth": 0.11,
        },
        {
            "company_name": "ServiceNow",
            "ticker": "NOW",
            "industry": "SaaS",
            "revenue": 7_243_000_000,
            "gross_margin": 0.79,
            "ebitda_margin": 0.26,
            "revenue_growth": 0.26,
        },
        {
            "company_name": "Workday",
            "ticker": "WDAY",
            "industry": "SaaS",
            "revenue": 5_139_000_000,
            "gross_margin": 0.73,
            "ebitda_margin": 0.19,
            "revenue_growth": 0.17,
        },
        {
            "company_name": "Generic Manufacturing Peer",
            "ticker": "MFGP",
            "industry": "Manufacturing",
            "revenue": 2_500_000_000,
            "gross_margin": 0.32,
            "ebitda_margin": 0.18,
            "revenue_growth": 0.08,
        },
        {
            "company_name": "Generic Retail Peer",
            "ticker": "RTLX",
            "industry": "Retail",
            "revenue": 4_200_000_000,
            "gross_margin": 0.29,
            "ebitda_margin": 0.10,
            "revenue_growth": 0.06,
        },
    ]
    return pd.DataFrame(data)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='./assignment3_data')
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    pl_dir = output_dir / "pl_statements"
    mappings_dir = output_dir / "account_mappings"
    bench_dir = output_dir / "industry_benchmarks"
    meta_dir = output_dir / "company_metadata"
    kpi_dir = output_dir / "kpi_data"
    peers_dir = output_dir / "peer_comps"

    for d in [pl_dir, mappings_dir, bench_dir, meta_dir, kpi_dir, peers_dir]:
        d.mkdir(parents=True, exist_ok=True)

    print("Generating Assignment 3 data...")

    # 1. Detailed P&L statements
    pl = generate_pl_statements(COMPANIES)
    pl.to_csv(pl_dir / "pl_statements.csv", index=False)
    print(f"P&L statements: {len(pl)} records "
          f"(avg {len(pl) / len(COMPANIES):.0f} per company)")

    # 2. Account mappings
    mappings = generate_account_mappings(COMPANIES)
    mappings.to_csv(mappings_dir / "account_mappings.csv", index=False)
    print(f"Account mappings: {len(mappings)} rows")

    # 3. Industry benchmarks
    benchmarks = generate_industry_benchmarks()
    benchmarks.to_csv(bench_dir / "industry_benchmarks.csv", index=False)
    print(f"Industry benchmarks: {len(benchmarks)} rows")

    # 4. Company metadata (one JSON file per company, as examples in spec)
    for company in COMPANIES:
        metadata = {
            "company_id": company["id"],
            "company_name": company["name"],
            "industry": company["industry"],
            "sector": "Technology" if company["industry"] in ["SaaS", "Media"] else company["industry"],
            "entry_revenue": company["revenue"] * 0.7,
            "current_revenue": company["revenue"],
            "margin_profile": company["margin"],
        }
        with open(meta_dir / f"{company['id']}.json", "w") as f:
            json.dump(metadata, f, indent=2)
    print(f"Company metadata: {len(COMPANIES)} JSON files")

    # 5. KPI data
    kpi = generate_kpi_data(pl)
    kpi.to_csv(kpi_dir / "kpi_data.csv", index=False)
    print(f"KPI data: {len(kpi)} rows")

    # 6. Peer comparables
    peers = generate_peer_comps()
    peers.to_csv(peers_dir / "peer_comps.csv", index=False)
    print(f"Peer comps: {len(peers)} rows")

    # Top-level README
    with open(output_dir / "README.md", "w") as f:
        f.write(
            f"""# Assignment 3 Sample Data
Generated: {datetime.now().isoformat()}

## Files & Folders
- pl_statements/pl_statements.csv: 36 months detailed GL-level P&L for 10 companies
- account_mappings/account_mappings.csv: Company-specific GL to standard category mappings
- industry_benchmarks/industry_benchmarks.csv: Benchmark margins and ratios by industry
- company_metadata/*.json: Company profile metadata
- kpi_data/kpi_data.csv: KPI-style aggregates derived from P&L
- peer_comps/peer_comps.csv: Public peer comparables

Each company has more than 1000 P&L rows, with 36 months of data and
dozens of GL accounts per company, matching the volume and richness
described in the dataset specifications.
"""
        )

    print(f"Complete. Data written to {output_dir}")

if __name__ == '__main__':
    main()
