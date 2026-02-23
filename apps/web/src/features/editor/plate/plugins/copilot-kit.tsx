"use client";

/**
 * CopilotKit — Plate.js CopilotPlugin wired to oRPC copilotStream.
 *
 * Overrides the default `api` URL fetch with a custom fetch that calls the
 * oRPC `copilotStream` generator procedure and returns the accumulated text
 * in the format expected by `callCompletionApi` ({ text: string }).
 */

import { MarkdownKit } from "@packages/ui/components/editor/plugins/markdown-kit";
import { GhostText } from "@packages/ui/components/ghost-text";
import { CopilotPlugin } from "@platejs/ai/react";
import { serializeMd, stripMarkdown } from "@platejs/markdown";
import type { TElement } from "platejs";
import type { FIMChunk } from "@/features/editor/schemas";
import { client } from "@/integrations/orpc/client";

/**
 * Custom fetch for CopilotPlugin that calls oRPC copilotStream.
 *
 * `callCompletionApi` (inside Plate.js) calls this fetch with the prompt in
 * the POST body, then expects the response to be JSON: { text: string }.
 * We call the oRPC generator, accumulate all text chunks, and return that JSON.
 */
const copilotFetch = async (
   _input: RequestInfo | URL,
   init?: RequestInit,
): Promise<Response> => {
   let prefix = "";
   let suffix: string | undefined;

   try {
      const body = JSON.parse((init?.body as string) ?? "{}");
      // CopilotPlugin sends { prompt } where prompt is the serialized block text
      prefix = body.prompt ?? "";
      suffix = body.suffix;
   } catch {
      // ignore parse errors — prefix stays empty
   }

   try {
      const stream = await client.agent.copilotStream({ prefix, suffix });

      let accumulated = "";

      if (Symbol.asyncIterator in stream) {
         for await (const chunk of stream as AsyncIterable<FIMChunk>) {
            if (!chunk.done && chunk.text) {
               accumulated += chunk.text;
            }
         }
      }

      return new Response(JSON.stringify({ text: accumulated }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
      });
   } catch (err) {
      const message =
         err instanceof Error ? err.message : "copilotStream failed";
      return new Response(message, { status: 500 });
   }
};

export const CopilotKit = [
   ...MarkdownKit,
   CopilotPlugin.configure(({ api }) => ({
      options: {
         completeOptions: {
            api: "/api/ai/copilot",
            fetch: copilotFetch,
            body: {},
            onError: () => {
               // Silently fail — the real errors surface via the oRPC stream
            },
            onFinish: (_prompt, completion) => {
               if (completion === "0" || !completion) return;

               api.copilot.setBlockSuggestion({
                  text: stripMarkdown(completion),
               });
            },
         },
         debounceDelay: 500,
         renderGhostText: GhostText,
         getPrompt: ({ editor }) => {
            const contextEntry = editor.api.block({ highest: true });

            if (!contextEntry) return "";

            const prompt = serializeMd(editor, {
               value: [contextEntry[0] as TElement],
            });

            return `Continue the text up to the next punctuation mark:
"""
${prompt}
"""`;
         },
      },
      shortcuts: {
         accept: {
            keys: "tab",
         },
         acceptNextWord: {
            keys: "mod+right",
         },
         reject: {
            keys: "escape",
         },
         triggerSuggestion: {
            keys: "ctrl+space",
         },
      },
   })),
];
