import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   Card,
   CardHeader,
   CardContent,
   CardTitle,
   CardDescription,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import { Circle, Calendar, Clock, Tag, Link2 } from "lucide-react";
import { Markdown } from "@packages/ui/components/markdown";

export function IdeaDetailsPage() {
   const { id } = useParams({ from: "/_dashboard/ideas/$id" });
   const trpc = useTRPC();
   const { data: idea } = useSuspenseQuery(
      trpc.ideas.getIdeaById.queryOptions({ id }),
   );

   return (
      <main className="h-full w-full flex flex-col gap-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 flex flex-col gap-4">
               <Card>
                  <CardHeader>
                     <CardTitle>Details</CardTitle>
                     <CardDescription>
                        Status and timestamps for this idea.
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                     <InfoItem
                        icon={<Circle className="w-4 h-4" />}
                        label="Status"
                        value={idea.status ?? "Unknown"}
                     />
                     <InfoItem
                        icon={<Calendar className="w-4 h-4" />}
                        label="Created"
                        value={
                           idea.createdAt
                              ? new Date(idea.createdAt).toLocaleString()
                              : "Unknown"
                        }
                     />
                     <InfoItem
                        icon={<Clock className="w-4 h-4" />}
                        label="Updated"
                        value={
                           idea.updatedAt
                              ? new Date(idea.updatedAt).toLocaleString()
                              : "Unknown"
                        }
                     />
                  </CardContent>
               </Card>
               <Card>
                  <CardHeader>
                     <CardTitle>Meta</CardTitle>
                     <CardDescription>
                        General metadata for this idea.
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                     <InfoItem
                        icon={<Tag className="w-4 h-4" />}
                        label="Tags"
                        value={
                           idea.meta?.tags?.length
                              ? idea.meta.tags.join(", ")
                              : "None"
                        }
                     />
                     <InfoItem
                        icon={<Link2 className="w-4 h-4" />}
                        label="Source"
                        value={idea.meta?.source ?? "None"}
                     />
                  </CardContent>
               </Card>
            </div>
            <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
               <Card>
                  <CardHeader>
                     <CardTitle>Idea Content</CardTitle>
                     <CardDescription>
                        The main content of this idea.
                     </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <Markdown content={idea.content ?? "No content"} />
                  </CardContent>
               </Card>
            </div>
         </div>
      </main>
   );
}
