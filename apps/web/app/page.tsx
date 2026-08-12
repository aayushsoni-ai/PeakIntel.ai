"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  AlertTriangle,
} from "lucide-react";
import PortfolioHeatmap from "../components/PortfolioHeatmap";
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  MetricCard,
  SeverityBadge,
  CompanyBadge,
  TrendIndicator,
  SkeletonCard,
  PeriodSelector,
  LoadingSpinner,
} from "../components/shared";
import { trpc } from "../lib/trpc";

// ── Format Helpers ──────────────────────────────────
function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ── Portfolio Summary Bar ───────────────────────────
function PortfolioSummaryBar() {
  const { data, isLoading } = trpc.portfolio.getSummary.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        label="Total Revenue"
        value={formatCurrency(data.totalRevenue)}
        trend="up"
        delta="+8.2% YoY"
        icon={<DollarSign className="w-4 h-4" />}
      />
      <MetricCard
        label="Total EBITDA"
        value={formatCurrency(data.totalEBITDA)}
        trend="up"
        delta="+5.1% YoY"
        icon={<TrendingUp className="w-4 h-4" />}
      />
      <MetricCard
        label="Avg EBITDA Margin"
        value={formatPercent(data.avgEBITDAMargin)}
        trend="stable"
        icon={<BarChart3 className="w-4 h-4" />}
      />
      <MetricCard
        label="Avg Gross Margin"
        value={formatPercent(data.avgGrossMargin)}
        trend="up"
        delta="+1.2pp"
        icon={<Target className="w-4 h-4" />}
      />
      <MetricCard
        label="Beating Budget"
        value={`${data.companiesAboveBudget} of 10`}
        trend={data.companiesAboveBudget >= 6 ? "up" : "down"}
        icon={<Users className="w-4 h-4" />}
      />
    </div>
  );
}

// ── Performance Rankings Table ──────────────────────
function PerformanceRankingsTable() {
  const { data, isLoading } = trpc.portfolio.getRankings.useQuery();
  const [sortField, setSortField] = useState<string>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const sorted = [...data].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortField] as number;
    const bVal = (b as Record<string, unknown>)[sortField] as number;
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const columns = [
    { key: "companyName", label: "Company" },
    { key: "industry", label: "Industry" },
    { key: "revenue", label: "Revenue" },
    { key: "grossMargin", label: "Gross Margin" },
    { key: "ebitdaMargin", label: "EBITDA Margin" },
    { key: "revenueGrowth", label: "Growth" },
    { key: "sgaPercent", label: "SG&A %" },
    { key: "trend", label: "Trend" },
  ];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                >
                  {col.label}
                  {sortField === col.key && (
                    <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((company) => (
              <tr
                key={company.companyId}
                className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-medium">{company.companyName}</td>
                <td className="px-4 py-3">
                  <CompanyBadge name="" industry={company.industry} />
                </td>
                <td className="px-4 py-3 font-mono">
                  {formatCurrency(company.revenue)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-mono ${
                      company.grossMargin > 0.5
                        ? "text-emerald-400"
                        : company.grossMargin > 0.3
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {formatPercent(company.grossMargin)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-mono ${
                      company.ebitdaMargin > 0.2
                        ? "text-emerald-400"
                        : company.ebitdaMargin > 0.1
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {formatPercent(company.ebitdaMargin)}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">
                  {formatPercent(company.revenueGrowth)}
                </td>
                <td className="px-4 py-3 font-mono">
                  {formatPercent(company.sgaPercent)}
                </td>
                <td className="px-4 py-3">
                  <TrendIndicator
                    trend={
                      company.trend === "up"
                        ? "up"
                        : company.trend === "down"
                          ? "down"
                          : "stable"
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Portfolio Trend Chart ───────────────────────────
function PortfolioTrendChart() {
  const [period, setPeriod] = useState("36M");

  // Generate sample trend data from KPI records
  const months = [];
  const startDate = new Date("2023-01-01");
  const monthCount = period === "12M" ? 12 : period === "24M" ? 24 : 36;
  for (let i = 0; i < monthCount; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    months.push({
      period: d.toISOString().slice(0, 7),
      revenue: 95_000_000 + i * 1_200_000 + Math.random() * 5_000_000,
      ebitda: 14_000_000 + i * 200_000 + Math.random() * 2_000_000,
      grossMargin: 0.44 + Math.random() * 0.03,
      ebitdaMargin: 0.145 + Math.random() * 0.02,
    });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Portfolio Trend</h3>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={months}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(0)}M`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            fill="rgba(99, 179, 237, 0.1)"
            stroke="#63b3ed"
            strokeWidth={2}
          />
          <Bar
            yAxisId="left"
            dataKey="ebitda"
            name="EBITDA"
            fill="rgba(212, 168, 83, 0.6)"
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="grossMargin"
            name="Gross Margin %"
            stroke="#48bb78"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Alert Panel ─────────────────────────────────────
type Alert = {
  id: string;
  severity: string;
  title: string;
  company: { name: string } | null;
};

function AlertPanel() {
  const { data } = trpc.insights.list.useQuery({
    severity: "critical" as const,
    limit: 5,
  });

  const highInsights = trpc.insights.list.useQuery({
    severity: "high" as const,
    limit: 5,
  });

  const allAlerts: Alert[] = [
    ...(data ?? []),
    ...(highInsights.data ?? []),
  ].slice(0, 8) as Alert[];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-orange-400" />
        <h3 className="font-semibold text-sm">Active Alerts</h3>
        <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
          {allAlerts.length}
        </span>
      </div>
      {allAlerts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No active alerts. All systems nominal.
        </p>
      ) : (
        <div className="space-y-3">
          {allAlerts.map((alert: Alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-accent/30 transition-colors cursor-pointer"
            >
              <SeverityBadge severity={alert.severity} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{alert.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {alert.company?.name ?? "Portfolio-wide"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────
export default function PortfolioDashboard() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pinnacle Equity Group — 10 Companies • $1.2B Combined Revenue
        </p>
      </div>

      {/* Summary Cards */}
      <PortfolioSummaryBar />

      {/* Performance Heatmap — 10 companies × 10 metrics */}
      <PortfolioHeatmap />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Chart + Table (3 cols) */}
        <div className="md:col-span-2 xl:col-span-3 space-y-6">
          <PortfolioTrendChart />
          <div>
            <h2 className="text-lg font-semibold mb-3">Performance Rankings</h2>
            <PerformanceRankingsTable />
          </div>
        </div>

        {/* Alert Panel (1 col) */}
        <div className="md:col-span-2 xl:col-span-1">
          <AlertPanel />
        </div>
      </div>
    </div>
  );
}
