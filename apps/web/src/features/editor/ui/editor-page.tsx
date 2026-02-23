"use client";

import type { ContentMeta } from "@packages/database/schemas/content";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { Value } from "platejs";
import { useCallback, useRef, useState } from "react";
import { orpc } from "@/integrations/orpc/client";
import { PlateEditor } from "../plate/plate-editor";

type ContentStatus = "draft" | "published" | "archived";

interface EditorPageProps {
   contentId: string;
}

export function EditorPage({ contentId }: EditorPageProps) {
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const navigate = useNavigate();

   const { data: content } = useSuspenseQuery(
      orpc.content.getById.queryOptions({ input: { id: contentId } }),
   );

   const [meta, setMeta] = useState<ContentMeta>(
      () => content.meta ?? { title: "", description: "", slug: "" },
   );
   const [isSaving, setIsSaving] = useState(false);
   const [showSidebar, setShowSidebar] = useState(true);

   const editorValueRef = useRef<Value | undefined>(undefined);

   const updateMutation = useMutation(orpc.content.update.mutationOptions({}));
   const publishMutation = useMutation(
      orpc.content.publish.mutationOptions({}),
   );
   const archiveMutation = useMutation(
      orpc.content.archive.mutationOptions({}),
   );
   const moveToDraftMutation = useMutation(
      orpc.content.moveToDraft.mutationOptions({}),
   );

   const handleSave = useCallback(async () => {
      setIsSaving(true);
      try {
         await updateMutation.mutateAsync({
            id: contentId,
            data: { meta, body: JSON.stringify(editorValueRef.current) },
         });
      } finally {
         setIsSaving(false);
      }
   }, [contentId, meta, updateMutation]);

   const handleStatusChange = useCallback(
      async (newStatus: ContentStatus) => {
         if (newStatus === "published") {
            await publishMutation.mutateAsync({ id: contentId });
         } else if (newStatus === "archived") {
            await archiveMutation.mutateAsync({ id: contentId });
         } else {
            await moveToDraftMutation.mutateAsync({ id: contentId });
         }
      },
      [contentId, publishMutation, archiveMutation, moveToDraftMutation],
   );

   const handleBack = useCallback(() => {
      navigate({
         to: "/$slug/$teamSlug/content",
         params: { slug, teamSlug },
      });
   }, [navigate, slug, teamSlug]);

   return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
         <PlateEditor
            contentId={contentId}
            editable={content.status !== "archived"}
            initialValue={content?.body as Value}
            isSaving={isSaving}
            key={contentId}
            meta={meta}
            onBack={handleBack}
            onChange={(value) => {
               editorValueRef.current = value;
            }}
            onMetaChange={setMeta}
            onSave={handleSave}
            onStatusChange={handleStatusChange}
            onToggleSidebar={() => setShowSidebar((v) => !v)}
            showLinksSidebar={showSidebar}
            status={content.status as ContentStatus}
            teamId={content.teamId ?? undefined}
            writerId={content.writerId ?? undefined}
         />
      </div>
   );
}
