import { hydrateRoot } from "react-dom/client";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { createRouter } from "./router";
import {
   QueryProvider,
   trpc,
   getQueryClient,
   makeTrpcClient,
} from "./integrations/clients";

const queryClient = getQueryClient();
const trpcClient = makeTrpcClient();

const router = createRouter({ trpc, queryClient, trpcClient });

hydrateRoot(
   document,
   <QueryProvider>
      <RouterClient router={router} />
   </QueryProvider>,
);
