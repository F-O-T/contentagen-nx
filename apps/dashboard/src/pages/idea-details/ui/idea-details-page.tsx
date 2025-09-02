import { useParams, useRouter } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import {
   Card,
   CardHeader,
   CardContent,
   CardTitle,
   CardDescription,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import {
   Circle,
   Calendar,
   Clock,
   Tag,
   Link2,
   MoreVertical,
   TrendingUp,
   MessageSquare,
} from "lucide-react";
import { CardAction } from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { Markdown } from "@packages/ui/components/markdown";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";

export function IdeaDetailsPage() {
   const { id } = useParams({ from: "/_dashboard/ideas/$id" });
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { data: idea } = useSuspenseQuery(
      trpc.ideas.getIdeaById.queryOptions({ id }),
   );
   const router = useRouter();
   const approveMutation = useMutation(
      trpc.ideas.approve.mutationOptions({
         onSuccess: async (data) => {
            toast.success(
               "Idea approved successfully and sent to content generation",
            );
            router.navigate({
               to: "/content/$id",
               params: {
                  id: data.content.id,
               },
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.ideas.getIdeaById.queryKey({ id }),
            });
            await queryClient.invalidateQueries({
               queryKey: trpc.ideas.listAllIdeas.queryKey(),
            });
         },
         onError: (error) => {
            toast.error(
               `Error approving idea: ${error.message ?? "Unknown error"}`,
            );
         },
      }),
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
                        icon={<TrendingUp className="w-4 h-4" />}
                        label="Confidence Score"
                        value={`${(idea as any).confidence?.score || "0"}%`}
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
               {(idea as any).confidence?.rationale && (
                  <Card>
                     <CardHeader>
                        <CardTitle>Confidence Analysis</CardTitle>
                        <CardDescription>
                           AI-powered evaluation of this idea's potential.
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="flex items-start gap-2">
                           <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                           <p className="text-sm text-muted-foreground">
                              {(idea as any).confidence?.rationale}
                           </p>
                        </div>
                     </CardContent>
                  </Card>
               )}
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
                     <CardAction>
                        <DropdownMenu>
                           <DropdownMenuTrigger className="flex items-center justify-center p-2 rounded hover:bg-muted">
                              <MoreVertical className="w-5 h-5" />
                           </DropdownMenuTrigger>
                           <DropdownMenuContent>
                              <DropdownMenuItem
                                 disabled={
                                    idea.status === "approved" ||
                                    idea.status === "rejected"
                                 }
                                 onClick={async () => {
                                    await approveMutation.mutateAsync({
                                       id: idea.id,
                                    });
                                 }}
                              >
                                 Approve Idea
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {(idea as any).content?.title && (
                        <div>
                           <h3 className="text-lg font-semibold mb-2">Title</h3>
                           <p className="text-foreground">
                              {(idea as any).content.title}
                           </p>
                        </div>
                     )}
                     {(idea as any).content?.description && (
                        <div>
                           <h3 className="text-lg font-semibold mb-2">
                              Description
                           </h3>
                           <Markdown
                              content={(idea as any).content.description}
                           />
                        </div>
                     )}
                     {!(
                        (idea as any).content?.title ||
                        (idea as any).content?.description
                     ) && <Markdown content={idea.content ?? "No content"} />}
                  </CardContent>
               </Card>
            </div>
         </div>
      </main>
   );
}
