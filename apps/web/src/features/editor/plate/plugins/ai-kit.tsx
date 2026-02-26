"use client";

/**
 * AIKit — Plate.js AIChatPlugin wired to oRPC aiCommandStream.
 *
 * Extends the base ai-kit with a custom ChatTransport that calls the oRPC
 * `aiCommandStream` generator procedure directly, yielding UIMessageChunk
 * objects without going through an HTTP endpoint.
 */

import { AIMenu } from "@packages/ui/components/ai-menu";
import { AgentNetworkBar } from "@/features/editor/ui/agent-network-bar";
import {
	NETWORK_AGENT_IDS,
	completeNetworkAgent,
	resetAgentNetwork,
	startNetworkAgent,
} from "@/features/editor/stores/agent-network-store";
import { AIAnchorElement, AILeaf } from "@packages/ui/components/ai-node";
import { CursorOverlayKit } from "@packages/ui/components/editor/plugins/cursor-overlay-kit";
import { MarkdownKit } from "@packages/ui/components/editor/plugins/markdown-kit";
import { withAIBatch } from "@platejs/ai";
import {
   AIChatPlugin,
   AIPlugin,
   applyAISuggestions,
   streamInsertChunk,
   useChatChunk,
} from "@platejs/ai/react";
import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { getPluginType, KEYS, PathApi } from "platejs";
import { usePluginOption } from "platejs/react";
import type { ChatChunk } from "@/features/editor/schemas";
import { client } from "@/integrations/orpc/client";

// ---------------------------------------------------------------------------
// oRPC Chat Transport
// ---------------------------------------------------------------------------

/**
 * A custom AI SDK ChatTransport that calls oRPC aiCommandStream directly.
 *
 * The `sendMessages` method extracts the last user message text from `parts`,
 * sends it to the oRPC procedure, and returns a ReadableStream<UIMessageChunk>.
 *
 * oRPC generator streams are not resumable, so `reconnectToStream` returns null.
 */
export class ORPCChatTransport implements ChatTransport<UIMessage> {
   private contentId: string | undefined;
   private writerId: string | undefined;
   private model: string | undefined;
   private language: string | undefined;

   constructor(options?: {
      contentId?: string;
      writerId?: string;
      model?: string;
      language?: string;
   }) {
      this.contentId = options?.contentId;
      this.writerId = options?.writerId;
      this.model = options?.model;
      this.language = options?.language;
   }

   /** Dynamically inject per-content context (called from useEditorAIChat). */
   setContext(options: {
      contentId?: string;
      writerId?: string;
      model?: string;
      language?: string;
   }) {
      this.contentId = options.contentId;
      this.writerId = options.writerId;
      this.model = options.model;
      this.language = options.language;
   }

   async sendMessages({
      messages,
      abortSignal,
   }: Parameters<ChatTransport<UIMessage>["sendMessages"]>[0]): Promise<
      ReadableStream<UIMessageChunk>
   > {
      // Extract the last user message text from parts
      const lastUserMessage = [...messages]
         .reverse()
         .find((m) => m.role === "user");

      let prompt = "";
      if (lastUserMessage) {
         prompt = lastUserMessage.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { type: "text"; text: string }).text)
            .join("");
      }

      const contentId = this.contentId;
      const writerId = this.writerId;
      const model = this.model;
      const language = this.language;

      resetAgentNetwork();

      return new ReadableStream<UIMessageChunk>({
         async start(controller) {
            try {
               // Generate a stable message ID for this stream
               const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

               // Emit text-start to open the text part
               controller.enqueue({
                  type: "text-start",
                  id: messageId,
               } as UIMessageChunk);

               const stream = await client.agent.aiCommandStream({
                  prompt,
                  contentId,
                  writerId,
                  model,
                  language,
               });

               if (Symbol.asyncIterator in stream) {
                  for await (const chunk of stream as AsyncIterable<ChatChunk>) {
                     if (abortSignal?.aborted) break;

                     if (chunk.type === "text" && chunk.text) {
                        controller.enqueue({
                           type: "text-delta",
                           id: messageId,
                           delta: chunk.text,
                        } as UIMessageChunk);
                     } else if (
                        chunk.type === "tool_call_start" &&
                        NETWORK_AGENT_IDS.has(chunk.toolCall.name)
                     ) {
                        startNetworkAgent(chunk.toolCall.name);
                     } else if (
                        chunk.type === "tool_call_complete" &&
                        NETWORK_AGENT_IDS.has(chunk.toolName)
                     ) {
                        completeNetworkAgent(chunk.toolName);
                     }
                  }
               }

               // Emit text-end to close the text part
               controller.enqueue({
                  type: "text-end",
                  id: messageId,
               } as UIMessageChunk);
               controller.close();
            } catch (err) {
               const message =
                  err instanceof Error ? err.message : "aiCommandStream failed";
               controller.enqueue({
                  type: "error",
                  errorText: message,
               } as UIMessageChunk);
               controller.close();
            }
         },
      });
   }

   async reconnectToStream(
      _options: Parameters<ChatTransport<UIMessage>["reconnectToStream"]>[0],
   ): Promise<null> {
      // oRPC generator streams are not resumable
      return null;
   }
}

