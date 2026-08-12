"use client";

import { use, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { trpc } from "../../../lib/trpc";
import {
  MetricCard,
  SeverityBadge,
  CompanyBadge,
  LoadingSpinner,
  PeriodSelector,
} from "../../../components/shared";
import { DollarSign, Users, MapPin, Calendar, TrendingUp } from "lucide-react";

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

// ── P&L Waterfall Chart ────────────────────────────
function PLWaterfallChart({ companyId }: { companyId: string }) {
  const { data: company } = trpc.companies.getById.useQuery({ id: companyId });

  if (!company) return null;

  const revenue = company.annualRevenue / 12;
  const grossMargin = company.marginProfile;
  const cogs = revenue * (1 - grossMargin);
  const grossProfit = revenue * grossMargin;
  const sga = revenue * 0.18;
  const rd = revenue * 0.08;
  const ga = revenue * 0.06;
  const ebitda = grossProfit - sga - rd - ga;

  const waterfallData = [
    { name: "Revenue", value: revenue, fill: "#3b82f6", type: "total" },
    { name: "COGS", value: -cogs, fill: "#ef4444", type: "expense" },
    { name: "Gross Profit", value: grossProfit, fill: "#3b82f6", type: "total" },
    { name: "S&M", value: -sga, fill: "#ef4444", type: "expense" },
    { name: "R&D", value: -rd, fill: "#ef4444", type: "expense" },
    { name: "G&A", value: -ga, fill: "#ef4444", type: "expense" },
    { name: "EBITDA", value: ebitda, fill: "#10b981", type: "total" },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold mb-4">P&L Waterfall — Revenue to EBITDA Bridge</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={waterfallData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v: number) => `$${(Math.abs(v) / 1_000_000).toFixed(1)}M`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [formatCurrency(Math.abs(value)), ""]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {waterfallData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Margin Decomposition Chart ─────────────────────
function MarginDecompositionChart({ companyId }: { companyId: string }) {
  const [period, setPeriod] = useState("36M");
  const { data: company } = trpc.companies.getById.useQuery({ id: companyId });

  if (!company) return null;

  const monthCount = period === "12M" ? 12 : period === "24M" ? 24 : 36;
  const chartData = Array.from({ length: monthCount }, (_, i) => ({
    period: new Date(2023, i, 1).toISOString().slice(0, 7),
    grossMargin: company.marginProfile + (Math.random() - 0.5) * 0.04,
    operatingMargin: company.marginProfile * 0.55 + (Math.random() - 0.5) * 0.03,
    ebitdaMargin: company.marginProfile * 0.4 + (Math.random() - 0.5) * 0.025,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Margin Decomposition</h3>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Area type="monotone" dataKey="grossMargin" name="Gross Margin" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} />
          <Area type="monotone" dataKey="operatingMargin" name="Operating Margin" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2} />
          <Area type="monotone" dataKey="ebitdaMargin" name="EBITDA Margin" stroke="#d4a853" fill="rgba(212, 168, 83, 0.1)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Cost Analysis Chart ────────────────────────────
function CostAnalysisChart({ companyId }: { companyId: string }) {
  const { data: company } = trpc.companies.getById.useQuery({ id: companyId });
  if (!company) return null;

  const chartData = Array.from({ length: 12 }, (_, i) => ({
    period: new Date(2025, i, 1).toLocaleDateString("en-US", { month: "short" }),
    cogs: (1 - company.marginProfile) * 100 + (Math.random() - 0.5) * 3,
    sgna: 18 + (Math.random() - 0.5) * 4,
    rd: (company.industry === "SaaS" ? 20 : 5) + (Math.random() - 0.5) * 3,
    ga: 8 + (Math.random() - 0.5) * 2,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold mb-4">Cost Structure (% of Revenue)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Bar dataKey="cogs" name="COGS" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="sgna" name="SG&A" stackId="a" fill="#f59e0b" />
          <Bar dataKey="rd" name="R&D" stackId="a" fill="#3b82f6" />
          <Bar dataKey="ga" name="G&A" stackId="a" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
          <ReferenceLine y={50} stroke="#ffffff" strokeDasharray="3 3" label={{ value: "Benchmark", position: "right", fill: "#94a3b8", fontSize: 10 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Company Insights Feed ──────────────────────────
function CompanyInsightsFeed({ companyId }: { companyId: string }) {
  const { data: rawInsights } = trpc.insights.getLatestByCompany.useQuery({
    companyId,
    limit: 10,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights = (rawInsights ?? []) as any[];
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold mb-4">Recent Insights</h3>
      {!insights?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No insights generated yet. Run the analysis pipeline to generate insights.
        </p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className="p-3 bg-background/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <SeverityBadge severity={insight.severity} />
                <span className="text-xs text-muted-foreground">{insight.agentName}</span>
              </div>
              <p className="text-sm font-medium">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{insight.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────
export default function CompanyDeepDive({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: company, isLoading } = trpc.companies.getById.useQuery({ id });

  if (isLoading) return <LoadingSpinner />;
  if (!company) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">Company not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Company Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CompanyBadge name={company.name} industry={company.industry} />
            <h1 className="text-2xl font-bold mt-2">{company.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {company.geography}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {company.employeeCount.toLocaleString()} employees
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Acq. {new Date(company.acquisitionDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <MetricCard label="Revenue" value={formatCurrency(company.annualRevenue)} trend="up" icon={<DollarSign className="w-4 h-4" />} />
            <MetricCard label="Gross Margin" value={`${(company.marginProfile * 100).toFixed(1)}%`} trend={company.marginProfile > 0.5 ? "up" : "stable"} icon={<TrendingUp className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PLWaterfallChart companyId={id} />
        <MarginDecompositionChart companyId={id} />
        <CostAnalysisChart companyId={id} />
        <CompanyInsightsFeed companyId={id} />
      </div>
    </div>
  );
}
