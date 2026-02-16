import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Home, LayoutDashboard, MoreHorizontal } from "lucide-react";
import { orpc } from "@/integrations/orpc/client";

interface DashboardListCardProps {
   id: string;
   name: string;
   description?: string | null;
   tileCount: number;
   updatedAt: string;
   slug: string;
   teamSlug?: string | null;
   isDefault?: boolean;
}

export function DashboardListCard({
   id,
   name,
   description,
   tileCount,
   updatedAt,
   slug,
   teamSlug,
   isDefault = false,
}: DashboardListCardProps) {
   const queryClient = useQueryClient();

   const setAsHomeMutation = useMutation(
      orpc.dashboards.setAsHome.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: orpc.dashboards.list.queryKey({}),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.analytics.getDefaultDashboard.queryKey(),
            });
         },
      }),
   );

   return (
      <div className="relative group">
         <Link
            params={{ slug, teamSlug: teamSlug ?? "", dashboardId: id }}
            to={"/$slug/$teamSlug/analytics/dashboards/$dashboardId"}
         >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
               <CardHeader>
                  <div className="flex items-center gap-3">
                     <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LayoutDashboard className="size-5 text-primary" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <CardTitle className="text-base truncate">
                              {name}
                           </CardTitle>
                           {isDefault && (
                              <Badge
                                 className="gap-1 shrink-0"
                                 variant="secondary"
                              >
                                 <Home className="size-3" />
                                 Home
                              </Badge>
                           )}
                        </div>
                        {description && (
                           <CardDescription className="truncate">
                              {description}
                           </CardDescription>
                        )}
                     </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                     <span>{tileCount} tiles</span>
                     <span>
                        Updated{" "}
                        {new Date(updatedAt).toLocaleDateString("pt-BR")}
                     </span>
                  </div>
               </CardHeader>
            </Card>
         </Link>

         {/* Actions dropdown - positioned over the card */}
         {!isDefault && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button className="size-8" size="icon" variant="ghost">
                        <MoreHorizontal className="size-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem
                        disabled={setAsHomeMutation.isPending}
                        onClick={(e) => {
                           e.preventDefault();
                           setAsHomeMutation.mutate({ id });
                        }}
                     >
                        <Home className="mr-2 size-4" />
                        Definir como Home
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         )}
      </div>
   );
}
