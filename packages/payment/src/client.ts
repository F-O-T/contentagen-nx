import { Polar } from "@polar-sh/sdk";
import { isProduction } from "@packages/environment";
export function getPaymentClient(POLAR_ACCESS_TOKEN: string) {
   if (!POLAR_ACCESS_TOKEN) {
      throw new Error(
         "Polar access token is required to initialize the payment client.",
      );
   }
   const internalClient = new Polar({
      accessToken: POLAR_ACCESS_TOKEN,
      server: isProduction ? "production" : "sandbox",
   });
   return internalClient;
}
