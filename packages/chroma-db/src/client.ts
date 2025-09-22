//TODO: Once everything is fully migrated to the rag package, we can remove this internal package

import { isProduction } from "@packages/environment/helpers";
import { serverEnv } from "@packages/environment/server";
import { CloudClient, ChromaClient as InternalChromaCLient } from "chromadb";

let chromaClientInstance: InternalChromaCLient | null = null;

export const createChromaClient = (baseUrl: string): InternalChromaCLient => {
   if (chromaClientInstance) {
      return chromaClientInstance;
   }

   try {
      const url = new URL(baseUrl);
      const host = url.hostname;
      const port =
         parseInt(url.port, 10) || (url.protocol === "https:" ? 443 : 80);
      const ssl = url.protocol === "https:";

      console.log(`Creating ChromaDB client for ${host}:${port} (SSL: ${ssl})`);

      const createLocal = () =>
         new InternalChromaCLient({
            host,
            port,
            ssl,
         });

      chromaClientInstance = isProduction
         ? new CloudClient({
              apiKey: serverEnv.CHROMA_TOKEN,
              tenant: "7250051d-b030-411e-8fea-2bd8072b3026",
              database: "contenta-gen",
           })
         : createLocal();

      return chromaClientInstance;
      // Parse the URL to extract host, port, and ssl info
   } catch (error) {
      console.error("Failed to create ChromaDB client:", error);
      throw error;
   }
};

export const getChromaClient = (): InternalChromaCLient => {
   if (!chromaClientInstance) {
      return createChromaClient(serverEnv.CHROMA_DB_URL);
   }
   return chromaClientInstance;
};

export const resetChromaClient = (): void => {
   chromaClientInstance = null;
};

export type ChromaClient = ReturnType<typeof createChromaClient>;
