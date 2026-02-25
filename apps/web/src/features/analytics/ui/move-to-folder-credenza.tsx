import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Folder, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useCredenza } from "@/hooks/use-credenza";
import { orpc } from "@/integrations/orpc/client";
import { getFolderPickerOptions } from "@/features/analytics/hooks/use-folders";

interface MoveToFolderCredenzaContentProps {
   resourceType: "dashboard" | "insight";
   resourceId: string;
   itemName: string;
   teamId: string;
}

export function MoveToFolderCredenzaContent({
   resourceType,
   resourceId,
   itemName,
   teamId,
}: MoveToFolderCredenzaContentProps) {
   const { closeCredenza } = useCredenza();
   const { data: folders } = useSuspenseQuery(orpc.folders.list.queryOptions({ input: { teamId } }));
   const moveItemMutation = useMutation(orpc.folders.moveItem.mutationOptions());

   const options = getFolderPickerOptions(folders);

   const handleSelect = (folderId: string | null) => {
      moveItemMutation.mutate(
         { resourceType, resourceId, folderId },
         {
            onSuccess: () => {
               toast.success(
                  folderId
                     ? "Item movido para a pasta"
                     : "Item movido para Sem pasta",
               );
               closeCredenza();
            },
            onError: () => {
               toast.error("Erro ao mover item");
            },
         },
      );
   };

   return (
      <div className="flex flex-col gap-4">
         <div>
            <h2 className="text-lg font-semibold">Mover para pasta</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
               "{itemName}" será movido para a pasta selecionada.
            </p>
         </div>
         <div className="flex flex-col gap-0.5 max-h-[50vh] overflow-y-auto">
            {options.map((opt) => (
               <Button
                  key={opt.id ?? "unfiled"}
                  className={cn(
                     "justify-start gap-2 font-normal",
                     opt.depth > 0 && "ml-4",
                  )}
                  disabled={moveItemMutation.isPending}
                  style={
                     opt.depth > 0
                        ? { paddingLeft: `${12 + opt.depth * 12}px` }
                        : undefined
                  }
                  variant="ghost"
                  onClick={() => handleSelect(opt.id)}
               >
                  {opt.id == null ? (
                     <FolderOpen className="size-4 shrink-0 opacity-70" />
                  ) : (
                     <Folder className="size-4 shrink-0 opacity-70" />
                  )}
                  <span className="truncate">{opt.name}</span>
               </Button>
            ))}
         </div>
      </div>
   );
}
