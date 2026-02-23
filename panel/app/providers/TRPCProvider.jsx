'use client';

import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink, unstable_httpSubscriptionLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc-react";
import { buildTrpcUrl, resolveMainSiteUrl } from "@/lib/url-utils";
import { getPanelMainSiteUrl, PANEL_MAIN_SITE_URL_EVENT } from "@/lib/main-site-url";

function getResolvedMainSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "";
  return resolveMainSiteUrl(getPanelMainSiteUrl(), envUrl, "http://localhost:3000");
}

export default function TRPCProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mainSiteUrl, setMainSiteUrl] = useState(() => getResolvedMainSiteUrl());

  useEffect(() => {
    function syncUrl() {
      setMainSiteUrl(getResolvedMainSiteUrl());
    }
    syncUrl();
    window.addEventListener("storage", syncUrl);
    window.addEventListener(PANEL_MAIN_SITE_URL_EVENT, syncUrl);
    return () => {
      window.removeEventListener("storage", syncUrl);
      window.removeEventListener(PANEL_MAIN_SITE_URL_EVENT, syncUrl);
    };
  }, []);

  const trpcClient = useMemo(
    () =>
    trpc.createClient({
      links: [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: unstable_httpSubscriptionLink({
            transformer: superjson,
            url: buildTrpcUrl(mainSiteUrl),
          }),
          false: httpBatchLink({
            transformer: superjson,
            url: buildTrpcUrl(mainSiteUrl),
          }),
        }),
      ],
    }),
    [mainSiteUrl],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
