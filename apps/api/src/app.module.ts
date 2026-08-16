import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { validate } from "./env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { TrpcModule } from "./trpc/trpc.module";
import { SocketModule } from "./socket/socket.module";
import { SchedulerModule } from "./scheduler/scheduler.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port, 10) || 6379,
            password: url.password || undefined,
            username: url.username || undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    TrpcModule,
    SocketModule,
    SchedulerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
