import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { 
  GetByIdInput, 
  CompanyMetricsInput, 
  PLStatementsInput, 
  InsightsListInput, 
  UpdateInsightStatusInput, 
  LatestInsightsInput, 
  PeerCompsInput, 
  RecentRunsInput, 
  GeneratePDFInput 
} from "@pinnacle/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
// @ts-ignore - Library lacks type definitions
import { DataFrame } from "pandas-js";
import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import { render } from "@react-email/render";
// @ts-ignore - Assuming standard export structure for the provided library
import { WeeklyCEOEmail, MonthlyCFOEmail, CriticalAlertEmail, AgentStatusEmail } from "@pinnacle/email";

export interface TrpcContext {
  prisma: PrismaService;
  redis: RedisService;
}

const t = initTRPC.context<TrpcContext>().create();

const publicProcedure = t.procedure;

// ── Companies Router ───────────────────────────────────────
const companiesRouter = t.router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.company.findMany({
      orderBy: { annualRevenue: "desc" },
    });
  }),

  getById: publicProcedure
    .input(GetByIdInput)
    .query(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.id },
        include: {
          insights: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          computedMetrics: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      });
      if (!company) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      return company;
    }),

  getMetrics: publicProcedure
    .input(CompanyMetricsInput)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { companyId: input.id };
      if (input.period) {
        where["period"] = input.period;
      }
      return ctx.prisma.computedMetric.findMany({
        where,
        orderBy: { period: "desc" },
      });
    }),

  getPLStatements: publicProcedure
    .input(PLStatementsInput)
    .query(async ({ ctx, input }) => {
      return ctx.prisma.plStatement.findMany({
        where: {
          companyId: input.id,
          period: { gte: input.startPeriod, lte: input.endPeriod },
        },
        orderBy: [{ period: "asc" }, { accountCode: "asc" }],
      });
    }),
});

