import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { SchedulerService } from "./scheduler.service";
import { AgentProcessor } from "./agent.processor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "agent_jobs",
    }),
  ],
  providers: [SchedulerService, AgentProcessor],
  exports: [SchedulerService],
})
export class SchedulerModule {}
