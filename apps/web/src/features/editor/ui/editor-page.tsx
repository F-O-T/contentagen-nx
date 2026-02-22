"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import type { Value } from "platejs";
import { orpc } from "@/integrations/orpc/client";
import { PlateEditor } from "../plate/plate-editor";
import type { ContentMeta } from "@packages/database/schemas/content";

interface EditorPageProps {
   contentId: string;
}

export function EditorPage({ contentId }: EditorPageProps) {
   const params = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };
   const navigate = useNavigate();

   const { data: content } = useSuspenseQuery(
      orpc.content.getById.queryOptions({ input: { id: contentId } }),
   );

   const [meta, setMeta] = useState<ContentMeta>(
      () => content.meta ?? { title: "", description: "", slug: "" },
   );
   const [isSaving, setIsSaving] = useState(false);

   const editorValueRef = useRef<Value | undefined>(undefined);

   const updateMutation = useMutation(orpc.content.update.mutationOptions({}));

   const handleSave = useCallback(async () => {
      setIsSaving(true);
      try {
         await updateMutation.mutateAsync({
            id: contentId,
            data: { meta },
         });
      } finally {
         setIsSaving(false);
      }
   }, [contentId, meta, updateMutation]);

   const handleBack = useCallback(() => {
      navigate({ to: `/${params.slug}/${params.teamSlug}/content` });
   }, [navigate, params.slug, params.teamSlug]);

   return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
         <PlateEditor
            contentId={contentId}
            editable={content.status !== "archived"}
            key={contentId}
            writerId={content.writerId ?? undefined}
            meta={meta}
            onMetaChange={setMeta}
            title={meta.title || "Sem título"}
            status={content.status}
            isSaving={isSaving}
            onSave={handleSave}
            onBack={handleBack}
            showLinksSidebar
            onChange={(value) => {
               editorValueRef.current = value;
            }}
         />
      </div>
   );
}
