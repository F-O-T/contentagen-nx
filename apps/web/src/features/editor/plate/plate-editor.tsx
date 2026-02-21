'use client';

/**
 * PlateEditor — Plate.js editor component with AI, Copilot, Comment,
 * Suggestion, and Discussion plugins.
 *
 * Runs alongside the existing Lexical editor during migration.
 * Provides rich-text editing with heading, marks, list support, AI chat
 * (mod+j), ghost-text copilot suggestions (Tab to accept), inline comments
 * (mod+shift+m), tracked suggestions, and persistent discussion threads.
 */

import {
   BasicBlocksPlugin,
   BasicMarksPlugin,
} from "@platejs/basic-nodes/react";
import { LinkPlugin } from "@platejs/link/react";
import type { Value } from "platejs";
import { Plate, PlateContent, useEditorRef, usePlateEditor } from "platejs/react";
import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@packages/ui/lib/utils";
import { CommentKit } from "@packages/ui/components/editor/plugins/comment-kit";
import { SuggestionKit } from "@packages/ui/components/editor/plugins/suggestion-kit";
import {
   DiscussionKit,
   discussionPlugin,
   type DiscussionCallbacks,
   type TDiscussion,
   type DiscussionUser,
} from "@packages/ui/components/editor/plugins/discussion-kit";

import { AIKit } from "./plugins/ai-kit";
import { CopilotKit } from "./plugins/copilot-kit";
import { createMediaKit, UploadFileProvider } from "./plugins/media-kit";
import { useEditorAIChat } from "./hooks/use-editor-ai-chat";
import { useEditorUploadFile } from "./hooks/use-editor-upload-file";
import { useEditorDiscussions } from "../hooks/use-editor-discussions";
import { orpc } from "@/integrations/orpc/client";

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
   /** Team ID used to scope uploaded media assets. */
   teamId?: string;
}

// ---------------------------------------------------------------------------
// EditorDiscussionSync — syncs server data into discussionPlugin options.
//
// This component renders inside <Plate> so it has access to useEditorRef().
// It calls useSuspenseQuery (via useEditorDiscussions) — this is safe because
// the parent route already wraps EditorPage in <Suspense>.
// ---------------------------------------------------------------------------

interface EditorDiscussionSyncProps {
   contentId?: string;
}

function EditorDiscussionSync({ contentId }: EditorDiscussionSyncProps) {
   const editor = useEditorRef();

   // Fetch current user session for the currentUserId
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );
   const currentUserId = session?.user?.id ?? "";

   // Fetch discussions and mutations for this content
   const { discussions, users, mutations } = useEditorDiscussions(contentId);

   // Map server users to DiscussionUser shape (server returns `image`, plugin expects `avatarUrl`)
   const mappedUsers: Record<string, DiscussionUser> = {};
   for (const [id, u] of Object.entries(users as Record<string, { id: string; name: string; email: string; image: string }>)) {
      mappedUsers[id] = {
         id: u.id,
         name: u.name,
         avatarUrl: u.image ?? `https://api.dicebear.com/9.x/glass/svg?seed=${u.id}`,
      };
   }

   // Build persistence callbacks that delegate to oRPC mutations
   const callbacks: DiscussionCallbacks = {
      onCreateDiscussion: async (discussion: TDiscussion) => {
         const firstComment = discussion.comments[0];
         if (!firstComment || !contentId) return;
         await mutations.create.mutateAsync({
            contentId,
            blockId: discussion.id,
            contentRich: firstComment.contentRich as Array<Record<string, unknown>>,
            documentContent: discussion.documentContent,
         });
      },
      onAddReply: async (discussionId: string, reply) => {
         await mutations.addReply.mutateAsync({
            discussionId,
            contentRich: reply.contentRich as Array<Record<string, unknown>>,
         });
      },
      onResolveDiscussion: async (discussionId: string) => {
         await mutations.resolve.mutateAsync({ discussionId });
      },
      onRemoveDiscussion: async (discussionId: string) => {
         await mutations.remove.mutateAsync({ discussionId });
      },
      onUpdateComment: async (commentId: string, contentRich: Value) => {
         await mutations.updateReply.mutateAsync({
            replyId: commentId,
            contentRich: contentRich as Array<Record<string, unknown>>,
         });
      },
      onDeleteComment: async (commentId: string, _discussionId: string) => {
         await mutations.removeReply.mutateAsync({ replyId: commentId });
      },
   };

   // Sync currentUserId into discussionPlugin
   useEffect(() => {
      editor.setOption(discussionPlugin, "currentUserId", currentUserId);
   }, [editor, currentUserId]);

   // Sync discussions into discussionPlugin
   useEffect(() => {
      editor.setOption(discussionPlugin, "discussions", discussions as TDiscussion[]);
   }, [editor, discussions]);

   // Sync users into discussionPlugin
   useEffect(() => {
      editor.setOption(discussionPlugin, "users", mappedUsers);
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [editor, users]);

   // Sync callbacks into discussionPlugin (stable reference per render is fine —
   // the callbacks close over mutation functions which are stable across renders)
   useEffect(() => {
      editor.setOption(discussionPlugin, "callbacks", callbacks);
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [editor, contentId]);

   return null;
}

// ---------------------------------------------------------------------------
// PlateEditor — main exported component
// ---------------------------------------------------------------------------

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
   teamId,
}: PlateEditorProps) {
   // Inject per-content context into the ORPCChatTransport singleton so every
   // AI command carries the correct contentId / writerId / model / language.
   useEditorAIChat({ contentId, writerId, model, language });

   // Build the upload function once — stable across re-renders via useCallback.
   const uploadFile = useEditorUploadFile({ teamId });

   // Build the MediaKit plugin array — createMediaKit is pure (no hooks) so it
   // is safe to call here inside usePlateEditor via the plugins array.
   const MediaKit = createMediaKit(uploadFile);

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
         // Comment plugin — inline text comments with mod+shift+m shortcut.
         ...CommentKit,
         // Suggestion plugin — tracked changes / accept-reject workflow.
         ...SuggestionKit,
         // Discussion plugin — persistent threaded discussions per block.
         ...DiscussionKit,
         // Media plugin — image / video / audio / file upload via MinIO.
         ...MediaKit,
      ],
      value: initialValue,
   });

   return (
      // UploadFileProvider makes the uploadFile fn available to
      // MediaPlaceholderElement without prop drilling.
      <UploadFileProvider value={uploadFile}>
         <Plate
            editor={editor}
            onValueChange={onChange ? ({ value }) => onChange(value) : undefined}
            readOnly={!editable}
         >
            {/*
             * EditorDiscussionSync renders inside <Plate> so it can call useEditorRef().
             * It uses useSuspenseQuery internally; the parent route already wraps
             * EditorPage in <Suspense>, so no additional boundary is needed here.
             */}
            <EditorDiscussionSync contentId={contentId} />

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
      </UploadFileProvider>
   );
}
