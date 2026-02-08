import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
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
import type { SubSidebarSection } from "@/hooks/use-sidebar-nav";
import { client, orpc } from "@/integrations/orpc/client";

interface SubSidebarContextMenuProps {
   item: { id: string; name: string };
   section: SubSidebarSection;
}

export function SubSidebarContextMenu({
   item,
   section,
}: SubSidebarContextMenuProps) {
   const { openAlertDialog } = useAlertDialog();
   const queryClient = useQueryClient();

   const deleteMutation = useMutation({
      mutationFn: async () => {
         if (section === "dashboards") {
            await client.dashboards.remove({ id: item.id });
         } else {
            await client.insights.remove({ id: item.id });
         }
      },
      onSuccess: () => {
         const label = section === "dashboards" ? "Dashboard" : "Insight";
         toast.success(`${label} excluído com sucesso`);
         if (section === "dashboards") {
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
         } else {
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
         }
      },
      onError: () => {
         toast.error("Erro ao excluir item");
      },
   });

   const duplicateMutation = useMutation({
      mutationFn: async () => {
         const newName = `${item.name} (cópia)`;
         if (section === "dashboards") {
            return client.dashboards.create({ name: newName });
         }
         return client.insights.create({
            name: newName,
            type: "trends",
            config: {},
         });
      },
      onSuccess: () => {
         const label = section === "dashboards" ? "Dashboard" : "Insight";
         toast.success(`${label} duplicado com sucesso`);
         if (section === "dashboards") {
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
         } else {
            queryClient.invalidateQueries({
               queryKey: orpc.insights.list.queryKey({}),
            });
         }
      },
      onError: () => {
         toast.error("Erro ao duplicar item");
      },
   });

   const handleDelete = () => {
      const label = section === "dashboards" ? "dashboard" : "insight";
      openAlertDialog({
         title: `Excluir ${label}`,
         description: `Tem certeza que deseja excluir "${item.name}"? Esta ação não pode ser desfeita.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync();
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
         <DropdownMenuContent align="start" sideOffset={4}>
            <DropdownMenuItem onClick={handleRename}>
               <Pencil className="size-4" />
               Renomear
            </DropdownMenuItem>
            <Tooltip>
               <TooltipTrigger asChild>
                  <div>
                     <DropdownMenuItem disabled>
                        <FolderInput className="size-4" />
                        Mover para pasta
                     </DropdownMenuItem>
                  </div>
               </TooltipTrigger>
               <TooltipContent side="right">(em breve)</TooltipContent>
            </Tooltip>
            <DropdownMenuItem
               disabled={duplicateMutation.isPending}
               onClick={() => duplicateMutation.mutate()}
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
