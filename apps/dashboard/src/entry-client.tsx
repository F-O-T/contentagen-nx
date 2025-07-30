import { hydrateRoot } from "react-dom/client";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { createRouter } from "./router";
import { QueryProvider, trpc, getQueryClient } from "./integrations/clients";

const queryClient = getQueryClient();

const router = createRouter({ trpc, queryClient });

hydrateRoot(
   document,
   <QueryProvider>
      <RouterClient router={router} />
   </QueryProvider>,
);
