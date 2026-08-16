import { Controller, Get, All, Req, Res, Query, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { TrpcService } from "./trpc/trpc.service";
import { PrismaService } from "./prisma/prisma.service";
import { tableFromArrays, tableToIPC } from "apache-arrow";

@Controller()
export class AppController {
  constructor(
    private readonly trpcService: TrpcService,
    private readonly prisma: PrismaService
  ) {}

  @Get("export-arrow")
  async exportArrow(@Query("companyId") companyId: string, @Res() res: Response) {
    if (!companyId) {
      throw new HttpException("companyId is required", HttpStatus.BAD_REQUEST);
    }
    
    const statements = await this.prisma.plStatement.findMany({
      where: { companyId },
      orderBy: [{ period: "asc" }, { accountCode: "asc" }],
    });

    if (!statements.length) {
      throw new HttpException("No statements found for this company", HttpStatus.NOT_FOUND);
    }

    // Convert to columnar Arrays
    const ids = statements.map(s => s.id);
    const periods = statements.map(s => s.period);
    const accountCodes = statements.map(s => s.accountCode);
    const accountNames = statements.map(s => s.accountName);
    const amounts = statements.map(s => s.amount);
    const normalizedAmounts = statements.map(s => s.normalizedAmount);

    const table = tableFromArrays({
      id: ids,
      period: periods,
      accountCode: accountCodes,
      accountName: accountNames,
      amount: amounts,
      normalizedAmount: normalizedAmounts
    });

    const ipcBuffer = tableToIPC(table);
    
    res.setHeader('Content-Type', 'application/vnd.apache.arrow.stream');
    res.setHeader('Content-Disposition', `attachment; filename="${companyId}_pl_statements.arrow"`);
    res.send(Buffer.from(ipcBuffer));
  }

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
