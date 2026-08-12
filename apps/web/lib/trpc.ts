import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@pinnacle/api/src/trpc/router";

export const trpc = createTRPCReact<AppRouter>();
