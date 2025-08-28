import { createChromaClient } from "@packages/chroma-db/client";
import { getCollection, addToCollection } from "@packages/chroma-db/helpers";
import { serverEnv } from "@packages/environment/server";
import crypto from "node:crypto";
const chroma = createChromaClient(serverEnv.CHROMA_DB_URL);
export async function runCunkSaving(payload: {
   items: { chunk: string; agentId: string; sourceId: string }[];
}) {
   const { items } = payload;
   if (!items || items.length === 0) {
      return { count: 0 };
   }

   try {
      const collection = await getCollection(chroma, "AgentKnowledge");

      const documents = items.map((i) => i.chunk);
      const ids = items.map(() => crypto.randomUUID());
      const metadatas = items.map((i) => ({
         agentId: i.agentId,
         sourceType: "file_upload",
         sourceId: i.sourceId,
      }));

      await addToCollection(collection, {
         documents,
         ids,
         metadatas,
      });

      return { count: items.length };
   } catch (error) {
      console.error("Error saving chunks to Chroma:", error);
      throw error;
   }
}
