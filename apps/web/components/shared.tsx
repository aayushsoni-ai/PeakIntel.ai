import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ── MetricCard ─────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  delta?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, trend, delta, icon }: MetricCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mt-2 tracking-tight">{value}</p>
      {(trend || delta) && (
        <div className="flex items-center gap-1.5 mt-2">
          <TrendIndicator trend={trend ?? "stable"} />
          {delta && (
            <span
              className={`text-xs font-medium ${
                trend === "up"
                  ? "text-emerald-400"
                  : trend === "down"
                    ? "text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {delta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── SeverityBadge ──────────────────────────────────
interface SeverityBadgeProps {
  severity: string;
  size?: "sm" | "md";
}

export function SeverityBadge({ severity, size = "sm" }: SeverityBadgeProps) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: "bg-red-500/15", text: "text-red-400", label: "Critical" },
    high: { bg: "bg-orange-500/15", text: "text-orange-400", label: "High" },
    medium: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "Medium" },
    low: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Low" },
  };
  const c = config[severity] ?? config["low"]!;
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span className={`${c.bg} ${c.text} ${sizeClass} rounded-full font-semibold uppercase tracking-wider`}>
      {c.label}
    </span>
  );
}

// ── CompanyBadge ───────────────────────────────────
interface CompanyBadgeProps {
  name: string;
  industry: string;
}

const industryColors: Record<string, string> = {
  SaaS: "bg-blue-500/15 text-blue-400",
  Manufacturing: "bg-slate-500/15 text-slate-400",
  Healthcare: "bg-emerald-500/15 text-emerald-400",
  Retail: "bg-purple-500/15 text-purple-400",
  Logistics: "bg-amber-500/15 text-amber-400",
  Services: "bg-cyan-500/15 text-cyan-400",
  Distribution: "bg-indigo-500/15 text-indigo-400",
  Media: "bg-pink-500/15 text-pink-400",
};

export function CompanyBadge({ name, industry }: CompanyBadgeProps) {
  const colorClass = industryColors[industry] ?? "bg-gray-500/15 text-gray-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}>
        {industry}
      </span>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

// ── TrendIndicator ─────────────────────────────────
interface TrendIndicatorProps {
  trend: "up" | "down" | "stable";
  size?: number;
}

export function TrendIndicator({ trend, size = 14 }: TrendIndicatorProps) {
  if (trend === "up") return <TrendingUp className="text-emerald-400" size={size} />;
  if (trend === "down") return <TrendingDown className="text-red-400" size={size} />;
  return <Minus className="text-muted-foreground" size={size} />;
}

// ── AgentStatusDot ─────────────────────────────────
interface AgentStatusDotProps {
  status: "running" | "idle" | "completed" | "failed";
}

export function AgentStatusDot({ status }: AgentStatusDotProps) {
  const config: Record<string, string> = {
    running: "bg-emerald-400 animate-pulse",
    idle: "bg-muted-foreground",
    completed: "bg-emerald-400",
    failed: "bg-red-400",
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${config[status] ?? config["idle"]}`} />;
}

// ── SkeletonCard ───────────────────────────────────
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-card rounded-xl p-5 border border-border ${className}`}>
      <div className="h-3 w-24 bg-muted rounded animate-shimmer mb-3" />
      <div className="h-7 w-32 bg-muted rounded animate-shimmer mb-2" />
      <div className="h-3 w-16 bg-muted rounded animate-shimmer" />
    </div>
  );
}

// ── LoadingSpinner ─────────────────────────────────
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`${sizeMap[size]} border-2 border-muted border-t-primary rounded-full animate-spin`}
      />
    </div>
  );
}

// ── PeriodSelector ─────────────────────────────────
interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const periods = ["12M", "24M", "36M"];
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-0.5">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            value === p
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
