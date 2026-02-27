"use client";

import type { ContentMeta } from "@packages/database/schemas/content";
import { useLiveQuery } from "@tanstack/react-db";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { Value } from "platejs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useContextPanelInfo } from "@/features/context-panel/use-context-panel";
import {
   createContentCollection,
   type ContentRow,
} from "@/features/content/collections/content-collection";
import { orpc } from "@/integrations/orpc/client";
import { PlateEditor } from "../plate/plate-editor";
import { EditorContextPanelTabs } from "../plate/ui/editor-context-panel-tabs";
import { EditorMetaPanel } from "./editor-meta-panel";
import { WriterPromptBanner } from "./writer-prompt-banner";

type ContentStatus = "draft" | "published" | "archived";

interface EditorPageProps {
   contentId: string;
   teamId: string;
}

export function EditorPage({ contentId, teamId }: EditorPageProps) {
   // Electric collection scoped to this team — memoized so it's stable across renders.
   const collection = useMemo(
      () => (teamId ? createContentCollection(teamId) : null),
      [teamId],
   );

   // Live query — updates instantly when status changes (e.g. agent publishes content).
   const { data: liveRows, isReady } = useLiveQuery(
      (q) => (collection ? q.from({ content: collection }) : null),
      [collection],
   );

   // Find this specific content row from the live collection.
   const liveContent: ContentRow | null = isReady
      ? ((liveRows ?? []).find((row) => row.id === contentId) ?? null)
      : null;

   // HTTP fallback — used for initial load and while Electric syncs its first snapshot.
   const { data: httpContent } = useSuspenseQuery(
      orpc.content.getById.queryOptions({ input: { id: contentId } }),
   );

   // Status — prefer live for real-time collaboration updates; fall back to HTTP.
   const liveStatus = (liveContent?.status ?? httpContent.status) as ContentStatus;

   const [meta, setMeta] = useState<ContentMeta>(
      () => httpContent.meta ?? { title: "", description: "", slug: "" },
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
            data: {
               meta: values,
               body: JSON.stringify(editorValueRef.current),
            },
         });
      },
      [contentId, updateMutation],
   );

   useEffect(() => {
      const listener = () => {
         handleSave();
      };
      window.addEventListener("editor-bridge-save", listener);
      return () => {
         window.removeEventListener("editor-bridge-save", listener);
      };
   }, [handleSave]);

   useContextPanelInfo(
      <>
         <WriterPromptBanner contentId={contentId} writerId={httpContent.writerId} />
         <EditorMetaPanel meta={meta} onSave={handleMetaSave} />
      </>,
   );

   return (
      <div className="flex h-full flex-col">
         <EditorContextPanelTabs contentId={contentId} />
         <PlateEditor
            contentId={contentId}
            editable={liveStatus !== "archived"}
            initialValue={
               httpContent?.body ? (JSON.parse(httpContent.body) as Value) : undefined
            }
            isSaving={isSaving}
            key={contentId}
            onChange={(value) => {
               editorValueRef.current = value;
            }}
            onSave={handleSave}
            onStatusChange={handleStatusChange}
            status={liveStatus}
            teamId={httpContent.teamId ?? undefined}
            writerId={httpContent.writerId ?? undefined}
         />
      </div>
   );
}
