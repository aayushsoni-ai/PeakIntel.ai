import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { TrpcModule } from "./trpc/trpc.module";
import { SocketModule } from "./socket/socket.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    TrpcModule,
    SocketModule,
    SchedulerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
