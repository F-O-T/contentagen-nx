/**
 * useToolExecutionBridge Hook
 *
 * Bridge that auto-executes tool calls on the Lexical editor.
 * Subscribes to assistant-ui thread messages and applies editor/frontmatter tools.
 */

import { useThread } from "@assistant-ui/react";
import type { LexicalEditor } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import {
   isEditorTool,
   isFrontmatterTool,
} from "@/features/content/lib/assistant-runtime-adapter";
import { executeEditorTool } from "@/features/editor";

/**
 * Tool result from content part
 */

/**
 * Callback for frontmatter updates
 */
type FrontmatterUpdateCallback = (updates: {
   title?: string;
   description?: string;
   slug?: string;
   keywords?: string[];
}) => void;

/**
 * Options for the tool execution bridge
 */
interface UseToolExecutionBridgeOptions {
   /**
    * Lexical editor instance to execute tools on
    */
   editor: LexicalEditor | null;

   /**
    * Callback for frontmatter updates
    */
   onFrontmatterUpdate?: FrontmatterUpdateCallback;

   /**
    * Whether to auto-execute tools (default: true)
    */
   autoExecute?: boolean;
}

/**
 * Creates a bridge that auto-executes tool calls on the Lexical editor.
 *
 * This hook subscribes to assistant-ui thread messages and:
 * 1. Detects completed tool calls
 * 2. Filters for editor/frontmatter tools
 * 3. Executes them on the Lexical editor or updates frontmatter
 *
 * @example
 * ```tsx
 * function EditorWithChat({ contentId }: { contentId: string }) {
 *   const editorRef = useRef<LexicalEditor | null>(null);
 *   const [meta, setMeta] = useState<ContentMeta>({});
 *
 *   // Bridge tool execution
 *   useToolExecutionBridge({
 *     editor: editorRef.current,
 *     onFrontmatterUpdate: (updates) => setMeta(prev => ({ ...prev, ...updates })),
 *   });
 *
 *   return <ContentEditor ref={editorRef} />;
 * }
 * ```
 */
export function useToolExecutionBridge(options: UseToolExecutionBridgeOptions) {
   const { editor, onFrontmatterUpdate, autoExecute = true } = options;

   // Track executed tool IDs to avoid duplicates
   const executedTools = useRef(new Set<string>());

   // Get thread messages using useThread selector
   const messages = useThread((state) => state.messages);

   /**
    * Execute an editor tool
    */
   const executeEditor = useCallback(
      (toolName: string, args: Record<string, unknown>) => {
         if (!editor) return;

         try {
            // Use the executeEditorTool from the editor feature
            // It expects a ToolCall object
            executeEditorTool(editor, {
               id: crypto.randomUUID(),
               name: toolName,
               args,
            });
         } catch (error) {
            console.error(
               `[ToolExecutionBridge] Failed to execute ${toolName}:`,
               error,
            );
         }
      },
      [editor],
   );

   /**
    * Execute a frontmatter tool
    */
   const executeFrontmatter = useCallback(
      (toolName: string, args: Record<string, unknown>) => {
         if (!onFrontmatterUpdate) return;

         const updates: Parameters<FrontmatterUpdateCallback>[0] = {};

         switch (toolName) {
            case "editTitle":
               if (typeof args.title === "string") {
                  updates.title = args.title;
               }
               break;
            case "editDescription":
               if (typeof args.description === "string") {
                  updates.description = args.description;
               }
               break;
            case "editSlug":
               if (typeof args.slug === "string") {
                  updates.slug = args.slug;
               }
               break;
            case "editKeywords":
               if (Array.isArray(args.keywords)) {
                  updates.keywords = args.keywords as string[];
               }
               break;
         }

         if (Object.keys(updates).length > 0) {
            onFrontmatterUpdate(updates);
         }
      },
      [onFrontmatterUpdate],
   );

   /**
    * Process messages and execute tools
    */
   useEffect(() => {
      if (!autoExecute) return;

      // Process all messages looking for tool results
      for (const message of messages) {
         if (message.role !== "assistant") continue;

         console.log("[ToolBridge] Processing message:", message.id);

         // Check content for tool calls
         const content = message.content;
         if (!Array.isArray(content)) continue;

         for (const part of content) {
            // Look for tool-call parts with results
            if (part.type === "tool-call") {
               const toolPart = part as {
                  toolCallId: string;
                  toolName: string;
                  args: Record<string, unknown>;
                  result?: unknown;
               };
               const { toolCallId, toolName, args, result } = toolPart;

               console.log("[ToolBridge] Tool call detected:", {
                  toolCallId,
                  toolName,
                  args,
                  hasResult: result !== undefined,
               });

               // Skip if already executed
               if (executedTools.current.has(toolCallId)) {
                  console.log("[ToolBridge] Already executed:", toolCallId);
                  continue;
               }

               // Skip if no result yet (still running)
               if (result === undefined) {
                  console.log("[ToolBridge] Waiting for result:", toolCallId);
                  continue;
               }

               // Mark as executed
               executedTools.current.add(toolCallId);

               // Execute based on tool type
               if (isEditorTool(toolName)) {
                  console.log(
                     "[ToolBridge] Executing editor tool:",
                     toolName,
                     args,
                  );
                  executeEditor(toolName, args);
               } else if (isFrontmatterTool(toolName)) {
                  console.log(
                     "[ToolBridge] Executing frontmatter tool:",
                     toolName,
                     args,
                  );
                  executeFrontmatter(toolName, args);
               }
            }
         }
      }
   }, [messages, autoExecute, executeEditor, executeFrontmatter]);

   /**
    * Clear executed tools when unmounting
    */
   useEffect(() => {
      return () => {
         executedTools.current.clear();
      };
   }, []);

   /**
    * Manual execute function for external control
    */
   const manualExecute = useCallback(
      (toolName: string, args: Record<string, unknown>) => {
         if (isEditorTool(toolName)) {
            executeEditor(toolName, args);
         } else if (isFrontmatterTool(toolName)) {
            executeFrontmatter(toolName, args);
         }
      },
      [executeEditor, executeFrontmatter],
   );

   return {
      /**
       * Manually execute a tool
       */
      execute: manualExecute,

      /**
       * Clear the executed tools cache
       */
      clearCache: () => executedTools.current.clear(),
   };
}
