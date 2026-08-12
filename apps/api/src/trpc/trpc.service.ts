import { Injectable } from "@nestjs/common";
import { appRouter } from "./router";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import {
  fetchRequestHandler,
  FetchHandlerRequestOptions,
} from "@trpc/server/adapters/fetch";

@Injectable()
export class TrpcService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async handleRequest(req: Request): Promise<Response> {
    const options: FetchHandlerRequestOptions<typeof appRouter> = {
      endpoint: "/trpc",
      router: appRouter,
      req,
      createContext: () => ({
        prisma: this.prisma,
        redis: this.redis,
      }),
    };
    return fetchRequestHandler(options);
  }

  getRouter() {
    return appRouter;
  }
}
