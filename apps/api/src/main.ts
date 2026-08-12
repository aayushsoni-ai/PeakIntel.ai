import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env["NEXT_PUBLIC_API_URL"] ?? "",
    ].filter(Boolean),
    credentials: true,
  });

  // Parse JSON bodies
  app.use(
    (
      await import("express")
    ).json({ limit: "10mb" })
  );

  const port = process.env["PORT"] ?? 3001;
  await app.listen(port);
  logger.log(`🚀 Pinnacle API running on http://localhost:${port}`);
  logger.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`);
  logger.log(`🔌 WebSocket: ws://localhost:${port}`);
  logger.log(`❤️  Health: http://localhost:${port}/health`);
}

bootstrap();
