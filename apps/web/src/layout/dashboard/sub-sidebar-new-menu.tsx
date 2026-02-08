import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
   FolderPlus,
   GitBranch,
   LayoutDashboard,
   Lightbulb,
   Plus,
   RotateCcw,
   TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { SubSidebarSection } from "@/hooks/use-sidebar-nav";
import { client, orpc } from "@/integrations/orpc/client";

interface SubSidebarNewMenuProps {
   section: SubSidebarSection;
}

export function SubSidebarNewMenu({ section }: SubSidebarNewMenuProps) {
   const navigate = useNavigate();
   const params = useParams({ strict: false }) as { slug?: string };
   const slug = params.slug ?? "";
   const queryClient = useQueryClient();

   const createDashboardMutation = useMutation({
      mutationFn: async () => {
         return client.dashboards.create({ name: "Dashboard sem título" });
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({
            queryKey: orpc.dashboards.list.queryKey({}),
         });
         navigate({
            to: "/$slug/analytics/dashboards/$dashboardId",
            params: { slug, dashboardId: data.id },
         });
      },
      onError: () => {
         toast.error("Erro ao criar dashboard");
      },
   });

   const createInsightMutation = useMutation({
      mutationFn: async (type: "trends" | "funnels" | "retention") => {
         return client.insights.create({
            name: "Insight sem título",
            type,
            config: {},
         });
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries({
            queryKey: orpc.insights.list.queryKey({}),
         });
         navigate({
            to: "/$slug/analytics/insights/$insightId",
            params: { slug, insightId: data.id },
         });
      },
      onError: () => {
         toast.error("Erro ao criar insight");
      },
   });

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
         <DropdownMenuContent align="start" sideOffset={4}>
            {section === "dashboards" ? (
               <DashboardMenuItems
                  isPending={createDashboardMutation.isPending}
                  onCreateDashboard={() => createDashboardMutation.mutate()}
               />
            ) : (
               <InsightMenuItems
                  isPending={createInsightMutation.isPending}
                  onCreateInsight={(type) => createInsightMutation.mutate(type)}
               />
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
   isPending,
}: {
   onCreateInsight: (type: "trends" | "funnels" | "retention") => void;
   isPending: boolean;
}) {
   return (
      <>
         <DropdownMenuSub>
            <DropdownMenuSubTrigger>
               <Lightbulb className="size-4 mr-2" />
               Novo insight
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
               <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => onCreateInsight("trends")}
               >
                  <TrendingUp className="size-4" />
                  Novo Trends
               </DropdownMenuItem>
               <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => onCreateInsight("funnels")}
               >
                  <GitBranch className="size-4" />
                  Novo Funnel
               </DropdownMenuItem>
               <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => onCreateInsight("retention")}
               >
                  <RotateCcw className="size-4" />
                  Novo Retention
               </DropdownMenuItem>
            </DropdownMenuSubContent>
         </DropdownMenuSub>
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
