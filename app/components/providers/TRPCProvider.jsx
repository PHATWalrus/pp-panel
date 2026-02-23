'use client';

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink, unstable_httpSubscriptionLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/app/utils/trpc/react";
import { getBaseUrl } from "@/app/utils/trpc/baseUrl";

export default function TRPCProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: unstable_httpSubscriptionLink({
            transformer: superjson,
            url: `${getBaseUrl()}/api/trpc`,
          }),
          false: httpBatchLink({
            transformer: superjson,
            url: `${getBaseUrl()}/api/trpc`,
          }),
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
