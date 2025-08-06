import { task, logger } from "@trigger.dev/sdk/v3";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { documentIntelligencePrompt } from "@packages/prompts/prompt/brand/document-intelligence";

const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

async function runCreateBrandDocument(payload: { rawText: string }) {
  const { rawText } = payload;
  try {
    const model: { model: "small"; reasoning: "high" } = {
      model: "small",
      reasoning: "high",
    };
    const promptConfig = {
      system: documentIntelligencePrompt(),
      prompt: rawText,
    };
    logger.info("Starting content generation", {
      inputLength: rawText.length,
      model,
      promptPreview: rawText.slice(0, 120),
    });
    const result = await generateOpenRouterText(
      openrouter,
      model,
      promptConfig,
    );
    logger.info("Content generated", {
      resultLength: result.text.length,
      model,
      inputLength: rawText.length,
      promptPreview: rawText.slice(0, 120),
    });
    if (!result.text || result.text.trim() === "") {
      logger.warn("Generated content is empty", {
        model,
        inputLength: rawText.length,
        promptPreview: rawText.slice(0, 120),
      });
      throw new Error("Generated content is empty");
    }
    return { content: result.text.trim() };
  } catch (error) {
    logger.error("Error in generate content task", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      model: { model: "small", reasoning: "high" },
      inputLength: payload.rawText.length,
      promptPreview: payload.rawText.slice(0, 120),
    });
    throw error;
  }
}

export const createBrandDocumentTask = task({
  id: "create-brand-document-job",
  run: runCreateBrandDocument,
});
