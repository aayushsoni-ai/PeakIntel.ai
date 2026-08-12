import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as cron from "node-cron";
import { RedisService } from "../redis/redis.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit(): void {
    this.setupSchedules();
  }

  private setupSchedules(): void {
    // Daily 7:00am — light monitoring
    cron.schedule("0 7 * * *", () => {
      this.logger.log("Triggering daily flash analysis");
      void this.triggerJob("daily_flash");
    });

    // Monday 6:00am — weekly deep analysis
    cron.schedule("0 6 * * MON", () => {
      this.logger.log("Triggering weekly full analysis");
      void this.triggerJob("weekly_full_analysis");
    });

    // 1st of each month, 4:00am — monthly comprehensive review
    cron.schedule("0 4 1 * *", () => {
      this.logger.log("Triggering monthly board analysis");
      void this.triggerJob("monthly_board_analysis");
    });

    this.logger.log("Cron schedules initialized: daily (7am), weekly (Mon 6am), monthly (1st 4am)");
  }

  private async triggerJob(type: string): Promise<void> {
    try {
      const run = await this.prisma.agentRun.create({
        data: {
          agentName: "MasterOrchestrator",
          status: "running",
          triggerType: "scheduled",
        },
      });

      await this.redis.publish(
        "agent:started",
        JSON.stringify({
          agentName: "MasterOrchestrator",
          runId: run.id,
          phase: "initialization",
          jobType: type,
        })
      );

      // Actually trigger the Python agent server
      const agentUrl = process.env["AGENT_SERVER_URL"] ?? "http://localhost:8001";
      fetch(`${agentUrl}/run/full_pipeline`, {
        method: "POST",
      }).catch((err) =>
        this.logger.error(`Failed to trigger python agent for ${type}: ${err}`)
      );

      this.logger.log(`Scheduled job "${type}" queued with runId: ${run.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to trigger scheduled job "${type}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
