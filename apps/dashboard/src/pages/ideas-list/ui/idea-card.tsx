import {
   Card,
   CardHeader,
   CardContent,
   CardFooter,
   CardTitle,
   CardAction,
   CardDescription,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import { Separator } from "@packages/ui/components/separator";
import { Tag, Circle, MoreVertical } from "lucide-react";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
export function IdeaCard({
   idea,
}: {
   idea: RouterOutput["ideas"]["listAllIdeas"]["items"][number];
}) {
   return (
      <Card>
         <CardHeader>
            <CardTitle className="line-clamp-1">{idea.content}</CardTitle>
            <CardDescription className="line-clamp-1">
               Created at:{" "}
               {idea.createdAt
                  ? new Date(idea.createdAt).toLocaleString()
                  : "Unknown"}
            </CardDescription>
            <CardAction>
               <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-center p-2 rounded hover:bg-muted">
                     <MoreVertical className="w-5 h-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                     <DropdownMenuItem asChild>
                        <Link to="/ideas/$id" params={{ id: idea.id }}>
                           View Details
                        </Link>
                     </DropdownMenuItem>
                     {/* Add more actions here as needed */}
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardAction>
         </CardHeader>
         <CardContent className="flex flex-col gap-2">
            <InfoItem
               icon={<Circle className="w-4 h-4" />}
               label="Status"
               value={idea.status ?? "Unknown"}
            />
            <InfoItem
               icon={<Tag className="w-4 h-4" />}
               label="Tags"
               value={
                  idea.meta?.tags?.length
                     ? idea.meta.tags.join(", ")
                     : "No tags"
               }
            />
         </CardContent>
         <CardFooter className="flex flex-col gap-2">
            <Separator />
            <AgentWriterCard
               name={idea.agent?.personaConfig.metadata.name || "Unknown"}
               description={
                  idea.agent?.personaConfig.metadata.description ||
                  "No description"
               }
            />
         </CardFooter>
      </Card>
   );
}
