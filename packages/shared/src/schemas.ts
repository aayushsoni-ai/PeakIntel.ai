import { z } from "zod";

// ── Company ──────────────────────────────────────────────
export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  sector: z.string(),
  annualRevenue: z.number(),
  employeeCount: z.number().int(),
  acquisitionDate: z.coerce.date(),
  geography: z.string(),
  entryRevenue: z.number(),
  marginProfile: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Company = z.infer<typeof CompanySchema>;

// ── P&L Statement ────────────────────────────────────────
export const PlStatementSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  period: z.string(),
  accountCode: z.number().int(),
  accountName: z.string(),
  standardCategory: z.string(),
  standardSubcategory: z.string(),
  amount: z.number(),
  normalizedAmount: z.number(),
  isNormalized: z.boolean(),
  createdAt: z.coerce.date(),
});
export type PlStatement = z.infer<typeof PlStatementSchema>;

// ── Account Mapping ──────────────────────────────────────
export const AccountMappingSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  originalAccountCode: z.number().int(),
  originalAccountName: z.string(),
  standardCategory: z.string(),
  standardSubcategory: z.string(),
  confidence: z.number(),
  mappedBy: z.string(),
  createdAt: z.coerce.date(),
});
export type AccountMapping = z.infer<typeof AccountMappingSchema>;

// ── Computed Metric ──────────────────────────────────────
export const ComputedMetricSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  period: z.string(),
  metricName: z.string(),
  value: z.number(),
  target: z.number().nullable(),
  benchmark: z.number().nullable(),
  percentileRank: z.number().nullable(),
  createdAt: z.coerce.date(),
});
export type ComputedMetric = z.infer<typeof ComputedMetricSchema>;

// ── Insight ──────────────────────────────────────────────
export const InsightSeverity = z.enum(["critical", "high", "medium", "low"]);
export const InsightCategory = z.enum([
  "margin",
  "cost",
  "revenue",
  "benchmark",
  "trend",
  "anomaly",
  "bestpractice",
]);
export const InsightStatus = z.enum([
  "new",
  "reviewed",
  "action_taken",
  "dismissed",
]);

export const InsightSchema = z.object({
  id: z.string(),
  companyId: z.string().nullable(),
  agentName: z.string(),
  severity: InsightSeverity,
  category: InsightCategory,
  title: z.string(),
  summary: z.string(),
  supportingData: z.record(z.unknown()),
  recommendations: z.array(z.string()),
  relatedInsightIds: z.array(z.string()),
  status: InsightStatus,
  period: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type Insight = z.infer<typeof InsightSchema>;

// ── Agent Run ────────────────────────────────────────────
export const AgentRunStatusEnum = z.enum(["running", "completed", "failed"]);
export const AgentTriggerType = z.enum(["scheduled", "event", "manual"]);

export const AgentRunSchema = z.object({
  id: z.string(),
  agentName: z.string(),
  status: AgentRunStatusEnum,
  triggerType: AgentTriggerType,
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
  errorMessage: z.string().nullable(),
  resultSummary: z.record(z.unknown()).nullable(),
});
export type AgentRun = z.infer<typeof AgentRunSchema>;

// ── Email Log ────────────────────────────────────────────
export const EmailLogSchema = z.object({
  id: z.string(),
  templateType: z.string(),
  recipientEmail: z.string(),
  recipientRole: z.string(),
  companyId: z.string().nullable(),
  subject: z.string(),
  status: z.enum(["sent", "failed", "pending"]),
  sentAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});
export type EmailLog = z.infer<typeof EmailLogSchema>;

// ── Email Recipient ──────────────────────────────────────
export const EmailRecipientSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["ceo", "cfo", "pe_partner", "pe_associate"]),
  isActive: z.boolean(),
});
export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;