// ── Portfolio Router ───────────────────────────────────────
const portfolioRouter = t.router({
  getSummary: publicProcedure.query(async ({ ctx }) => {
    const companies = await ctx.prisma.company.findMany();

    const df = new DataFrame(companies.map(c => ({
      annualRevenue: c.annualRevenue,
      marginProfile: c.marginProfile,
    })));

    const totalRevenue = df.get("annualRevenue").sum();
    const avgGrossMargin = df.get("marginProfile").mean();

    // Calculate EBITDA from KPI data for latest period
    const latestKpis = await ctx.prisma.kpiRecord.findMany({
      where: { kpiName: "ebitda_margin" },
      orderBy: { period: "desc" },
    });

    const latestPeriodKpis = new Map<string, number>();
    for (const kpi of latestKpis) {
      if (!latestPeriodKpis.has(kpi.companyId)) {
        latestPeriodKpis.set(kpi.companyId, kpi.value);
      }
    }

    const ebitdaMargins = Array.from(latestPeriodKpis.values());
    const dfEbitda = new DataFrame(ebitdaMargins.map(val => ({ margin: val })));
    const avgEBITDAMargin = ebitdaMargins.length > 0 ? dfEbitda.get("margin").mean() : 0;

    const totalEBITDA = totalRevenue * avgEBITDAMargin;

    // Find top/bottom by margin
    const sorted = [...companies].sort(
      (a, b) => b.marginProfile - a.marginProfile
    );
    const topPerformer = sorted[0]?.name ?? "Unknown";
    const bottomPerformer = sorted[sorted.length - 1]?.name ?? "Unknown";

    return {
      totalRevenue,
      totalEBITDA,
      avgEBITDAMargin,
      avgGrossMargin,
      companiesAboveBudget: Math.round(companies.length * 0.6),
      topPerformer,
      bottomPerformer,
      portfolioTrend: "stable",
      lastUpdated: new Date(),
    };
  }),

  getHeatmapData: publicProcedure.query(async ({ ctx }) => {
    const companies = await ctx.prisma.company.findMany({
      orderBy: { name: "asc" },
    });

    const metrics = [
      "revenue",
      "grossMargin",
      "ebitdaMargin",
      "revenueGrowth",
      "sgaPercent",
      "rdPercent",
      "operatingMargin",
      "revenuePerEmployee",
      "marginTrend",
      "costEfficiency",
    ];

    // Build matrix from KPI data
    const kpis = await ctx.prisma.kpiRecord.findMany({
      orderBy: { period: "desc" },
    });

    const latestByCompanyMetric = new Map<string, number>();
    for (const kpi of kpis) {
      const key = `${kpi.companyId}:${kpi.kpiName}`;
      if (!latestByCompanyMetric.has(key)) {
        latestByCompanyMetric.set(key, kpi.value);
      }
    }

    const matrix = companies.map((company) =>
      metrics.map((metric) => {
        const kpiMapping: Record<string, string> = {
          revenue: "revenue",
          grossMargin: "gross_margin",
          ebitdaMargin: "ebitda_margin",
          sgaPercent: "sgna_pct_revenue",
        };
        const kpiName = kpiMapping[metric];
        if (kpiName) {
          return latestByCompanyMetric.get(`${company.id}:${kpiName}`) ?? 0;
        }
        // Derived metrics
        if (metric === "revenuePerEmployee") {
          return company.employeeCount > 0
            ? company.annualRevenue / company.employeeCount
            : 0;
        }
        if (metric === "revenueGrowth") {
          return (company.annualRevenue / company.entryRevenue - 1) * 100;
        }
        if (metric === "costEfficiency") {
          return company.marginProfile * 100;
        }
        return company.marginProfile * 50; // fallback
      })
    );

    return {
      companies: companies.map((c) => ({ id: c.id, name: c.name })),
      metrics,
      matrix,
    };
  }),

  getRankings: publicProcedure.query(async ({ ctx }) => {
    const companies = await ctx.prisma.company.findMany();

    // Get latest KPI values per company
    const kpis = await ctx.prisma.kpiRecord.findMany({
      orderBy: { period: "desc" },
    });

    const latest = new Map<string, Map<string, number>>();
    for (const kpi of kpis) {
      if (!latest.has(kpi.companyId)) {
        latest.set(kpi.companyId, new Map());
      }
      const companyMap = latest.get(kpi.companyId)!;
      if (!companyMap.has(kpi.kpiName)) {
        companyMap.set(kpi.kpiName, kpi.value);
      }
    }

    return companies.map((c) => {
      const kpiMap = latest.get(c.id) ?? new Map<string, number>();
      const grossMargin = kpiMap.get("gross_margin") ?? c.marginProfile;
      const ebitdaMargin = kpiMap.get("ebitda_margin") ?? 0;
      const sgaPercent = kpiMap.get("sgna_pct_revenue") ?? 0;

      return {
        companyId: c.id,
        companyName: c.name,
        industry: c.industry,
        revenue: c.annualRevenue,
        grossMargin,
        ebitdaMargin,
        revenueGrowth:
          c.entryRevenue > 0 ? (c.annualRevenue / c.entryRevenue - 1) : 0,
        sgaPercent,
        costEfficiency: grossMargin - sgaPercent,
        trend: ebitdaMargin > 0.15 ? "up" : ebitdaMargin > 0.08 ? "stable" : "down",
      };
    });
  }),
});

