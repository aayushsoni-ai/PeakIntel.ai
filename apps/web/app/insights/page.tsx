"use client";

import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { SeverityBadge, CompanyBadge, LoadingSpinner } from "../../components/shared";
import { Filter, CheckCircle, Eye, XCircle } from "lucide-react";


type Insight = {
  id: string;
  companyId: string | null;
  agentName: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "margin" | "cost" | "revenue" | "benchmark" | "trend" | "anomaly" | "bestpractice";
  title: string;
  summary: string;
  // Prisma stores this as `Json`, so at the TypeScript level it arrives as
  // `unknown`. We Array.isArray() guard it before rendering, and cast to
  // string[] inside that guard — which is safe because the agent always
  // writes string arrays into this field.
  recommendations: unknown;
  relatedInsightIds: string[];
  status: "new" | "reviewed" | "action_taken" | "dismissed";
  period: string | null;
  createdAt: string;
  // The Prisma `include: { company: true }` relation.
  // Null when an insight is portfolio-wide rather than company-specific.
  company: {
    name: string;
    industry: string;
  } | null;
};
// ─────────────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [filters, setFilters] = useState<{
    severity?: "critical" | "high" | "medium" | "low";
    category?: "margin" | "cost" | "revenue" | "benchmark" | "trend" | "anomaly" | "bestpractice";
    status?: "new" | "reviewed" | "action_taken" | "dismissed";
  }>({ status: "new" });

  const { data: rawInsights, isLoading, refetch } = trpc.insights.list.useQuery({
    ...filters,
    limit: 50,
  });

  // Cast to our explicit Insight[] type here — this is the key move.
  // tRPC has already validated the data against the Zod schema at the network
  // boundary, so the cast is safe. We're not lying to TypeScript; we're just
  // handing it a pre-resolved label instead of asking it to re-derive one.
  const insights: Insight[] = (rawInsights ?? []) as unknown as Insight[];

  const updateStatus = trpc.insights.updateStatus.useMutation({
    onSuccess: () => { void refetch(); },
  });

  const severities = ["critical", "high", "medium", "low"] as const;
  const categories = ["margin", "cost", "revenue", "benchmark", "trend", "anomaly", "bestpractice"] as const;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insights Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-generated insights across your portfolio, prioritized by severity
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />

        <button
          onClick={() => setFilters({ status: filters.status })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filters.severity && !filters.category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
        >
          All
        </button>

        {severities.map((sev) => (
          <button
            key={sev}
            onClick={() => setFilters({ ...filters, severity: filters.severity === sev ? undefined : sev })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.severity === sev ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
          >
            {sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}

        <span className="text-border">|</span>

        {categories.slice(0, 4).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilters({ ...filters, category: filters.category === cat ? undefined : cat })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}

        <span className="text-border">|</span>

        <button
          onClick={() => setFilters({ ...filters, status: filters.status === "new" ? undefined : "new" })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.status === "new" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          {filters.status === "new" ? "Unresolved Only" : "Show All"}
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {!insights.length ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <p className="text-muted-foreground">
              No insights found. Run the agent pipeline to generate insights.
            </p>
          </div>
        ) : (
          // TypeScript now knows immediately that `insight` is `Insight` —
          // no deep chain tracing required, so TS2589 cannot occur here.
          insights.map((insight: Insight) => (
            <div
              key={insight.id}
              className="bg-card rounded-xl border border-border p-5 hover:border-border/80 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <SeverityBadge severity={insight.severity} size="md" />
                    {insight.company && (
                      <CompanyBadge name={insight.company.name} industry={insight.company.industry} />
                    )}
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {insight.agentName}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">
                      {insight.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>

                  {/* Recommendations */}
                  {(() => {
                    let recs: string[] = [];
                    if (Array.isArray(insight.recommendations)) {
                      recs = insight.recommendations;
                    } else if (
                      insight.recommendations && 
                      typeof insight.recommendations === 'object' && 
                      'recommendations' in insight.recommendations && 
                      Array.isArray((insight.recommendations as { recommendations: unknown[] }).recommendations)
                    ) {
                      recs = (insight.recommendations as { recommendations: string[] }).recommendations;
                    }
                    return recs.length > 0 ? (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recommendations</p>
                        {recs.map((rec, i) => (
                          <p key={i} className="text-xs text-muted-foreground pl-3 border-l-2 border-primary/30">
                            {rec}
                          </p>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => updateStatus.mutate({ id: insight.id, status: "reviewed" })}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                      insight.status === "reviewed"
                        ? "bg-blue-500 text-white"
                        : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Review
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: insight.id, status: "action_taken" })}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                      insight.status === "action_taken"
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" /> Done
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: insight.id, status: "dismissed" })}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                      insight.status === "dismissed"
                        ? "bg-muted-foreground text-white"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <XCircle className="w-3 h-3" /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}