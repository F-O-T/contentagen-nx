import type { ContentMeta } from "@packages/database/schemas/content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { orpc } from "@/integrations/orpc/client";
import { createEditStreamFn, createFIMStreamFn } from "../hooks/use-fim-stream";
import { EditorLayout } from "./editor-layout";

// ============================================================================
// Main Component
// ============================================================================

interface ContentEditorPageProps {
   contentId: string;
   isStandalone?: boolean;
}

export function ContentEditorPage({
   contentId,
   isStandalone = false,
}: ContentEditorPageProps) {
   const params = useParams({ strict: false }) as {
      slug: string;
      teamId: string;
   };
   const slug = params.slug;
   const teamId = params.teamId;
   const navigate = useNavigate();
   const queryClient = useQueryClient();

   // All features are available to all users (limited by credit budget)
   const editorFeatures = {
      fim: true,
      edit: true,
      spelling: true,
      diagnostics: true,
   };

   // Fetch content
   const { data: content } = useQuery({
      ...orpc.content.getById.queryOptions({
         input: { id: contentId },
      }),
   });

   // Debug: Log content data
   console.log("[ContentEditorPage] Content loaded:", {
      contentId,
      hasContent: !!content,
      bodyLength: content?.body?.length ?? 0,
      body: content?.body,
   });

   // ORPC streaming functions (memoized)
   const fimStream = useMemo(() => createFIMStreamFn(), []);
   const editStream = useMemo(() => createEditStreamFn(), []);

   // Update mutation
   const updateMutation = useMutation(
      orpc.content.update.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.content.getById.queryOptions({
                  input: { id: contentId },
               }).queryKey,
            });
         },
      }),
   );

   // Publish mutation
   const publishMutation = useMutation(
      orpc.content.publish.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.content.getById.queryOptions({
                  input: { id: contentId },
               }).queryKey,
            });
         },
      }),
   );

   // Archive mutation
   const archiveMutation = useMutation(
      orpc.content.archive.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.content.getById.queryOptions({
                  input: { id: contentId },
               }).queryKey,
            });
         },
      }),
   );

   // Delete mutation
   const deleteMutation = useMutation(
      orpc.content.remove.mutationOptions({
         onSuccess: () => {
            navigate({ to: `/${slug}/${teamId}/content` });
         },
      }),
   );

   // Handlers
   const handleSave = async (data: {
      body?: string;
      meta?: Partial<ContentMeta>;
   }) => {
      await updateMutation.mutateAsync({ id: contentId, data });
   };

   const handlePublish = () => {
      publishMutation.mutate({ id: contentId });
   };

   const handleArchive = () => {
      archiveMutation.mutate({ id: contentId });
   };

   const handleDelete = () => {
      if (window.confirm("Tem certeza que deseja excluir este conteudo?")) {
         deleteMutation.mutate({ id: contentId });
      }
   };

   // Render loading state if content not loaded yet
   if (!content) {
      return null;
   }

   return (
      <EditorLayout
         content={{
            id: content.id,
            body: content.body,
            status: content.status || "draft",
            meta: content.meta,
         }}
         contentId={contentId}
         editStream={editorFeatures.edit ? editStream : undefined}
         features={editorFeatures}
         fimStream={editorFeatures.fim ? fimStream : undefined}
         isStandalone={isStandalone}
         onArchive={handleArchive}
         onDelete={handleDelete}
         onPublish={handlePublish}
         onSave={handleSave}
      />
   );
}
