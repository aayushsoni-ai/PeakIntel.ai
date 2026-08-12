"use client";

  // useState removed as it was unused
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { trpc } from "../../lib/trpc";
import { LoadingSpinner, CompanyBadge } from "../../components/shared";

// Define the shape that portfolio.getRankings returns.
// This should match the Zod output schema in your tRPC router exactly.
// Adjust field names/types if your router schema differs.
type CompanyRanking = {
  companyId: string;
  companyName: string;
  industry: string;
  revenue: number;
  grossMargin: number;
  ebitdaMargin: number;
  revenueGrowth: number;
  costEfficiency: number;
  trend: "up" | "stable" | "down";
};

export default function BenchmarksPage() {
  const { data: rawRankings, isLoading } = trpc.portfolio.getRankings.useQuery();
  // const { data: benchmarks } = trpc.benchmarks.getPortfolioVsIndustry.useQuery();
  // const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Cast through unknown — tRPC serialises the `trend` enum as a plain string,
  // but our local CompanyRanking type expects the literal union.
  const rankings: CompanyRanking[] = (rawRankings ?? []) as unknown as CompanyRanking[];

  if (isLoading) return <LoadingSpinner />;

  const radarMetrics = [
    "Revenue Growth",
    "Gross Margin",
    "EBITDA Margin",
    "Cost Efficiency",
    "Revenue Quality",
    "Trend Score",
  ];

  // Now `company` is explicitly typed as CompanyRanking, satisfying strict mode
  const radarData = radarMetrics.map((metric) => {
    const entry: Record<string, string | number> = { metric };

    (rankings ?? []).forEach((company: CompanyRanking) => {
      const values: Record<string, number> = {
        "Revenue Growth": company.revenueGrowth * 100,
        "Gross Margin": company.grossMargin * 100,
        "EBITDA Margin": company.ebitdaMargin * 100,
        "Cost Efficiency": company.costEfficiency * 100,
        "Revenue Quality": company.grossMargin * 80,
        "Trend Score":
          company.trend === "up" ? 80 : company.trend === "stable" ? 50 : 20,
      };
      entry[company.companyName] = values[metric] ?? 50;
    });

    return entry;
  });

  // `company` typed here too — no more implicit any
  const gapData = (rankings ?? []).map((company: CompanyRanking) => ({
    name: company.companyName.split(" ")[0] ?? company.companyName,
    gap: Math.max(0, 0.75 - company.grossMargin) * company.revenue,
    grossMargin: company.grossMargin * 100,
  }));

  const colors = ["#3b82f6", "#10b981", "#d4a853", "#8b5cf6", "#f59e0b"];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Benchmarking</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-company and industry peer comparison analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">
            Percentile Rankings — Top 3 Companies
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <PolarRadiusAxis
                tick={{ fontSize: 9, fill: "#94a3b8" }}
                domain={[0, 100]}
              />
              {/* `company` and `i` are both explicitly typed here */}
              {(rankings ?? [])
                .slice(0, 3)
                .map((company: CompanyRanking, i: number) => (
                  <Radar
                    key={company.companyId}
                    name={company.companyName}
                    dataKey={company.companyName}
                    stroke={colors[i]}
                    fill={colors[i]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap Analysis */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">
            Gap to Top Quartile (Gross Margin)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={gapData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(v: number) =>
                  `$${(v / 1_000_000).toFixed(0)}M`
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [
                  `$${(value / 1_000_000).toFixed(1)}M`,
                  "Gap Value",
                ]}
              />
              <Bar dataKey="gap" fill="#d4a853" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peer Matrix */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4">Portfolio Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Company
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Gross Margin
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  EBITDA Margin
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Revenue Growth
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Cost Efficiency
                </th>
              </tr>
            </thead>
            <tbody>
              {/* `r` is now explicitly CompanyRanking */}
              {(rankings ?? []).map((r: CompanyRanking) => (
                <tr
                  key={r.companyId}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <CompanyBadge name={r.companyName} industry={r.industry} />
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${r.grossMargin > 0.6
                      ? "text-emerald-400"
                      : r.grossMargin > 0.35
                        ? "text-yellow-400"
                        : "text-red-400"
                      }`}
                  >
                    {(r.grossMargin * 100).toFixed(1)}%
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${r.ebitdaMargin > 0.2
                      ? "text-emerald-400"
                      : r.ebitdaMargin > 0.1
                        ? "text-yellow-400"
                        : "text-red-400"
                      }`}
                  >
                    {(r.ebitdaMargin * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {(r.revenueGrowth * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {(r.costEfficiency * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}