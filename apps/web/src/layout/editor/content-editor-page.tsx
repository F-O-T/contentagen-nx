import type { ContentMeta } from "@packages/database/schemas/content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { Feature, useFeatureAccess } from "@/hooks/use-feature-access";
import { client, orpc } from "@/integrations/orpc/client";
import { EditorLayout } from "./editor-layout";
import { createEditStreamFn, createFIMStreamFn } from "./hooks/use-fim-stream";

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
   const params = useParams({ strict: false });
   const slug = params.slug as string;
   const navigate = useNavigate();
   const queryClient = useQueryClient();

   // Feature access based on subscription plan
   const { hasFeature } = useFeatureAccess();

   // Editor features based on plan
   const editorFeatures = useMemo(
      () => ({
         fim: hasFeature(Feature.FIM),
         edit: hasFeature(Feature.QUICK_EDIT),
         spelling: hasFeature(Feature.CONTENT_ANALYSIS),
         diagnostics: hasFeature(Feature.CONTENT_ANALYSIS),
      }),
      [hasFeature],
   );

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
   const updateMutation = useMutation({
      mutationFn: async (data: {
         body?: string;
         meta?: Partial<ContentMeta>;
      }) => {
         return client.content.update({ id: contentId, data });
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: ["content", "getById", contentId],
         });
      },
   });

   // Publish mutation
   const publishMutation = useMutation({
      mutationFn: async () => {
         return client.content.publish({ id: contentId });
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["content"] });
      },
   });

   // Archive mutation
   const archiveMutation = useMutation({
      mutationFn: async () => {
         return client.content.archive({ id: contentId });
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["content"] });
      },
   });

   // Delete mutation
   const deleteMutation = useMutation({
      mutationFn: async () => {
         return client.content.remove({ id: contentId });
      },
      onSuccess: () => {
         navigate({ to: `/${slug}/content` });
      },
   });

   // Handlers
   const handleSave = async (data: {
      body?: string;
      meta?: Partial<ContentMeta>;
   }) => {
      await updateMutation.mutateAsync(data);
   };

   const handlePublish = () => {
      publishMutation.mutate();
   };

   const handleArchive = () => {
      archiveMutation.mutate();
   };

   const handleDelete = () => {
      if (window.confirm("Tem certeza que deseja excluir este conteudo?")) {
         deleteMutation.mutate();
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
