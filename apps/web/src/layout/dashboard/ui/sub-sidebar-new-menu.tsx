import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { FolderPlus, LayoutDashboard, Lightbulb, Plus } from "lucide-react";
import { toast } from "sonner";
import { useActiveTeam } from "@/hooks/use-active-team";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";
import { NewFolderSheetContent } from "@/features/analytics/ui/new-folder-sheet";
import type { SubSidebarSection } from "../hooks/use-sidebar-nav";

interface SubSidebarNewMenuProps {
   section: SubSidebarSection;
   onAction?: () => void;
}

export function SubSidebarNewMenu({
   section,
   onAction,
}: SubSidebarNewMenuProps) {
   const navigate = useNavigate();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const queryClient = useQueryClient();
   const { openSheet, closeSheet } = useSheet();
   const { activeTeam } = useActiveTeam();
   const teamId = activeTeam?.id ?? "";

   const createDashboardMutation = useMutation(
      orpc.dashboards.create.mutationOptions({
         onSuccess: (data) => {
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
            navigate({
               to: "/$slug/$teamSlug/analytics/dashboards/$dashboardId",
               params: { slug, teamSlug, dashboardId: data.id },
            });
            onAction?.();
         },
         onError: () => {
            toast.error("Erro ao criar dashboard");
         },
      }),
   );

   const handleCreateDashboard = () => {
      if (!teamSlug) {
         toast.error("Selecione um time para criar dashboards");
         return;
      }
      createDashboardMutation.mutate({ name: "Dashboard sem título" });
   };

   const handleCreateInsight = () => {
      if (!teamSlug) {
         toast.error("Selecione um time para criar insights");
         return;
      }
      navigate({
         to: "/$slug/$teamSlug/analytics/insights/new",
         params: { slug, teamSlug },
      });
      onAction?.();
   };

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button
               aria-label="Novo"
               className="size-7"
               size="icon"
               variant="ghost"
            >
               <Plus className="size-4" />
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" className="z-[1100]" sideOffset={4}>
            {section === "dashboards" ? (
               <DashboardMenuItems
                  isPending={createDashboardMutation.isPending}
                  onCreateDashboard={handleCreateDashboard}
                  onCreateFolder={
                     teamId
                        ? () =>
                             openSheet({
                                children: (
                                   <NewFolderSheetContent
                                      onSuccess={closeSheet}
                                      teamId={teamId}
                                   />
                                ),
                             })
                        : undefined
                  }
               />
            ) : (
               <InsightMenuItems
                  onCreateFolder={
                     teamId
                        ? () =>
                             openSheet({
                                children: (
                                   <NewFolderSheetContent
                                      onSuccess={closeSheet}
                                      teamId={teamId}
                                   />
                                ),
                             })
                        : undefined
                  }
                  onCreateInsight={handleCreateInsight}
               />
            )}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

function DashboardMenuItems({
   onCreateDashboard,
   onCreateFolder,
   isPending,
}: {
   onCreateDashboard: () => void;
   onCreateFolder?: () => void;
   isPending: boolean;
}) {
   return (
      <>
         <DropdownMenuItem disabled={isPending} onClick={onCreateDashboard}>
            <LayoutDashboard className="size-4" />
            Novo dashboard
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <DropdownMenuItem
            disabled={!onCreateFolder}
            onClick={onCreateFolder}
         >
            <FolderPlus className="size-4" />
            Nova pasta
         </DropdownMenuItem>
      </>
   );
}

function InsightMenuItems({
   onCreateInsight,
   onCreateFolder,
}: {
   onCreateInsight: () => void;
   onCreateFolder?: () => void;
}) {
   return (
      <>
         <DropdownMenuItem onClick={onCreateInsight}>
            <Lightbulb className="size-4" />
            Novo insight
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <DropdownMenuItem
            disabled={!onCreateFolder}
            onClick={onCreateFolder}
         >
            <FolderPlus className="size-4" />
            Nova pasta
         </DropdownMenuItem>
      </>
   );
}
