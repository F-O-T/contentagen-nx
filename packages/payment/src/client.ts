import { Polar } from "@polar-sh/sdk";
export const isProduction = process.env.NODE_ENV === "production";

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
