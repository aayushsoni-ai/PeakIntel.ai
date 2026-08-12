import { Controller, Get, All, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { TrpcService } from "./trpc/trpc.service";

@Controller()
export class AppController {
  constructor(private readonly trpcService: TrpcService) {}

  @Get("health")
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "pinnacle-api",
    };
  }

  @All("trpc/*")
  async trpcHandler(@Req() req: Request, @Res() res: Response) {
    // Convert Express request to fetch-like Request for tRPC
    const protocol = req.protocol;
    const host = req.get("host") ?? "localhost:3001";
    const url = `${protocol}://${host}${req.originalUrl}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    }

    const fetchReq = new Request(url, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    try {
      const trpcRes = await this.trpcService.handleRequest(fetchReq);
      const body = await trpcRes.text();

      res.status(trpcRes.status);
      trpcRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.send(body);
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
