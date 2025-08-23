import { isProduction } from "@packages/environment/helpers";
import { serverEnv } from "@packages/environment/server";
import { CloudClient, ChromaClient as InternalChromaCLient } from "chromadb";

export const createChromaClient = (baseUrl: string): InternalChromaCLient => {
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
            headers: {
               Authorization: `Bearer ${serverEnv.CHROMA_TOKEN}`,
            },
         });
      return isProduction
         ? new CloudClient({
              apiKey: serverEnv.CHROMA_TOKEN,
              tenant: "7250051d-b030-411e-8fea-2bd8072b3026",
              database: "contenta-gen",
           })
         : createLocal();
      // Parse the URL to extract host, port, and ssl info
   } catch (error) {
      console.error("Failed to create ChromaDB client:", error);
      throw error;
   }
};

export type ChromaClient = ReturnType<typeof createChromaClient>;
