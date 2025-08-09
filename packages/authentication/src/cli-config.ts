import { createDb } from "@packages/database/client";
import { betterAuth } from "better-auth";
import { getAuthOptions } from "./server";
import { getResendClient } from "@packages/transactional/client";
import { getPaymentClient } from "@packages/payment/client";
import { serverEnv } from "@packages/environment/server";
/**
 * @internal
 *
 * This export is needed strictly for the CLI to work with
 *     pnpm auth:schema:generate
 *
 * It should not be imported or used for any other purpose.
 *
 * The documentation for better-auth CLI can be found here:
 * - https://www.better-auth.com/docs/concepts/cli
 */
export const auth = betterAuth({
   ...getAuthOptions(
      createDb(),
      getResendClient(serverEnv.RESEND_API_KEY),
      getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN),
   ),
}) as ReturnType<typeof betterAuth>;
