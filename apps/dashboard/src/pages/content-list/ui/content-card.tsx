import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { Activity, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@packages/ui/components/skeleton";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { Separator } from "@packages/ui/components/separator";
export function ContentRequestCard({
   request,
}: {
   request: RouterOutput["content"]["listAllContent"]["items"][0];
}) {
   return (
      <Card>
         {request.status === "generating" ? (
            <>
               <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
               </CardHeader>
               <CardContent className="grid grid-cols-1 gap-2">
                  <Skeleton className="h-4 w-full mb-2" />
               </CardContent>
               <CardFooter className="flex flex-col gap-2 ">
                  <Separator />
                  <Skeleton className="h-5 w-1/2 mb-2" />
                  <Skeleton className="h-10 w-full" />
               </CardFooter>
            </>
         ) : (
            <>
               <CardHeader>
                  <CardTitle className="line-clamp-1">
                     {request.meta?.title}
                  </CardTitle>
                  <CardAction>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem asChild>
                              <Link
                                 params={{ id: request.id }}
                                 to={`/content/$id`}
                              >
                                 View Content
                              </Link>
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </CardAction>
                  <CardDescription>
                     {request.meta?.description ?? "No description found"}
                  </CardDescription>
               </CardHeader>
               <CardContent className="grid grid-cols-1 gap-2 ">
                  <InfoItem
                     icon={<Activity className="h-4 w-4" />}
                     label="Status"
                     value={request.status ?? ""}
                  />
               </CardContent>
               <CardFooter className="flex flex-col gap-2 ">
                  <Separator />
                  <span className="w-full text-sm text-muted-foreground text-start">
                     Written By:
                  </span>
                  <AgentWriterCard
                     name={request.agent.personaConfig.metadata.name}
                     description={
                        request.agent.personaConfig.metadata.description
                     }
                  />
               </CardFooter>
            </>
         )}
      </Card>
   );
}
