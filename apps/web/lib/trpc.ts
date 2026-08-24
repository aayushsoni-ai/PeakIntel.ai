import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@peakIntel/api/src/trpc/router";

export const trpc = createTRPCReact<AppRouter>();
