import React from "react";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
   CardFooter,
   CardAction,
   CardDescription,
} from "@packages/ui/components/card";
import { InfoItem } from "@packages/ui/components/info-item";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { Button } from "@packages/ui/components/button";
import { Link } from "@tanstack/react-router";
import {
   Edit,
   MoreVertical,
   Users,
   FileText,
   CheckCircle2,
   Trash,
} from "lucide-react";
import { formatValueToTitleCase } from "@packages/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import type { AgentInsert } from "@packages/database/schema";

type AgentCardProps = {
   agent: AgentInsert;
};

export function AgentCard({ agent }: AgentCardProps) {
   const queryClient = useQueryClient();
   const trpc = useTRPC();
   const { mutate: deleteAgent, isPending } = useMutation(
      trpc.agent.delete.mutationOptions({
         onError: () => {
            toast.error("Failed to delete agent");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: ["get-agents"],
            });
            toast.success("Agent deleted successfully");
         },
      }),
   );
   const infoItems = React.useMemo(
      () => [
         {
            icon: <Users />,
            label: "Voice & Audience",
            value: `${formatValueToTitleCase(agent.voiceTone)} • ${formatValueToTitleCase(agent.targetAudience)}`,
         },
      ],
      [agent],
   );
   const statsItems = React.useMemo(
      () => [
         {
            icon: <FileText />,
            label: "Drafts",
            value: String(agent.totalDrafts ?? 0),
         },
         {
            icon: <CheckCircle2 />,
            label: "Published",
            value: String(agent?.totalPublished ?? 0),
         },
      ],
      [agent],
   );
   const [dropdownOpen, setDropdownOpen] = React.useState(false);
   const [alertOpen, setAlertOpen] = React.useState(false);

   return (
      <Card>
         <CardHeader>
            <CardTitle className="line-clamp-1">{agent.name}</CardTitle>
            <CardDescription className="line-clamp-1">
               {agent.description}
            </CardDescription>
            <CardAction>
               <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                     <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDropdownOpen(true)}
                     >
                        <MoreVertical className="w-5 h-5" />
                     </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                     <DropdownMenuItem asChild>
                        <Link
                           params={{
                              agentId: agent.id,
                           }}
                           to="/agents/$agentId/edit"
                        >
                           <Edit className="w-4 h-4 mr-2" /> Edit
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        disabled={isPending}
                        onClick={() => setAlertOpen(true)}
                     >
                        <Trash className="w-4 h-4 mr-2" /> Delete
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
               <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                  <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>
                           Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                           This action cannot be undone. This will permanently
                           delete your agent and remove your data from our
                           servers.
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                           onClick={() => deleteAgent(agent.id)}
                           disabled={isPending}
                        >
                           Continue
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            </CardAction>
         </CardHeader>

         <CardContent className="flex flex-col gap-2">
            {infoItems.map((item) => (
               <InfoItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
               />
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
               {statsItems.map((item) => (
                  <InfoItem
                     key={item.label}
                     icon={item.icon}
                     label={item.label}
                     value={item.value}
                  />
               ))}
            </div>
         </CardContent>

         <CardFooter className="grid grid-cols-1 gap-2">
            <Link
               to={`/agents/$agentId`}
               params={{ agentId: agent.id }}
               className="flex-1"
            >
               <Button className="w-full" size="sm">
                  View details
               </Button>
            </Link>
         </CardFooter>
      </Card>
   );
}
