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
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { Trash2, Eye, MoreVertical } from "lucide-react";
import { Badge } from "@packages/ui/components/badge";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";

export function ContentRequestCard({
   request,
}: {
   request: RouterOutput["content"]["listAllContent"]["items"][0];
}) {
   const trpc = useTRPC();
   const { data: profilePhoto } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: request.agent?.id,
      }),
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle className="line-clamp-1 ">
               {request.meta?.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
               {request.meta?.description ?? "No description found"}
            </CardDescription>
            <CardAction>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                     <DropdownMenuItem asChild>
                        <Link
                           params={{ id: request.id }}
                           to={`/content/$id`}
                           className="flex items-center gap-2"
                        >
                           <Eye className="h-4 w-4" />
                           View Content
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardAction>
         </CardHeader>
         <CardContent>
            <AgentWriterCard
               photo={profilePhoto?.data}
               name={request.agent?.personaConfig.metadata.name || "Unknown"}
               description={
                  request.agent?.personaConfig.metadata.description ||
                  "No description"
               }
            />
         </CardContent>
         <CardFooter className="flex items-center justify-between ">
            <Badge variant="outline">
               {new Date(request.createdAt).toLocaleDateString()}
            </Badge>
            <Badge className="text-xs">{request.status}</Badge>
         </CardFooter>
      </Card>
   );
}
