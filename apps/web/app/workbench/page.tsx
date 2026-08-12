"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Search, Download } from "lucide-react";
import { trpc } from "../../lib/trpc";

export default function WorkbenchPage() {
  const [nlQuery, setNlQuery] = useState("");
  const [nlResult, setNlResult] = useState<string>("");

  // Custom chart builder state
  const [metric, setMetric] = useState("revenue");
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");
  const { data: rankings } = trpc.portfolio.getRankings.useQuery();

  // Generate chart data from rankings
  const chartData = (rankings ?? []).map((r) => {
    const values: Record<string, number> = {
      revenue: r.revenue / 1_000_000,
      grossMargin: r.grossMargin * 100,
      ebitdaMargin: r.ebitdaMargin * 100,
      sgaPercent: r.sgaPercent * 100,
      revenueGrowth: r.revenueGrowth * 100,
    };
    return {
      name: r.companyName.split(" ")[0] ?? r.companyName,
      value: values[metric] ?? 0,
    };
  });

  const nlQueryMutation = trpc.workbench.nlQuery.useMutation();
  const [nlLoading, setNlLoading] = useState(false);

  const handleNLQuery = async () => {
    if (!nlQuery.trim()) return;
    setNlLoading(true);
    setNlResult("");
    try {
      const result = await nlQueryMutation.mutateAsync({ query: nlQuery });
      setNlResult(result.answer);
    } catch {
      setNlResult("Failed to process query. Please try again.");
    } finally {
      setNlLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChartComponent: any = chartType === "line" ? LineChart : chartType === "bar" ? BarChart : AreaChart;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Workbench</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ask questions, build custom charts, and export data
        </p>
      </div>

      {/* NL Query Bar */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Ask a Question</h3>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleNLQuery(); }}
              placeholder="Ask a question about your portfolio..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          <button
            onClick={() => { void handleNLQuery(); }}
            disabled={nlLoading || !nlQuery.trim()}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {nlLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        {nlLoading && (
          <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Querying AI analyst...</span>
          </div>
        )}
        {nlResult && !nlLoading && (
          <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{nlResult}</pre>
          </div>
        )}
      </div>

      {/* Custom Chart Builder */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Custom Chart Builder</h3>
          <div className="flex items-center gap-3">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="revenue">Revenue ($M)</option>
              <option value="grossMargin">Gross Margin (%)</option>
              <option value="ebitdaMargin">EBITDA Margin (%)</option>
              <option value="sgaPercent">SG&A (%)</option>
              <option value="revenueGrowth">Revenue Growth (%)</option>
            </select>
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              {(["line", "bar", "area"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    chartType === type
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            />
            {chartType === "line" && (
              <Line type="monotone" dataKey="value" name={metric} stroke="#d4a853" strokeWidth={2} />
            )}
            {chartType === "bar" && (
              <Bar dataKey="value" name={metric} fill="rgba(212, 168, 83, 0.6)" radius={[4, 4, 0, 0]} />
            )}
            {chartType === "area" && (
              <Area type="monotone" dataKey="value" name={metric} stroke="#d4a853" fill="rgba(212, 168, 83, 0.3)" />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Export Panel */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Export Data</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const csv = "Company,Value\n" + chartData.map((d) => `${d.name},${d.value.toFixed(2)}`).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `pinnacle_${metric}.csv`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => {
              const tsv = "Company\tValue\n" + chartData.map((d) => `${d.name}\t${d.value.toFixed(2)}`).join("\n");
              const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `pinnacle_${metric}.xls`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
