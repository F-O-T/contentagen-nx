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
import { Link, useRouter } from "@tanstack/react-router";
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
import type { AgentSelect } from "@packages/database/schema";
import type { PersonaConfig } from "@packages/database/schemas/agent";

type AgentCardProps = {
   agent: AgentSelect;
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
               queryKey: trpc.agent.listByUser.queryKey(),
            });
            toast.success("Agent deleted successfully");
         },
      }),
   );
   const infoItems = React.useMemo(() => {
      const personaConfig = agent.personaConfig as PersonaConfig;

      // Extract voice communication style
      const voiceStyle = personaConfig.voice?.communication
         ? formatValueToTitleCase(
              personaConfig.voice.communication.replace("_", " "),
           )
         : "Not specified";

      // Extract audience base
      const audienceBase = personaConfig.audience?.base
         ? formatValueToTitleCase(personaConfig.audience.base.replace("_", " "))
         : "Not specified";

      // Extract purpose/channel if available
      const purpose = personaConfig.purpose
         ? formatValueToTitleCase(personaConfig.purpose.replace("_", " "))
         : null;

      return [
         {
            icon: <Users />,
            label: "Voice & Audience",
            value: `${voiceStyle} • ${audienceBase}`,
         },
         ...(purpose
            ? [
                 {
                    icon: <FileText />,
                    label: "Purpose",
                    value: purpose,
                 },
              ]
            : []),
      ];
   }, [agent]);
   const [dropdownOpen, setDropdownOpen] = React.useState(false);
   const [alertOpen, setAlertOpen] = React.useState(false);
   const router = useRouter();
   return (
      <Card>
         <CardHeader>
            <CardTitle className="line-clamp-1">
               {(agent.personaConfig as PersonaConfig).metadata.name}
            </CardTitle>
            <CardDescription className="line-clamp-1">
               {(agent.personaConfig as PersonaConfig).metadata.description}
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
                     <DropdownMenuItem
                        onClick={() =>
                           router.navigate({
                              to: "/agents/$agentId/edit",
                              params: { agentId: agent.id },
                           })
                        }
                     >
                        <Edit className="w-4 h-4 mr-2" /> Edit
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
                           onClick={() => deleteAgent({ id: agent.id })}
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
