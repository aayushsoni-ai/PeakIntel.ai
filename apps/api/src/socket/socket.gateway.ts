import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { RedisService } from "../redis/redis.service";

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  namespace: "/",
})
export class SocketGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(SocketGateway.name);

  constructor(private readonly redisService: RedisService) {}

  afterInit(): void {
    this.logger.log("Socket.IO gateway initialized");
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async onModuleInit(): Promise<void> {
    // Subscribe to Redis pub/sub channels and bridge to Socket.IO
    const channels = [
      "agent:started",
      "agent:progress",
      "agent:completed",
      "agent:failed",
      "agent:terminated",
      "insights:new",
      "email:sent",
    ];

    for (const channel of channels) {
      await this.redisService.subscribe(channel, (message: string) => {
        try {
          const data: unknown = JSON.parse(message);
          this.server.emit(channel, data);
        } catch {
          this.server.emit(channel, { raw: message });
        }
      });
    }

    this.logger.log(
      `Subscribed to Redis channels: ${channels.join(", ")}`
    );
  }

  emitEvent(event: string, data: Record<string, unknown>): void {
    this.server.emit(event, data);
  }
}
