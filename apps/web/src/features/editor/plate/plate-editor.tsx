'use client';

/**
 * PlateEditor — Plate.js editor component with AI and Copilot plugins.
 *
 * Runs alongside the existing Lexical editor during migration.
 * Provides rich-text editing with heading, marks, list support, AI chat
 * (mod+j), and ghost-text copilot suggestions (Tab to accept).
 */

import {
   BasicBlocksPlugin,
   BasicMarksPlugin,
} from "@platejs/basic-nodes/react";
import { LinkPlugin } from "@platejs/link/react";
import type { Value } from "platejs";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { cn } from "@packages/ui/lib/utils";

import { AIKit } from "./plugins/ai-kit";
import { CopilotKit } from "./plugins/copilot-kit";
import { useEditorAIChat } from "./hooks/use-editor-ai-chat";

export interface PlateEditorProps {
   initialValue?: Value;
   onChange?: (value: Value) => void;
   placeholder?: string;
   editable?: boolean;
   className?: string;
   /** Content-level context forwarded to the AI chat transport. */
   contentId?: string;
   writerId?: string;
   model?: string;
   language?: string;
}

export function PlateEditor({
   initialValue,
   onChange,
   placeholder = "Start writing…",
   editable = true,
   className,
   contentId,
   writerId,
   model,
   language,
}: PlateEditorProps) {
   // Inject per-content context into the ORPCChatTransport singleton so every
   // AI command carries the correct contentId / writerId / model / language.
   useEditorAIChat({ contentId, writerId, model, language });

   const editor = usePlateEditor({
      plugins: [
         BasicBlocksPlugin,
         BasicMarksPlugin,
         LinkPlugin,
         // AIPlugin + AIChatPlugin wired to oRPC aiCommandStream.
         // Includes CursorOverlayKit and MarkdownKit as dependencies.
         ...AIKit,
         // CopilotPlugin with ghost-text suggestions via oRPC copilotStream.
         // Includes MarkdownKit as a dependency (de-duped by Plate).
         ...CopilotKit,
      ],
      value: initialValue,
   });

   return (
      <Plate
         editor={editor}
         onValueChange={onChange ? ({ value }) => onChange(value) : undefined}
         readOnly={!editable}
      >
         <PlateContent
            className={cn(
               "min-h-[200px] w-full cursor-text rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background",
               "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
               "prose prose-sm max-w-none dark:prose-invert",
               "[&_h1]:text-3xl [&_h1]:font-bold",
               "[&_h2]:text-2xl [&_h2]:font-semibold",
               "[&_h3]:text-xl [&_h3]:font-medium",
               "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
               className,
            )}
            placeholder={placeholder}
            disableDefaultStyles
         />
      </Plate>
   );
}
