"use client";

/**
 * useEditorAIChat — injects per-content context into the ORPCChatTransport singleton.
 *
 * The AIChatPlugin uses a module-level ORPCChatTransport singleton whose
 * `sendMessages` method reads `contentId`, `writerId`, `model`, and `language`
 * at call time. This hook calls `setContext()` whenever those values change so
 * every AI command issued from the editor carries the correct context.
 *
 * Must be called inside a component that is rendered within the Plate editor
 * context (i.e. a descendant of <Plate>).
 */

import { useEffect } from "react";

import { orpcChatTransport } from "../plugins/ai-kit";

export interface EditorAIChatOptions {
   contentId?: string;
   writerId?: string;
   model?: string;
   language?: string;
}

export function useEditorAIChat(options: EditorAIChatOptions) {
   const { contentId, writerId, model, language } = options;

   useEffect(() => {
      orpcChatTransport.setContext({ contentId, writerId, model, language });
   }, [contentId, writerId, model, language]);
}
