import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Processor('agent_jobs')
export class AgentProcessor extends WorkerHost {
  private readonly logger = new Logger(AgentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<void> {
    const type = job.name;
    this.logger.log(`Processing scheduled job "${type}"`);
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

      const agentUrl = process.env["AGENTS_URL"] ?? "http://localhost:8001";
      fetch(`${agentUrl}/run/full_pipeline`, {
        method: "POST",
      }).catch((err) =>
        this.logger.error(`Failed to trigger python agent for ${type}: ${err}`)
      );

      this.logger.log(`Scheduled job "${type}" triggered successfully with runId: ${run.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to execute job "${type}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
