import { Button } from "@packages/ui/components/button";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { orpc } from "@/integrations/orpc/client";
import { PlateEditor } from "../plate/plate-editor";
import { EditorLayout } from "./editor-layout";

interface EditorPageProps {
   contentId: string;
}

export function EditorPage({ contentId }: EditorPageProps) {
   const params = useParams({ strict: false }) as {
      slug: string;
      teamSlug: string;
   };
   const navigate = useNavigate();
   const [isSaving, setIsSaving] = useState(false);

   const { data: content } = useSuspenseQuery(
      orpc.content.getById.queryOptions({
         input: { id: contentId },
      }),
   );

   const updateMutation = useMutation(orpc.content.update.mutationOptions({}));

   const handleSave = useCallback(async () => {
      setIsSaving(true);
      try {
         await updateMutation.mutateAsync({ id: contentId, data: {} });
      } finally {
         setIsSaving(false);
      }
   }, [contentId, updateMutation]);

   const handleBack = useCallback(() => {
      navigate({ to: `/${params.slug}/${params.teamSlug}/content` });
   }, [navigate, params.slug, params.teamSlug]);

   const navbar = (
      <div className="flex items-center justify-between h-12 px-4">
         <div className="flex items-center gap-3">
            <button
               className="text-muted-foreground hover:text-foreground text-sm"
               onClick={handleBack}
               type="button"
            >
               ← Back
            </button>
            <span className="text-sm font-medium truncate max-w-xs">
               {content.meta?.title ?? "Untitled"}
            </span>
            {content.status && (
               <span className="text-xs text-muted-foreground capitalize">
                  {content.status}
               </span>
            )}
         </div>
         <Button
            disabled={isSaving}
            onClick={handleSave}
            size="sm"
            variant="default"
         >
            {isSaving ? "Saving…" : "Save"}
         </Button>
      </div>
   );

   return (
      <EditorLayout navbar={navbar}>
         <div className="max-w-3xl mx-auto p-6">
            <PlateEditor
               contentId={contentId}
               editable={content.status !== "archived"}
               key={contentId}
               writerId={content.writerId ?? undefined}
            />
         </div>
      </EditorLayout>
   );
}
