import { createAuth } from "@packages/authentication/server";
import { serverEnv as env } from "@packages/environment/server";
import { db } from "./database";
import { getPaymentClient } from "@packages/payment/client";
import { getResendClient } from "@packages/transactional/client";

export const resendClient = getResendClient(env.RESEND_API_KEY);
export const polarClient = getPaymentClient(env.POLAR_ACCESS_TOKEN);

export const auth = createAuth({
   resendClient,
   db,
   polarClient,
});
