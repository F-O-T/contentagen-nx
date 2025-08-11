import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Markdown } from "@packages/ui/components/markdown";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { Button } from "@packages/ui/components/button";
import type { ContentSelect } from "@packages/database/schemas/content";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/integrations/clients";
import { toast } from "sonner";

export function GeneratedContentDisplay({
   content,
}: {
   content: ContentSelect;
}) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const approveContentMutation = useMutation(
      trpc.content.approve.mutationOptions({
         onError: (error) => {
            console.error("Error approving content:", error);
            toast.error("Failed to approve content. Please try again.");
         },
         onSuccess: () => {
            toast.success("Content approved successfully!");
            queryClient.invalidateQueries({
               queryKey: [
                  trpc.content.list.queryKey(),
                  trpc.content.get.queryKey({ id: content.id }),
               ],
            });
         },
      }),
   );
   return (
      <Card>
         <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
               Your AI-generated content with export and edit options
            </CardDescription>
            <CardAction>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button aria-label="Open menu" variant="ghost" size="icon">
                        <svg
                           width="20"
                           height="20"
                           viewBox="0 0 24 24"
                           fill="none"
                           stroke="currentColor"
                           strokeWidth="2"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           aria-hidden="true"
                        >
                           <circle cx="12" cy="12" r="1" />
                           <circle cx="19" cy="12" r="1" />
                           <circle cx="5" cy="12" r="1" />
                        </svg>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                     <DropdownMenuItem
                        onClick={async () =>
                           await approveContentMutation.mutateAsync({
                              id: content.id,
                           })
                        }
                     >
                        Approve Content
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardAction>
         </CardHeader>
         <CardContent>
            <Markdown content={content?.body} />
         </CardContent>
      </Card>
   );
}
