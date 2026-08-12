"use client";

import { useState, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { LoadingSpinner } from "./shared";

// ── Metric display config ──────────────────────────
const METRIC_LABELS: Record<string, string> = {
  revenue: "Revenue",
  grossMargin: "Gross Margin",
  ebitdaMargin: "EBITDA Margin",
  revenueGrowth: "Revenue Growth",
  sgaPercent: "SG&A %",
  rdPercent: "R&D %",
  operatingMargin: "Operating Margin",
  revenuePerEmployee: "Rev / Employee",
  marginTrend: "Margin Trend",
  costEfficiency: "Cost Efficiency",
};

// Metrics where higher = worse (costs) — colour inverted
const INVERTED_METRICS = new Set(["sgaPercent", "rdPercent"]);

// ── Colour helpers ─────────────────────────────────
function normalizeColumn(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v) => (v - min) / range);
}

function heatColour(score: number, inverted: boolean): string {
  // score 0..1  →  red → yellow → green  (or reversed if inverted)
  const t = inverted ? 1 - score : score;

  // Use oklch-style HSL mapping through three stops
  if (t < 0.33) {
    // Red zone
    const p = t / 0.33;
    const h = 0 + p * 30; // 0 → 30
    const s = 75 - p * 10; // 75 → 65
    const l = 38 + p * 6; // 38 → 44
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  if (t < 0.66) {
    // Yellow zone
    const p = (t - 0.33) / 0.33;
    const h = 30 + p * 25; // 30 → 55
    const s = 65 - p * 5; // 65 → 60
    const l = 44 + p * 4; // 44 → 48
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  // Green zone
  const p = (t - 0.66) / 0.34;
  const h = 55 + p * 105; // 55 → 160
  const s = 60 - p * 10; // 60 → 50
  const l = 48 - p * 10; // 48 → 38
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function textColour(score: number): string {
  return score > 0.5
    ? "rgba(255,255,255,0.95)"
    : "rgba(255,255,255,0.9)";
}

// ── Format value for tooltip / cell ────────────────
function formatMetricValue(value: number, metric: string): string {
  if (metric === "revenue") {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
    return `$${value.toLocaleString()}`;
  }
  if (metric === "revenuePerEmployee") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    return `$${Math.round(value / 1000)}K`;
  }
  if (
    [
      "grossMargin",
      "ebitdaMargin",
      "sgaPercent",
      "rdPercent",
      "operatingMargin",
    ].includes(metric)
  ) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (metric === "revenueGrowth") return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

// ── Hover tooltip ──────────────────────────────────
interface TooltipData {
  company: string;
  metric: string;
  value: number;
  rank: number;
  total: number;
}

function HeatmapTooltip({
  data,
  x,
  y,
}: {
  data: TooltipData;
  x: number;
  y: number;
}) {
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: x + 14, top: y - 10 }}
    >
      <div className="bg-popover border border-border rounded-lg shadow-xl px-3.5 py-2.5 text-xs backdrop-blur-sm min-w-[180px]">
        <p className="font-semibold text-foreground text-[13px] mb-1">
          {data.company}
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">
            {METRIC_LABELS[data.metric] ?? data.metric}
          </span>
          <span className="font-mono font-semibold text-foreground">
            {formatMetricValue(data.value, data.metric)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-border/50">
          <span className="text-muted-foreground">Rank</span>
          <span className="font-mono font-medium text-primary">
            #{data.rank}{" "}
            <span className="text-muted-foreground text-[10px]">
              of {data.total}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Legend ──────────────────────────────────────────
function HeatmapLegend() {
  const stops = 12;
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>Worst</span>
      <div className="flex h-3 rounded-full overflow-hidden">
        {Array.from({ length: stops }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-full"
            style={{ backgroundColor: heatColour(i / (stops - 1), false) }}
          />
        ))}
      </div>
      <span>Best</span>
    </div>
  );
}

// ── Main Heatmap Component ─────────────────────────
export default function PortfolioHeatmap() {
  const { data, isLoading, error } = trpc.portfolio.getHeatmapData.useQuery();

  const [tooltip, setTooltip] = useState<{
    data: TooltipData;
    x: number;
    y: number;
  } | null>(null);

  const [highlightRow, setHighlightRow] = useState<number | null>(null);
  const [highlightCol, setHighlightCol] = useState<number | null>(null);

  // Normalise each metric column to 0..1 for colour mapping
  const normalised = useMemo(() => {
    if (!data) return [];
    const { matrix, metrics } = data;
    const numCompanies = matrix.length;
    const numMetrics = metrics.length;

    const result: number[][] = Array.from({ length: numCompanies }, () =>
      new Array(numMetrics).fill(0)
    );

    for (let m = 0; m < numMetrics; m++) {
      const colValues = matrix.map((row) => row[m] ?? 0);
      const normed = normalizeColumn(colValues);
      for (let c = 0; c < numCompanies; c++) {
        result[c][m] = normed[c];
      }
    }

    return result;
  }, [data]);

  // Rank per metric column
  const ranks = useMemo(() => {
    if (!data) return [];
    const { matrix, metrics } = data;
    const result: number[][] = Array.from({ length: matrix.length }, () =>
      new Array(metrics.length).fill(0)
    );

    for (let m = 0; m < metrics.length; m++) {
      const inverted = INVERTED_METRICS.has(metrics[m]);
      const indexed = matrix.map((row, i) => ({ val: row[m] ?? 0, i }));
      indexed.sort((a, b) => (inverted ? a.val - b.val : b.val - a.val));
      indexed.forEach((item, rank) => {
        result[item.i][m] = rank + 1;
      });
    }

    return result;
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
        Unable to load heatmap data.
      </div>
    );
  }

  const { companies, metrics, matrix } = data;

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">
            Portfolio Performance Heatmap
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {companies.length} companies × {metrics.length} metrics — colour
            indicates relative rank
          </p>
        </div>
        <HeatmapLegend />
      </div>

      {/* Scrollable grid */}
      <div className="overflow-x-auto -mx-1 px-1">
        <table
          className="w-full border-collapse"
          onMouseLeave={() => {
            setTooltip(null);
            setHighlightRow(null);
            setHighlightCol(null);
          }}
        >
          {/* Metric header row */}
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest min-w-[160px]">
                Company
              </th>
              {metrics.map((m, mi) => (
                <th
                  key={m}
                  className={`px-1 py-2 text-center text-[10px] font-medium uppercase tracking-wider transition-colors duration-150 ${
                    highlightCol === mi
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                  style={{ minWidth: 80 }}
                >
                  {METRIC_LABELS[m] ?? m}
                </th>
              ))}
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {companies.map((company, ci) => (
              <tr
                key={company.id}
                className={`transition-colors duration-150 ${
                  highlightRow === ci ? "bg-accent/20" : ""
                }`}
              >
                {/* Company name — sticky */}
                <td className="sticky left-0 z-10 bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap border-b border-border/30">
                  <span
                    className={`transition-colors duration-150 ${
                      highlightRow === ci
                        ? "text-primary font-semibold"
                        : "text-foreground"
                    }`}
                  >
                    {company.name}
                  </span>
                </td>

                {/* Metric cells */}
                {metrics.map((metric, mi) => {
                  const rawValue = matrix[ci]?.[mi] ?? 0;
                  const normValue = normalised[ci]?.[mi] ?? 0;
                  const inverted = INVERTED_METRICS.has(metric);
                  const rank = ranks[ci]?.[mi] ?? 0;
                  const bg = heatColour(normValue, inverted);
                  const fg = textColour(normValue);

                  return (
                    <td
                      key={metric}
                      className="px-0.5 py-1 border-b border-border/10"
                      onMouseEnter={(e) => {
                        setHighlightRow(ci);
                        setHighlightCol(mi);
                        setTooltip({
                          data: {
                            company: company.name,
                            metric,
                            value: rawValue,
                            rank,
                            total: companies.length,
                          },
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseMove={(e) => {
                        setTooltip((prev) =>
                          prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                        );
                      }}
                      onMouseLeave={() => {
                        setHighlightRow(null);
                        setHighlightCol(null);
                        setTooltip(null);
                      }}
                    >
                      <div
                        className="rounded-md px-2 py-2 text-center text-[11px] font-mono font-semibold cursor-default transition-all duration-200 hover:scale-105 hover:shadow-lg hover:z-10 relative"
                        style={{
                          backgroundColor: bg,
                          color: fg,
                          boxShadow:
                            highlightRow === ci || highlightCol === mi
                              ? "inset 0 0 0 1.5px rgba(255,255,255,0.25)"
                              : "none",
                        }}
                      >
                        {formatMetricValue(rawValue, metric)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip overlay */}
      {tooltip && <HeatmapTooltip {...tooltip} />}
    </div>
  );
}
