"use client";

/**
 * PlateEditor — Plate.js editor component with AI, Copilot, Comment,
 * Suggestion, and Discussion plugins.
 *
 * Runs alongside the existing Lexical editor during migration.
 * Provides rich-text editing with heading, marks, list support, AI chat
 * (mod+j), ghost-text copilot suggestions (Tab to accept), inline comments
 * (mod+shift+m), tracked suggestions, and persistent discussion threads.
 */

import type { ContentMeta } from "@packages/database/schemas/content";
import { CommentKit } from "@packages/ui/components/editor/plugins/comment-kit";
import {
   type DiscussionCallbacks,
   DiscussionKit,
   type DiscussionUser,
   discussionPlugin,
   type TDiscussion,
} from "@packages/ui/components/editor/plugins/discussion-kit";
import { SuggestionKit } from "@packages/ui/components/editor/plugins/suggestion-kit";
import { cn } from "@packages/ui/lib/utils";
import {
   BasicBlocksPlugin,
   BasicMarksPlugin,
} from "@platejs/basic-nodes/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Value } from "platejs";
import {
   Plate,
   PlateContent,
   useEditorRef,
   usePlateEditor,
} from "platejs/react";
import { useEffect, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { orpc } from "@/integrations/orpc/client";
import { useEditorDiscussions } from "../hooks/use-editor-discussions";
import { EditorFixedToolbar } from "../ui/editor-fixed-toolbar";
import { FrontmatterSection } from "../ui/frontmatter-section";
import { useEditorAIChat } from "./hooks/use-editor-ai-chat";
import { useEditorUploadFile } from "./hooks/use-editor-upload-file";
import { AIKit } from "./plugins/ai-kit";
import { BlockMenuKit } from "./plugins/block-menu-kit";
import { CopilotKit } from "./plugins/copilot-kit";
import { DndKit } from "./plugins/dnd-kit";
import { LinkKit } from "./plugins/link-kit";
import { createMediaKit, UploadFileProvider } from "./plugins/media-kit";
import { SlashKit } from "./plugins/slash-kit";
import { TocKit } from "./plugins/toc-kit";
import { InternalLinksSidebar } from "./ui/internal-links-sidebar";

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
   // NEW: frontmatter
   meta?: ContentMeta;
   onMetaChange?: (meta: ContentMeta) => void;
   // NEW: toolbar
   status?: string;
   isSaving?: boolean;
   onSave?: () => void;
   onBack?: () => void;
   onStatusChange?: (status: "draft" | "published" | "archived") => void;
   onToggleSidebar?: () => void;
   // NEW: sidebar
   showLinksSidebar?: boolean;
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
   const mappedUsers = useMemo(() => {
      const result: Record<string, DiscussionUser> = {};
      for (const [id, u] of Object.entries(
         users as Record<
            string,
            { id: string; name: string; email: string; image: string }
         >,
      )) {
         result[id] = {
            id: u.id,
            name: u.name,
            avatarUrl:
               u.image ?? `https://api.dicebear.com/9.x/glass/svg?seed=${u.id}`,
         };
      }
      return result;
   }, [users]);

   // Build persistence callbacks that delegate to oRPC mutations
   const callbacks: DiscussionCallbacks = useMemo(() => ({
      onCreateDiscussion: async (discussion: TDiscussion) => {
         const firstComment = discussion.comments[0];
         if (!firstComment || !contentId) return;
         await mutations.create.mutateAsync({
            contentId,
            blockId: discussion.id,
            contentRich: firstComment.contentRich as Array<
               Record<string, unknown>
            >,
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
   }), [contentId, mutations.create, mutations.addReply, mutations.resolve, mutations.remove, mutations.updateReply, mutations.removeReply]);

   // Sync currentUserId into discussionPlugin
   useEffect(() => {
      editor.setOption(discussionPlugin, "currentUserId", currentUserId);
   }, [editor, currentUserId]);

   // Sync discussions into discussionPlugin
   useEffect(() => {
      editor.setOption(
         discussionPlugin,
         "discussions",
         discussions as TDiscussion[],
      );
   }, [editor, discussions]);

   // Sync users into discussionPlugin
   useEffect(() => {
      editor.setOption(discussionPlugin, "users", mappedUsers);
   }, [editor, mappedUsers]);

   // Sync callbacks into discussionPlugin (stable reference per render is fine —
   // the callbacks close over mutation functions which are stable across renders)
   useEffect(() => {
      editor.setOption(discussionPlugin, "callbacks", callbacks);
   }, [editor, callbacks]);

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
   meta,
   onMetaChange,
   status,
   isSaving,
   onSave,
   onBack,
   onStatusChange,
   onToggleSidebar,
   showLinksSidebar,
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
         ...LinkKit,
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
         ...DndKit,
         ...BlockMenuKit,
         ...SlashKit,
         ...TocKit,
      ],
      value: initialValue,
   });

   return (
      // UploadFileProvider makes the uploadFile fn available to
      // MediaPlaceholderElement without prop drilling.
      <UploadFileProvider value={uploadFile}>
         <DndProvider backend={HTML5Backend}>
            <Plate
               editor={editor}
               onValueChange={
                  onChange ? ({ value }) => onChange(value) : undefined
               }
               readOnly={!editable}
            >
               {/*
                * EditorDiscussionSync renders inside <Plate> so it can call useEditorRef().
                * It uses useSuspenseQuery internally; the parent route already wraps
                * EditorPage in <Suspense>, so no additional boundary is needed here.
                */}
               <EditorDiscussionSync contentId={contentId} />

               {/* Fixed toolbar — INSIDE <Plate> so useEditorRef() works */}
               <EditorFixedToolbar
                  isSaving={isSaving}
                  onBack={onBack}
                  onSave={onSave}
                  onStatusChange={onStatusChange}
                  onToggleSidebar={onToggleSidebar}
                  showSidebar={showLinksSidebar}
                  status={
                     status as "draft" | "published" | "archived" | undefined
                  }
               />

               {/* Frontmatter section */}
               {meta !== undefined && onMetaChange !== undefined && (
                  <FrontmatterSection
                     meta={meta}
                     onChange={onMetaChange}
                     readOnly={!editable}
                  />
               )}

               {/* Content area + optional sidebar */}
               <div className="flex flex-1 overflow-hidden">
                  <div className="flex-1 overflow-auto">
                     <PlateContent
                        className={cn(
                           "min-h-[calc(100vh-8rem)] max-w-3xl mx-auto px-6 py-8",
                           "text-sm ring-offset-background focus-visible:outline-none",
                           "prose prose-sm max-w-none dark:prose-invert",
                           "[&_h1]:text-3xl [&_h1]:font-bold",
                           "[&_h2]:text-2xl [&_h2]:font-semibold",
                           "[&_h3]:text-xl [&_h3]:font-medium",
                           "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
                           className,
                        )}
                        disableDefaultStyles
                        placeholder={placeholder}
                     />
                  </div>

                  {showLinksSidebar && contentId && (
                     <InternalLinksSidebar
                        contentId={contentId}
                        onClose={onToggleSidebar}
                     />
                  )}
               </div>
            </Plate>
         </DndProvider>
      </UploadFileProvider>
   );
}
