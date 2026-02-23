import superjson from "superjson";
import {
  createTRPCProxyClient,
  httpBatchLink,
  splitLink,
  unstable_httpSubscriptionLink,
} from "@trpc/client";
import { getBaseUrl } from "./baseUrl";

function buildLinks() {
  const url = `${getBaseUrl()}/api/trpc`;
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

export function getBrowserTRPCClient() {
  if (browserClient) return browserClient;
  browserClient = createTRPCProxyClient({
    links: buildLinks(),
  });
  return browserClient;
}