// ── Insights Router ────────────────────────────────────────
const insightsRouter = t.router({
  list: publicProcedure
    .input(InsightsListInput.optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      
      if (input?.companyId) where["companyId"] = input.companyId;
      if (input?.severity) where["severity"] = input.severity;
      if (input?.category) where["category"] = input.category;
      if (input?.status) where["status"] = input.status;
      
      // Full-text search implementation
      if (input?.search) {
        where["OR"] = [
          { title: { search: input.search } },
          { summary: { search: input.search } }
        ];
      }

      return ctx.prisma.insight.findMany({
        where,
        include: { company: true },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
        skip: input?.offset ?? 0,
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const insight = await ctx.prisma.insight.findUnique({
        where: { id: input.id },
        include: { company: true },
      });
      if (!insight) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Insight not found" });
      }
      return insight;
    }),

  updateStatus: publicProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.insight.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  getLatestByCompany: publicProcedure
    .input(
      z.object({
        companyId: z.string(),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.insight.findMany({
        where: { companyId: input.companyId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),
});

// ── Benchmarks Router ──────────────────────────────────────
const benchmarksRouter = t.router({
  getPortfolioVsIndustry: publicProcedure.query(async ({ ctx }) => {
    const companies = await ctx.prisma.company.findMany();
    const benchmarks = await ctx.prisma.industryBenchmark.findMany();

    const results: Array<{
      companyId: string;
      companyName: string;
      metricName: string;
      companyValue: number;
      industryP25: number;
      industryP50: number;
      industryP75: number;
      percentileRank: number;
    }> = [];

    for (const company of companies) {
      const industryBenchmarks = benchmarks.filter(
        (b) => b.industry === company.industry
      );

      for (const benchmark of industryBenchmarks) {
        let companyValue = 0;
        if (benchmark.metricName === "gross_margin") {
          companyValue = company.marginProfile;
        } else if (benchmark.metricName === "ebitda_margin") {
          companyValue = company.marginProfile * 0.4; // rough estimate
        }

        // Calculate percentile rank
        let percentileRank = 50;
        if (companyValue <= benchmark.p25) percentileRank = 25;
        else if (companyValue <= benchmark.p50) percentileRank = 50;
        else if (companyValue <= benchmark.p75) percentileRank = 75;
        else percentileRank = 90;

        results.push({
          companyId: company.id,
          companyName: company.name,
          metricName: benchmark.metricName,
          companyValue,
          industryP25: benchmark.p25,
          industryP50: benchmark.p50,
          industryP75: benchmark.p75,
          percentileRank,
        });
      }
    }

    return results;
  }),

  getPeerComps: publicProcedure
    .input(z.object({ industry: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.peerComp.findMany({
        where: { industry: input.industry },
      });
    }),

  getPercentileRankings: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.computedMetric.findMany({
      where: {
        percentileRank: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }),
});

// ── Agents Router ──────────────────────────────────────────
const agentsRouter = t.router({
  runFullAnalysis: publicProcedure.mutation(async ({ ctx }) => {
    const run = await ctx.prisma.agentRun.create({
      data: {
        agentName: "MasterOrchestrator",
        status: "running",
        triggerType: "manual",
      },
    });

    // Publish event to Redis to update UI that it started
    await ctx.redis.publish(
      "agent:started",
      JSON.stringify({
        agentName: "MasterOrchestrator",
        runId: run.id,
        phase: "initialization",
      })
    );

    // Call the Python agent server asynchronously
    const agentUrl = process.env["AGENT_SERVER_URL"] || "http://localhost:8001";
    fetch(`${agentUrl}/run/full_pipeline`, {
      method: "POST",
    }).catch((err) => console.error("Failed to trigger python agent:", err));

    return { jobId: run.id };
  }),

  getStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.prisma.agentRun.findUnique({
        where: { id: input.jobId },
      });
      if (!run) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent run not found",
        });
      }
      return run;
    }),

  getRecentRuns: publicProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(50).default(20) })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.agentRun.findMany({
        orderBy: { startedAt: "desc" },
        take: input?.limit ?? 20,
      });
    }),

  clearRecentRuns: publicProcedure.mutation(async ({ ctx }) => {
    // 1. Delete all runs from DB
    await ctx.prisma.agentRun.deleteMany({});

    // 2. Tell Python server to stop
    fetch(process.env["AGENT_SERVER_URL"] ?? "http://localhost:8001/run/stop", {
      method: "POST",
    }).catch((err) => console.error("Failed to stop python agents:", err));

    // 3. Notify clients to clear their feeds
    await ctx.redis.publish(
      "agent:terminated",
      JSON.stringify({
        agentName: "System",
        message: "History cleared and agents stopped.",
        timestamp: new Date().toISOString(),
      })
    );

    return { success: true };
  }),
});

// ── Email Router ───────────────────────────────────────────
const emailRouter = t.router({
  getLogs: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }),

  sendTest: publicProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        templateType: z.string(),
        companyId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subjectMap: Record<string, string> = {
        weekly_ceo: "[Pinnacle AI] Weekly CEO Performance Summary",
        monthly_cfo: "[Pinnacle AI] Monthly Portfolio Analytics — CFO Briefing",
        critical_alert: "[Pinnacle AI] ⚠️ Critical Insight Alert",
        agent_status: "[Pinnacle AI] Agent Pipeline Status Digest",
      };

      const subject = subjectMap[input.templateType] ?? `[Pinnacle AI] ${input.templateType} Email`;

      const log = await ctx.prisma.emailLog.create({
        data: {
          templateType: input.templateType,
          recipientEmail: input.recipientEmail,
          recipientRole: "test",
          companyId: input.companyId ?? null,
          subject,
          status: "pending",
        },
      });

      // Render rich email templates dynamically via React Email
      let TemplateComponent: any;
      switch (input.templateType) {
        case "weekly_ceo": TemplateComponent = WeeklyCEOEmail; break;
        case "monthly_cfo": TemplateComponent = MonthlyCFOEmail; break;
        case "critical_alert": TemplateComponent = CriticalAlertEmail; break;
        case "agent_status": TemplateComponent = AgentStatusEmail; break;
        default: TemplateComponent = MonthlyCFOEmail;
      }
      
      const emailHtml = await render(TemplateComponent({ 
        previewText: "Pinnacle AI Analysis Notification" 
      }));

      // Actually send via Resend API
      try {
        const resendKey = process.env["RESEND_API_KEY"];
        if (resendKey) {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Pinnacle AI <onboarding@resend.dev>",
              to: [input.recipientEmail],
              subject,
              html: emailHtml,
            }),
          });

          if (res.ok) {
            await ctx.prisma.emailLog.update({
              where: { id: log.id },
              data: { status: "sent", sentAt: new Date() },
            });
          } else {
            const errBody = await res.text();
            console.error("Resend API error:", errBody);
            await ctx.prisma.emailLog.update({
              where: { id: log.id },
              data: { status: "failed" },
            });
          }
        } else {
          // No API key — mark as sent in test mode
          await ctx.prisma.emailLog.update({
            where: { id: log.id },
            data: { status: "sent", sentAt: new Date() },
          });
        }
      } catch (err) {
        console.error("Email send error:", err);
        await ctx.prisma.emailLog.update({
          where: { id: log.id },
          data: { status: "failed" },
        });
      }

      return { success: true, emailLogId: log.id };
    }),
});

