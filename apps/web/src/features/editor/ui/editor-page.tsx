"use client";

import type { ContentMeta } from "@packages/database/schemas/content";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { Value } from "platejs";
import { useCallback, useRef, useState } from "react";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import { EditorMetaPanel } from "./editor-meta-panel";
import { orpc } from "@/integrations/orpc/client";
import { PlateEditor } from "../plate/plate-editor";
import { EditorContextPanelTabs } from "../plate/ui/editor-context-panel-tabs";


type ContentStatus = "draft" | "published" | "archived";

interface EditorPageProps {
   contentId: string;
}

export function EditorPage({ contentId }: EditorPageProps) {
   const { data: content } = useSuspenseQuery(
      orpc.content.getById.queryOptions({ input: { id: contentId } }),
   );

   const [meta, setMeta] = useState<ContentMeta>(
      () => content.meta ?? { title: "", description: "", slug: "" },
   );
   const [isSaving, setIsSaving] = useState(false);

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

   const handleMetaSave = useCallback(
      async (values: ContentMeta) => {
         setMeta(values);
         await updateMutation.mutateAsync({
            id: contentId,
            data: { meta: values, body: JSON.stringify(editorValueRef.current) },
         });
      },
      [contentId, updateMutation],
   );

   useContextPanelInfo(<EditorMetaPanel meta={meta} onSave={handleMetaSave} />);

   return (
      <div className="flex h-full flex-col">
         <EditorContextPanelTabs contentId={contentId} />
         <PlateEditor
            contentId={contentId}
            editable={content.status !== "archived"}
            initialValue={
               content?.body ? (JSON.parse(content.body) as Value) : undefined
            }
            isSaving={isSaving}
            key={contentId}
            onChange={(value) => {
               editorValueRef.current = value;
            }}
            onSave={handleSave}
            onStatusChange={handleStatusChange}
            status={content.status as ContentStatus}
            teamId={content.teamId ?? undefined}
            writerId={content.writerId ?? undefined}
         />
      </div>
   );
}