// ── Industry Benchmark ───────────────────────────────────
export const IndustryBenchmarkSchema = z.object({
  id: z.string(),
  industry: z.string(),
  metricName: z.string(),
  p25: z.number(),
  p50: z.number(),
  p75: z.number(),
  p90: z.number(),
  source: z.string(),
  asOfDate: z.coerce.date(),
});
export type IndustryBenchmark = z.infer<typeof IndustryBenchmarkSchema>;

// ── Peer Comp ────────────────────────────────────────────
export const PeerCompSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  ticker: z.string(),
  industry: z.string(),
  revenue: z.number(),
  grossMargin: z.number(),
  ebitdaMargin: z.number(),
  revenueGrowth: z.number(),
});
export type PeerComp = z.infer<typeof PeerCompSchema>;

// ── KPI Record ───────────────────────────────────────────
export const KpiRecordSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  period: z.string(),
  kpiName: z.string(),
  value: z.number(),
  target: z.number().nullable(),
});
export type KpiRecord = z.infer<typeof KpiRecordSchema>;

// ── Portfolio Summary ────────────────────────────────────
export const PortfolioSummarySchema = z.object({
  totalRevenue: z.number(),
  totalEBITDA: z.number(),
  avgEBITDAMargin: z.number(),
  avgGrossMargin: z.number(),
  companiesAboveBudget: z.number().int(),
  topPerformer: z.string(),
  bottomPerformer: z.string(),
  portfolioTrend: z.string(),
  lastUpdated: z.coerce.date(),
});
export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;

// ── Heatmap Data ─────────────────────────────────────────
export const HeatmapDataSchema = z.object({
  companies: z.array(z.object({ id: z.string(), name: z.string() })),
  metrics: z.array(z.string()),
  matrix: z.array(z.array(z.number())),
});
export type HeatmapData = z.infer<typeof HeatmapDataSchema>;

// ── Company Ranking ──────────────────────────────────────
export const CompanyRankingSchema = z.object({
  companyId: z.string(),
  companyName: z.string(),
  industry: z.string(),
  revenue: z.number(),
  grossMargin: z.number(),
  ebitdaMargin: z.number(),
  revenueGrowth: z.number(),
  sgaPercent: z.number(),
  costEfficiency: z.number(),
  trend: z.enum(["up", "down", "stable"]),
});
export type CompanyRanking = z.infer<typeof CompanyRankingSchema>;

// ── Benchmark Comparison ─────────────────────────────────
export const BenchmarkComparisonSchema = z.object({
  companyId: z.string(),
  companyName: z.string(),
  metricName: z.string(),
  companyValue: z.number(),
  industryP25: z.number(),
  industryP50: z.number(),
  industryP75: z.number(),
  percentileRank: z.number(),
});
export type BenchmarkComparison = z.infer<typeof BenchmarkComparisonSchema>;

// ── tRPC Input Schemas ───────────────────────────────────
export const GetByIdInput = z.object({ id: z.string() });
export const CompanyMetricsInput = z.object({
  id: z.string(),
  period: z.string().optional(),
});
export const PLStatementsInput = z.object({
  id: z.string(),
  startPeriod: z.string(),
  endPeriod: z.string(),
});
export const InsightsListInput = z.object({
  companyId: z.string().optional(),
  severity: InsightSeverity.optional(),
  category: InsightCategory.optional(),
  status: InsightStatus.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});
export const UpdateInsightStatusInput = z.object({
  id: z.string(),
  status: InsightStatus,
});
export const LatestInsightsInput = z.object({
  companyId: z.string(),
  limit: z.number().int().min(1).max(50).default(10),
});
export const PeerCompsInput = z.object({ industry: z.string() });
export const AgentRunInput = z.object({ jobId: z.string() });
export const RecentRunsInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});
export const SendTestEmailInput = z.object({
  recipientEmail: z.string().email(),
  templateType: z.string(),
  companyId: z.string().optional(),
});
export const GeneratePDFInput = z.object({
  companyId: z.string(),
  period: z.string(),
});
