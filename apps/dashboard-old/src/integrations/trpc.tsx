import { createTrpcClient } from "@packages/api/client";
import type { AppRouter } from "@packages/api/server";
import { clientEnv } from "@packages/environment/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { queryClient } from "./tanstack-query";
const internalTrpc = createTrpcClient({
  serverUrl: `${clientEnv.VITE_SERVER_URL}`,
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: internalTrpc,
  queryClient,
});

export type TrpcClient = typeof trpc;
export const useTrpc = () => {
  return trpc;
};
export const getContext = () => {
  return {
    trpc,
  };
};
