import { serverEnv } from "@packages/environment/server";
import { getPaymentClient } from "@packages/payment/client";
import { ingestBilling } from "@packages/payment/ingestion";
const polar = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
export async function runIngestBilling(payload: {
   params: Parameters<typeof ingestBilling>[1];
}) {
   const { params } = payload;
   try {
      const ingest = await ingestBilling(polar, params);
      return ingest;
   } catch (error) {
      console.error("Error on polar billing ingestions", error);
      throw error;
   }
}
