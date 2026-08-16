import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue("agent_jobs") private readonly agentQueue: Queue
  ) {}

  async onModuleInit(): Promise<void> {
    await this.setupSchedules();
  }

  private async setupSchedules(): Promise<void> {
    // Clear existing repeatable jobs to avoid duplicates on restart
    const repeatableJobs = await this.agentQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await this.agentQueue.removeRepeatableByKey(job.key);
    }

    // Daily 7:00am — light monitoring
    await this.agentQueue.add(
      "daily_flash",
      {},
      { repeat: { pattern: "0 7 * * *" } }
    );

    // Monday 6:00am — weekly deep analysis
    await this.agentQueue.add(
      "weekly_full_analysis",
      {},
      { repeat: { pattern: "0 6 * * MON" } }
    );

    // 1st of each month, 4:00am — monthly comprehensive review
    await this.agentQueue.add(
      "monthly_board_analysis",
      {},
      { repeat: { pattern: "0 4 1 * *" } }
    );

    this.logger.log("BullMQ cron schedules initialized: daily (7am), weekly (Mon 6am), monthly (1st 4am)");
  }
}
