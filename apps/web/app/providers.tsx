"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

import { useIdleTimeout } from "../hooks/useIdleTimeout";

function IdleTimeoutGuard({ children }: { children: React.ReactNode }) {
  useIdleTimeout(10080); // 1 week (7 days) of inactivity
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() => {
    let apiUrl = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
    if (apiUrl.endsWith("/")) {
      apiUrl = apiUrl.slice(0, -1);
    }
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: `${apiUrl}/trpc`,
        }),
      ],
    });
  });

  return (
    <SessionProvider>
      <IdleTimeoutGuard>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </IdleTimeoutGuard>
    </SessionProvider>
  );
}