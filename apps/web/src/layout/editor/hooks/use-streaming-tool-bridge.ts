/**
 * useStreamingToolBridge
 *
 * Improved tool execution bridge that:
 * 1. Animates text insertion char-by-char on tool_call_start
 * 2. Flashes a green highlight on tool_call_complete
 * 3. Uses non-deprecated useAuiState API
 */
import { useAuiState } from "@assistant-ui/react";
import type { LexicalEditor } from "lexical";
import { $createTextNode, $getRoot } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import {
   isEditorTool,
   isFrontmatterTool,
} from "@/features/content/lib/assistant-runtime-adapter";
import { executeEditorTool } from "@/features/editor";

const ANIMATION_CHARS_PER_TICK = 10;
const ANIMATION_INTERVAL_MS = 30;
const HIGHLIGHT_DURATION_MS = 1500;

// Tools that animate text insertion (have a `text` arg)
const STREAMING_TOOLS = new Set(["insertText", "insertHeading", "insertList"]);

interface UseStreamingToolBridgeOptions {
   editor: LexicalEditor | null;
   onFrontmatterUpdate?: (updates: {
      title?: string;
      description?: string;
      slug?: string;
      keywords?: string[];
   }) => void;
   autoExecute?: boolean;
}

export function useStreamingToolBridge({
   editor,
   onFrontmatterUpdate,
   autoExecute = true,
}: UseStreamingToolBridgeOptions) {
   const executedTools = useRef(new Set<string>());
   const animatedTools = useRef(new Set<string>()); // tracks tools currently animating
   const animationRefs = useRef(new Map<string, ReturnType<typeof setInterval>>());

   const messages = useAuiState((s) => s.thread.messages);

   const animateTextInsertion = useCallback(
      (toolCallId: string, text: string) => {
         if (!editor) return;
         if (animationRefs.current.has(toolCallId)) return;

         let charIndex = 0;

         const interval = setInterval(() => {
            const chunk = text.slice(charIndex, charIndex + ANIMATION_CHARS_PER_TICK);
            charIndex += ANIMATION_CHARS_PER_TICK;

            if (chunk) {
               editor.update(() => {
                  const root = $getRoot();
                  const lastChild = root.getLastChild();
                  if (lastChild) {
                     const textNode = $createTextNode(chunk);
                     lastChild.append(textNode);
                  }
               });
            }

            if (charIndex >= text.length) {
               clearInterval(interval);
               animationRefs.current.delete(toolCallId);
            }
         }, ANIMATION_INTERVAL_MS);

         animationRefs.current.set(toolCallId, interval);
      },
      [editor],
   );

   const flashHighlight = useCallback(() => {
      if (!editor) return;
      let nodeKey: string | null = null;
      editor.read(() => {
         const root = $getRoot();
         const lastChild = root.getLastChild();
         if (lastChild) {
            nodeKey = lastChild.getKey();
         }
      });
      if (nodeKey) {
         const domElement = editor.getElementByKey(nodeKey);
         if (domElement) {
            domElement.classList.add("ai-inserted");
            setTimeout(() => {
               domElement.classList.remove("ai-inserted");
            }, HIGHLIGHT_DURATION_MS);
         }
      }
   }, [editor]);

   const executeFrontmatter = useCallback(
      (toolName: string, args: Record<string, unknown>) => {
         if (!onFrontmatterUpdate) return;
         const updates: {
            title?: string;
            description?: string;
            slug?: string;
            keywords?: string[];
         } = {};
         switch (toolName) {
            case "editTitle":
               if (typeof args.title === "string") updates.title = args.title;
               break;
            case "editDescription":
               if (typeof args.description === "string") updates.description = args.description;
               break;
            case "editSlug":
               if (typeof args.slug === "string") updates.slug = args.slug;
               break;
            case "editKeywords":
               if (Array.isArray(args.keywords)) updates.keywords = args.keywords as string[];
               break;
         }
         if (Object.keys(updates).length > 0) onFrontmatterUpdate(updates);
      },
      [onFrontmatterUpdate],
   );

   useEffect(() => {
      if (!autoExecute) return;

      for (const message of messages) {
         if (message.role !== "assistant") continue;
         const content = message.content;
         if (!Array.isArray(content)) continue;

         for (const part of content) {
            if (part.type !== "tool-call") continue;

            const toolPart = part as {
               toolCallId: string;
               toolName: string;
               args: Record<string, unknown>;
               result?: unknown;
            };
            const { toolCallId, toolName, args, result } = toolPart;

            // Skip already fully executed tools
            if (executedTools.current.has(toolCallId)) continue;

            // Streaming animation: start on tool_call_start (result undefined = still running)
            if (
               result === undefined &&
               !animatedTools.current.has(toolCallId) &&
               STREAMING_TOOLS.has(toolName) &&
               isEditorTool(toolName) &&
               typeof args.text === "string"
            ) {
               animatedTools.current.add(toolCallId);
               animateTextInsertion(toolCallId, args.text);
               continue;
            }

            if (result === undefined) continue;

            // Stop any running animation for this tool
            const runningInterval = animationRefs.current.get(toolCallId);
            if (runningInterval) {
               clearInterval(runningInterval);
               animationRefs.current.delete(toolCallId);
            }

            executedTools.current.add(toolCallId);

            if (isEditorTool(toolName) && editor) {
               // Non-streaming tools: execute via executeEditorTool
               if (!STREAMING_TOOLS.has(toolName)) {
                  executeEditorTool(editor, { id: toolCallId, name: toolName, args });
               }
               flashHighlight();
            } else if (isFrontmatterTool(toolName)) {
               executeFrontmatter(toolName, args);
            }
         }
      }
   }, [messages, autoExecute, editor, animateTextInsertion, flashHighlight, executeFrontmatter]);

   useEffect(() => {
      return () => {
         for (const interval of animationRefs.current.values()) {
            clearInterval(interval);
         }
         executedTools.current.clear();
         animatedTools.current.clear();
      };
   }, []);
}
