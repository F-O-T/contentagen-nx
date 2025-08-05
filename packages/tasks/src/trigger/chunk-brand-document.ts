import { task, logger } from "@trigger.dev/sdk/v3";
import { brandDocumentChunkingPrompt } from "@packages/prompts/prompt/text/document-chunking";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
async function runChunkBrandDocument(payload: { inputText: string }) {
  const { inputText } = payload;
  try {
    logger.info("Chunking input text", { inputLength: inputText.length });
    const chunkingResult = await generateOpenRouterText(
      openrouter,
      {
        model: "small",
      },
      {
        system: brandDocumentChunkingPrompt(),
        prompt: inputText,
      },
    );
    const chunks = chunkingResult.text
      .split(/---DOCUMENT /)
      .map((c) => c.trim())
      .filter(Boolean);
    logger.info("Chunking complete", {
      chunkCount: chunks.length,
      chunksPreview: chunks,
    });
    return {
      chunks,
    };
  } catch (error) {
    logger.error("Error in text chunking task", {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

export const chunkBrandDocumentTask = task({
  id: "chunk-brand-document-job",
  run: runChunkBrandDocument,
});
