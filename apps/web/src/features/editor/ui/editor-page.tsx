"use client";

import type { ContentMeta } from "@packages/database/schemas/content";
import { useLiveQuery } from "@tanstack/react-db";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { SlateEditor, Value } from "platejs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
   setInfoContent,
   useContextPanelInfo,
} from "@/features/context-panel/use-context-panel";
import {
   createContentCollection,
   type ContentRow,
} from "@/features/content/collections/content-collection";
import { useActiveTeam } from "@/hooks/use-active-team";
import { orpc } from "@/integrations/orpc/client";
import {
   resetChatContext,
   setChatMode,
} from "@/features/teco-chat/stores/chat-context-store";
import { editorContentStore } from "../stores/editor-content-store";
import { markdownToPlateValue } from "../utils/markdown-to-plate";
import { PlateEditor } from "../plate/plate-editor";
import { EditorContextPanelTabs } from "../plate/ui/editor-context-panel-tabs";
import { EditorMetaPanel } from "./editor-meta-panel";
import { WriterPromptBanner } from "./writer-prompt-banner";

type ContentStatus = "draft" | "published" | "archived";

interface EditorPageProps {
   contentId: string;
}

export function EditorPage({ contentId }: EditorPageProps) {
   // teamId from session — safe here since EditorPage is always inside <Suspense>
   const { activeTeamId } = useActiveTeam();
   const teamId = activeTeamId ?? "";

   // Sync chat context: editor mode + contentId so the agent can write to this content.
   useEffect(() => {
      setChatMode("editor", contentId);
      return () => {
         resetChatContext();
      };
   }, [contentId]);

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
   // Incremented only when Electric pushes a meta update from an agent write.
   // Used as key on EditorMetaPanel to force form remount with new defaultValues.
   const [metaVersion, setMetaVersion] = useState(0);

   const editorValueRef = useRef<Value | undefined>(undefined);
   const plateEditorRef = useRef<SlateEditor | null>(null);
   const lastAppliedBodyRef = useRef<string | null>(httpContent?.body ?? null);
   const lastAppliedMetaRef = useRef<string>(
      JSON.stringify(httpContent?.meta ?? {}),
   );

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
         // Mark this value as "written by us" so the Electric echo doesn't re-trigger.
         lastAppliedMetaRef.current = JSON.stringify(values);
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

   // Watch Electric CDC body updates from agent writes
   useEffect(() => {
      const incomingBody = liveContent?.body ?? null;
      if (
         !incomingBody ||
         incomingBody === lastAppliedBodyRef.current ||
         !plateEditorRef.current
      ) {
         return;
      }
      try {
         const parsed = JSON.parse(incomingBody) as Value;
         // biome-ignore lint/suspicious/noExplicitAny: PlateJS tf.setValue not typed on SlateEditor
         (plateEditorRef.current as any).tf.setValue(parsed);
         lastAppliedBodyRef.current = incomingBody;
         editorValueRef.current = parsed;
      } catch {
         // malformed body — ignore
      }
   }, [liveContent?.body]);

   // Register with editorContentStore so tool UIs can apply markdown to this editor.
   useEffect(() => {
      const fn = (markdown: string) => {
         if (!plateEditorRef.current) return;
         try {
            const parsed = markdownToPlateValue(markdown.trim());
            const incomingBody = JSON.stringify(parsed);
            // biome-ignore lint/suspicious/noExplicitAny: PlateJS tf.setValue not typed on SlateEditor
            (plateEditorRef.current as any).tf.setValue(parsed);
            lastAppliedBodyRef.current = incomingBody;
            editorValueRef.current = parsed;
         } catch {
            // malformed markdown — ignore
         }
      };
      editorContentStore.register(fn);
      return () => {
         editorContentStore.unregisterIfOwner(fn);
      };
   }, []);

   // Watch Electric CDC meta updates from agent writes (editTitle, editDescription, etc.)
   useEffect(() => {
      const liveMeta = liveContent?.meta;
      if (!liveMeta) return;
      const liveMetaStr = JSON.stringify(liveMeta);
      if (liveMetaStr === lastAppliedMetaRef.current) return;
      lastAppliedMetaRef.current = liveMetaStr;
      setMeta(liveMeta as ContentMeta);
      // Increment version to force EditorMetaPanel remount with new defaultValues.
      setMetaVersion((v) => v + 1);
   }, [liveContent?.meta]);

   useContextPanelInfo(
      <>
         <WriterPromptBanner contentId={contentId} writerId={httpContent.writerId} />
         <EditorMetaPanel key={metaVersion} meta={meta} onSave={handleMetaSave} />
      </>,
   );

   // Re-sync context panel info whenever metaVersion changes (agent writes update meta).
   // useContextPanelInfo uses an empty [] dep array so it only runs on mount — this effect
   // explicitly propagates subsequent meta version bumps to the context panel store.
   // biome-ignore lint/correctness/useExhaustiveDependencies: metaVersion is the only intended trigger
   useEffect(() => {
      if (metaVersion === 0) return; // Initial mount handled by useContextPanelInfo
      setInfoContent(
         <>
            <WriterPromptBanner contentId={contentId} writerId={httpContent.writerId} />
            <EditorMetaPanel key={metaVersion} meta={meta} onSave={handleMetaSave} />
         </>,
      );
   }, [metaVersion]);

   return (
      <div className="flex h-full flex-col">
         <EditorContextPanelTabs contentId={contentId} />
         <PlateEditor
            contentId={contentId}
            editable={liveStatus !== "archived"}
            editorRef={plateEditorRef}
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
