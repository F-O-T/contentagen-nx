import type { InsightConfig } from "@packages/analytics/types";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
   Copy,
   FolderInput,
   MoreHorizontal,
   Pencil,
   Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { useActiveTeam } from "@/hooks/use-active-team";
import { orpc } from "@/integrations/orpc/client";
import { MoveToFolderCredenzaContent } from "@/features/analytics/ui/move-to-folder-credenza";
import type { SubSidebarSection } from "../hooks/use-sidebar-nav";

interface SubSidebarContextMenuProps {
   item: { id: string; name: string };
   section: SubSidebarSection;
}

export function SubSidebarContextMenu({
   item,
   section,
}: SubSidebarContextMenuProps) {
   const { openAlertDialog } = useAlertDialog();
   const { openCredenza } = useCredenza();
   const { activeTeam } = useActiveTeam();
   const queryClient = useQueryClient();
   const teamId = activeTeam?.id ?? "";

   const deleteDashboardMutation = useMutation(
      orpc.dashboards.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Dashboard excluído com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
         },
         onError: () => {
            toast.error("Erro ao excluir item");
         },
      }),
   );

   const deleteInsightMutation = useMutation(
      orpc.insights.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Insight excluído com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
         },
         onError: () => {
            toast.error("Erro ao excluir item");
         },
      }),
   );

   const duplicateDashboardMutation = useMutation(
      orpc.dashboards.create.mutationOptions({
         onSuccess: () => {
            toast.success("Dashboard duplicado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
         },
         onError: () => {
            toast.error("Erro ao duplicar item");
         },
      }),
   );

   const duplicateInsightMutation = useMutation(
      orpc.insights.create.mutationOptions({
         onSuccess: () => {
            toast.success("Insight duplicado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
         },
         onError: () => {
            toast.error("Erro ao duplicar item");
         },
      }),
   );

   const handleDelete = () => {
      const label = section === "dashboards" ? "dashboard" : "insight";
      openAlertDialog({
         title: `Excluir ${label}`,
         description: `Tem certeza que deseja excluir "${item.name}"? Esta ação não pode ser desfeita.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            if (section === "dashboards") {
               await deleteDashboardMutation.mutateAsync({ id: item.id });
            } else {
               await deleteInsightMutation.mutateAsync({ id: item.id });
            }
         },
      });
   };

   const handleRename = () => {
      // Placeholder — inline rename to be implemented in a later task
      toast.info("Renomear será implementado em breve");
   };

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button
               aria-label="Opções"
               className="size-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
               size="icon"
               variant="ghost"
            >
               <MoreHorizontal className="size-3.5" />
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" className="z-[1100]" sideOffset={4}>
            <DropdownMenuItem onClick={handleRename}>
               <Pencil className="size-4" />
               Renomear
            </DropdownMenuItem>
            <DropdownMenuItem
               disabled={!teamId}
               onClick={() => {
                  if (!teamId) return;
                  openCredenza({
                     children: (
                        <MoveToFolderCredenzaContent
                           itemName={item.name}
                           resourceId={item.id}
                           resourceType={
                              section === "dashboards" ? "dashboard" : "insight"
                           }
                           teamId={teamId}
                        />
                     ),
                  });
               }}
            >
               <FolderInput className="size-4" />
               Mover para pasta
            </DropdownMenuItem>
            <DropdownMenuItem
               disabled={
                  section === "dashboards"
                     ? duplicateDashboardMutation.isPending
                     : duplicateInsightMutation.isPending
               }
               onClick={() => {
                  const newName = `${item.name} (cópia)`;
                  if (section === "dashboards") {
                     duplicateDashboardMutation.mutate({ name: newName });
                  } else {
                     duplicateInsightMutation.mutate({
                        name: newName,
                        type: "trends",
                        config: {} as InsightConfig,
                     });
                  }
               }}
            >
               <Copy className="size-4" />
               Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} variant="destructive">
               <Trash2 className="size-4" />
               Excluir
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