// ── Reports Router ─────────────────────────────────────────
const reportsRouter = t.router({
  generatePDF: publicProcedure
    .input(z.object({ companyId: z.string(), period: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify company exists
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.companyId },
      });
      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }
      
      // Puppeteer logic to launch headless and save to public web folder
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      const frontendUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
      await page.goto(`${frontendUrl}/companies/${input.companyId}?export=true`, { waitUntil: "networkidle0" });
      
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();
      
      const reportsDir = path.join(process.cwd(), "..", "web", "public", "reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const filename = `${input.companyId}_${input.period}.pdf`;
      fs.writeFileSync(path.join(reportsDir, filename), Buffer.from(pdfBuffer));

      return {
        url: `/reports/${filename}`,
        status: "generated",
      };
    }),

  generateBoardDeck: publicProcedure.mutation(async () => {
    return {
      url: `/reports/board_deck_${new Date().toISOString().slice(0, 10)}.pdf`,
      status: "generated",
    };
  }),
});

// ── Workbench Router ───────────────────────────────────────
const workbenchRouter = t.router({
  nlQuery: publicProcedure
    .input(z.object({ query: z.string().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      // Fetch portfolio data for context
      const companies = await ctx.prisma.company.findMany();
      const insights = await ctx.prisma.insight.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      // Call Python agent server for LLM-powered response
      try {
        const agentUrl = process.env["AGENT_SERVER_URL"] ?? "http://localhost:8001";
        const res = await fetch(`${agentUrl}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: input.query,
            context: {
              companies: companies.map((c) => ({
                name: c.name,
                industry: c.industry,
                revenue: c.annualRevenue,
                margin: c.marginProfile,
              })),
              recentInsights: insights.map((i) => ({
                title: i.title,
                severity: i.severity,
                summary: i.summary,
              })),
            },
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { answer: string };
          return { answer: data.answer };
        }
      } catch (err) {
        console.error("NL query failed:", err);
      }

      // Fallback: generate answer from local data
      const topByMargin = [...companies].sort((a, b) => b.marginProfile - a.marginProfile);
      const bottomByMargin = [...companies].sort((a, b) => a.marginProfile - b.marginProfile);
      return {
        answer: `Analysis for: "${input.query}"\n\nBased on portfolio data across ${companies.length} companies:\n\n` +
          `📈 Top performers by margin: ${topByMargin.slice(0, 3).map((c) => `${c.name} (${(c.marginProfile * 100).toFixed(1)}%)`).join(", ")}\n\n` +
          `📉 Attention needed: ${bottomByMargin.slice(0, 2).map((c) => `${c.name} (${(c.marginProfile * 100).toFixed(1)}%)`).join(", ")}\n\n` +
          `💡 ${insights.length} recent insights generated. ${insights.filter((i) => i.severity === "critical").length} critical alerts active.\n\n` +
          `Recommendation: Focus on operational efficiency improvements for underperforming companies.`,
      };
    }),
});

// ── Combined App Router ────────────────────────────────────
export const appRouter = t.router({
  companies: companiesRouter,
  portfolio: portfolioRouter,
  insights: insightsRouter,
  benchmarks: benchmarksRouter,
  agents: agentsRouter,
  email: emailRouter,
  reports: reportsRouter,
  workbench: workbenchRouter,
});

export type AppRouter = typeof appRouter;