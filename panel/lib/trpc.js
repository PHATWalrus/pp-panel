import superjson from "superjson";
import {
  createTRPCProxyClient,
  httpBatchLink,
  splitLink,
  unstable_httpSubscriptionLink,
} from "@trpc/client";
import { buildTrpcUrl, resolveMainSiteUrl } from "./url-utils";

function getMainSiteUrl() {
  return resolveMainSiteUrl("", process.env.NEXT_PUBLIC_MAIN_SITE_URL || "", "http://localhost:3000");
}

function buildLinks() {
  const url = buildTrpcUrl(getMainSiteUrl());
  return [
    splitLink({
      condition(op) {
        return op.type === "subscription";
      },
      true: unstable_httpSubscriptionLink({
        transformer: superjson,
        url,
      }),
      false: httpBatchLink({
        transformer: superjson,
        url,
      }),
    }),
  ];
}

let browserClient;

export function getTRPCClient() {
  if (browserClient) return browserClient;
  browserClient = createTRPCProxyClient({
    links: buildLinks(),
  });
  return browserClient;
}
