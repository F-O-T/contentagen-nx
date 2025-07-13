import { Elysia, t } from "elysia";
import { extractBrandKnowledgeFromWebsite } from "../modules/RAG/rag-service";

export const agentBrandWebsiteRoutes = new Elysia().post(
   "/brand-website",
   async ({ body, set }) => {
      const { url, agentId } = body;
      if (!url || !agentId) {
         set.status = 400;
         return { error: "Missing url or agentId" };
      }
      try {
         await extractBrandKnowledgeFromWebsite(agentId, url);
         return { success: true };
      } catch (err) {
         set.status = 500;
         return { error: "Extraction failed", details: String(err) };
      }
   },
   {
      body: t.Object({ url: t.String(), agentId: t.String() }),
   },
);
