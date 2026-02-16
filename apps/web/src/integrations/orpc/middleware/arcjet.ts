import { os } from "@orpc/server";
import type { ORPCContextWithAuth } from "../server";

/**
 * Public procedure Arcjet middleware
 * Currently disabled - passes through all requests
 */
export const arcjetPublic = os
   .$context<ORPCContextWithAuth>()
   .use(async ({ next }) => {
      return next();
   });

/**
 * Protected procedure Arcjet middleware
 * Currently disabled - passes through all requests
 */
export const arcjetProtected = os
   .$context<ORPCContextWithAuth>()
   .use(async ({ next }) => {
      return next();
   });
