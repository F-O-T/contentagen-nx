import { runAnalyzeContent } from "./generate-content-metadata";
import { runSaveContent } from "./save-content";
import { emitContentStatusChanged } from "@packages/server-events";
import { removeTitleFromMarkdown } from "@packages/helpers/text";
import type { ContentRequest } from "@packages/database/schema";

export async function runContentPostProcessing(payload: {
  agentId: string;
  contentId: string;
  userId: string;
  content: string;
  keywords: string[];
  sources: string[];
  contentRequest: ContentRequest;
}) {
  const { agentId, contentId, userId, content, keywords, sources, contentRequest } = payload;
  try {
    console.info("[ContentPostProcessing] START: Analyzing content metadata", {
      agentId,
      contentId,
    });
    const contentMetadata = await runAnalyzeContent({
      content,
      userId,
      keywords,
      sources,
    });
    console.info("[ContentPostProcessing] END: Analyzing content metadata", {
      agentId,
      contentId,
      hasMetadata: !!(contentMetadata?.meta && contentMetadata?.stats),
    });
    if (!contentMetadata?.meta || !contentMetadata?.stats) {
      console.error(
        "[ContentPostProcessing] ERROR: Failed to analyze content metadata",
        { agentId, contentId, contentMetadata },
      );
      throw new Error("Failed to analyze content metadata");
    }
    const metadata = contentMetadata;
    console.info("[ContentPostProcessing] START: Saving content", {
      agentId,
      contentId,
    });
    const saveResult = await runSaveContent({
      meta: metadata.meta,
      stats: metadata.stats,
      contentId,
      content: removeTitleFromMarkdown(content),
    });
    console.info("[ContentPostProcessing] END: Saving content", {
      agentId,
      contentId,
      saveSuccess: !!saveResult,
    });
    if (!saveResult) {
      console.error("[ContentPostProcessing] ERROR: Failed to save content", {
        agentId,
        contentId,
      });
      throw new Error("Failed to save content");
    }
    // Emit event to signal content status changed to draft
    emitContentStatusChanged({
      contentId,
      status: "draft",
    });
    return saveResult;
  } catch (error) {
    console.error("[ContentPostProcessing] PIPELINE ERROR", {
      agentId,
      contentId,
      contentRequest,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error && error.stack ? error.stack : undefined,
    });
    throw error;
  }
}

