import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;
  public subscriber: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>("REDIS_URL") ?? "redis://localhost:6379";

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      await this.subscriber.connect();
      this.logger.log("Redis connected successfully");
    } catch (error) {
      this.logger.warn(
        `Redis connection failed (will operate without cache): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => {});
    await this.subscriber.quit().catch(() => {});
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, "EX", ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      this.logger.warn(`Redis SET failed for key: ${key}`);
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch {
      this.logger.warn(`Redis PUBLISH failed for channel: ${channel}`);
    }
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void
  ): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on("message", (ch, msg) => {
        if (ch === channel) {
          callback(msg);
        }
      });
    } catch {
      this.logger.warn(`Redis SUBSCRIBE failed for channel: ${channel}`);
    }
  }
}