// Create a singleton transport instance. contentId can be injected when the
// Plate editor is instantiated with a specific content context by creating a
// new ORPCChatTransport({ contentId }) and passing it via chatOptions.transport.
export const orpcChatTransport = new ORPCChatTransport();

// ---------------------------------------------------------------------------
// Plugin config
// ---------------------------------------------------------------------------

export const aiChatPlugin = AIChatPlugin.extend({
   options: {
      chatOptions: {
         api: "/api/ai/command",
         body: {},
         // Inject the oRPC transport so useChat picks it up instead of
         // DefaultChatTransport pointing at a URL.
         transport: orpcChatTransport,
      },
   },
   render: {
      afterContainer: AgentNetworkBar,
      afterEditable: AIMenu,
      node: AIAnchorElement,
   },
   shortcuts: { show: { keys: "mod+j" } },
   useHooks: ({ editor, getOption }) => {
      const mode = usePluginOption(AIChatPlugin, "mode");
      const toolName = usePluginOption(AIChatPlugin, "toolName");
      useChatChunk({
         onChunk: ({ chunk, isFirst, nodes, text: content }) => {
            if (isFirst && mode === "insert") {
               editor.tf.withoutSaving(() => {
                  editor.tf.insertNodes(
                     {
                        children: [{ text: "" }],
                        type: getPluginType(editor, KEYS.aiChat),
                     },
                     {
                        at: PathApi.next(
                           editor.selection?.focus.path.slice(0, 1) ?? [],
                        ),
                     },
                  );
               });
               editor.setOption(AIChatPlugin, "streaming", true);
            }

            if (mode === "insert" && nodes.length > 0) {
               withAIBatch(
                  editor,
                  () => {
                     if (!getOption("streaming")) return;
                     editor.tf.withScrolling(() => {
                        streamInsertChunk(editor, chunk, {
                           textProps: {
                              [getPluginType(editor, KEYS.ai)]: true,
                           },
                        });
                     });
                  },
                  { split: isFirst },
               );
            }

            if (toolName === "edit" && mode === "chat") {
               withAIBatch(
                  editor,
                  () => {
                     applyAISuggestions(editor, content);
                  },
                  {
                     split: isFirst,
                  },
               );
            }
         },
         onFinish: () => {
            editor.setOption(AIChatPlugin, "streaming", false);
            editor.setOption(AIChatPlugin, "_blockChunks", "");
            editor.setOption(AIChatPlugin, "_blockPath", null);
            editor.setOption(AIChatPlugin, "_mdxName", null);
         },
      });
   },
});

export const AIKit = [
   ...CursorOverlayKit,
   ...MarkdownKit,
   AIPlugin.withComponent(AILeaf),
   aiChatPlugin,
];
