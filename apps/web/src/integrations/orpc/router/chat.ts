import { getChatSessionWithMessages } from "@packages/database/repositories/chat-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * Get chat history for a content document
 * Returns chat session with messages converted to assistant-ui format
 */
export const getChatHistory = protectedProcedure
   .input(
      z.object({
         contentId: z.string().uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      // Get session with messages from database
      const session = await getChatSessionWithMessages(
         db,
         input.contentId,
         organizationId,
      );

      if (!session) {
         return {
            sessionId: null,
            messages: [],
         };
      }

      // Convert database messages to assistant-ui ThreadMessage format
      const messages = session.messages.map((msg) => {
         if (msg.role === "user") {
            return {
               id: msg.id,
               role: "user" as const,
               content: [
                  {
                     type: "text" as const,
                     text: msg.content,
                  },
               ],
               createdAt: msg.createdAt,
            };
         }

         // Assistant message with potential tool calls
         const contentParts: Array<
            | { type: "text"; text: string }
            | {
                 type: "tool-call";
                 toolCallId: string;
                 toolName: string;
                 args: Record<string, unknown>;
                 result?: unknown;
              }
         > = [];

         // Add text content if present
         if (msg.content) {
            contentParts.push({
               type: "text" as const,
               text: msg.content,
            });
         }

         // Add tool calls if present
         if (msg.toolCalls && msg.toolCalls.length > 0) {
            for (const toolCall of msg.toolCalls) {
               contentParts.push({
                  type: "tool-call" as const,
                  toolCallId: toolCall.id,
                  toolName: toolCall.name,
                  args: toolCall.args,
                  result: toolCall.result,
               });
            }
         }

         return {
            id: msg.id,
            role: "assistant" as const,
            content: contentParts,
            createdAt: msg.createdAt,
         };
      });

      return {
         sessionId: session.id,
         messages,
      };
   });
