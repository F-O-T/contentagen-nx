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
import { useNavigate, useParams } from "@tanstack/react-router";
import { FolderPlus, LayoutDashboard, Lightbulb, Plus } from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
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
               />
            ) : (
               <InsightMenuItems onCreateInsight={handleCreateInsight} />
            )}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

function DashboardMenuItems({
   onCreateDashboard,
   isPending,
}: {
   onCreateDashboard: () => void;
   isPending: boolean;
}) {
   return (
      <>
         <DropdownMenuItem disabled={isPending} onClick={onCreateDashboard}>
            <LayoutDashboard className="size-4" />
            Novo dashboard
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <Tooltip>
            <TooltipTrigger asChild>
               <div>
                  <DropdownMenuItem disabled>
                     <FolderPlus className="size-4" />
                     Nova pasta
                  </DropdownMenuItem>
               </div>
            </TooltipTrigger>
            <TooltipContent side="right">(em breve)</TooltipContent>
         </Tooltip>
      </>
   );
}

function InsightMenuItems({
   onCreateInsight,
}: {
   onCreateInsight: () => void;
}) {
   return (
      <>
         <DropdownMenuItem onClick={onCreateInsight}>
            <Lightbulb className="size-4" />
            Novo insight
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <Tooltip>
            <TooltipTrigger asChild>
               <div>
                  <DropdownMenuItem disabled>
                     <FolderPlus className="size-4" />
                     Nova pasta
                  </DropdownMenuItem>
               </div>
            </TooltipTrigger>
            <TooltipContent side="right">(em breve)</TooltipContent>
         </Tooltip>
      </>
   );
}
