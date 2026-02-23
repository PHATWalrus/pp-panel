import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/app/server/trpc/router";

const handler = (req) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
    onError({ error, path }) {
      console.error(`tRPC error on ${path ?? "unknown path"}:`, error);
    },
  });

export { handler as GET, handler as POST };
