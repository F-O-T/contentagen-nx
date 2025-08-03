import { useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";

import { useTRPC } from "@/integrations/clients";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
interface AgentDetailsPromptCardProps {
   basePrompt: string;
}

export function AgentDetailsPromptCard({
   basePrompt,
}: AgentDetailsPromptCardProps) {
   const [draft, setDraft] = useState(basePrompt);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const trpc = useTRPC();
   const agentId = useParams({
      from: "/_dashboard/agents/$agentId/",
      select: ({ agentId }) => agentId,
   });
   const queryClient = useQueryClient();
   const regeneratePromptMutation = useMutation(
      trpc.agent.regenerateSystemPrompt.mutationOptions({
         onError: () => {
            toast.error("Failed to regenerate system prompt");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.agent.get.queryKey({ id: agentId }),
            });
            toast.success("System prompt regenerated successfully");
         },
      }),
   );
   return (
      <Card>
         <CardHeader className="flex justify-between items-start">
            <div>
               <CardTitle>Agent Base Prompt</CardTitle>
               <CardDescription>
                  Core configuration and behavior instructions
               </CardDescription>
            </div>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                     <MoreHorizontal className="w-4 h-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsModalOpen(true)}>
                     Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     onSelect={async () =>
                        await regeneratePromptMutation.mutateAsync({
                           id: agentId,
                        })
                     }
                  >
                     Regenerate System Prompt{" "}
                  </DropdownMenuItem>{" "}
               </DropdownMenuContent>
            </DropdownMenu>
         </CardHeader>
         <CardContent className="space-y-4 prose prose-sm max-w-none  dark:prose-invert">
            <div className="border-primary/30 rounded-lg border bg-muted p-2 overflow-hidden">
               <ReactMarkdown>{basePrompt}</ReactMarkdown>
            </div>
         </CardContent>
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Edit Base Prompt</DialogTitle>
               </DialogHeader>
               <textarea
                  className="w-full border rounded p-2"
                  rows={10}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
               />
               <DialogFooter className="flex justify-end space-x-2">
                  <Button
                     variant="secondary"
                     size="sm"
                     onClick={() => setIsModalOpen(false)}
                  >
                     Cancel
                  </Button>
                  <Button size="sm" onClick={() => setIsModalOpen(false)}>
                     Save
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </Card>
   );
}
