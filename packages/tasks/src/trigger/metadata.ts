import { task, logger } from "@trigger.dev/sdk/v3";
import {
   getContentById,
   updateContent,
} from "@packages/database/repositories/content-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

// This task generates metadata for a content item
export async function runMetadataGeneration(payload: { contentId: string }) {
   const { contentId } = payload;
   logger.info("Starting metadata generation", { contentId });
   try {
      // Fetch the content
      const content = await getContentById(db, contentId);
      if (!content) throw new Error("Content not found");

      // Generate metadata (example: SEO title, description, tags)
      const prompt = `Generate SEO metadata for the following content:\n${content.body}`;
      const result = await generateOpenRouterText(openrouter, { prompt });

      // Example: parse result (assume result.text is JSON with metadata)
      let meta;
      try {
         meta = JSON.parse(result.text);
      } catch (e) {
         logger.error("Failed to parse metadata JSON", {
            error: e,
            text: result.text,
         });
         throw new Error("Metadata generation failed: invalid format");
      }

      // Update content with meta
      await updateContent(db, contentId, { meta });
      logger.info("Metadata generation complete", { contentId, meta });
      return { success: true, meta };
   } catch (error) {
      logger.error("Error in metadata generation", { error, contentId });
      throw error;
   }
}

export const metadataGenerationTask = task({
   id: "content-metadata-generation",
   run: runMetadataGeneration,
});
