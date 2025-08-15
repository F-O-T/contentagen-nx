import { createDb } from "../../database/src/client";
import { betterAuth } from "better-auth";
import { getAuthOptions } from "./server";
import { getResendClient } from "../../transactional/src/client";
import { getPaymentClient } from "../../payment/src/client";
import { serverEnv } from "../../environment/src/server";
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
