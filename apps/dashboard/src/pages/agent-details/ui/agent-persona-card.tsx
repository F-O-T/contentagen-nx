import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";

import {
   Bot,
   FileText,
   Megaphone,
   Users,
   Type,
   Edit,
   Trash,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { InfoItem } from "@packages/ui/components/info-item";
import { Separator } from "@packages/ui/components/separator";
import { useTRPC } from "@/integrations/clients";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams, useRouter } from "@tanstack/react-router";
import {
   AlertDialog,
   AlertDialogContent,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogCancel,
   AlertDialogAction,
} from "@packages/ui/components/alert-dialog";
interface AgentPersonaCardProps {
   name: string;
   description: string;
   contentType: string;
   voiceTone: string;
   targetAudience: string;
   formattingStyle: string;
   language: string;
   brandIntegration: string;
}

function formatValue(value: string) {
   if (!value) return "Not specified";
   return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const AgentPersonaCard: React.FC<AgentPersonaCardProps> = ({
   name,
   description,
   contentType,
   voiceTone,
   targetAudience,
   formattingStyle,
   language,
   brandIntegration,
}) => {
   const agentId = useParams({
      from: "/_dashboard/agents/$agentId/",
      select: (params) => params.agentId,
   });
   const [alertOpen, setAlertOpen] = useState(false);

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

   const router = useRouter();
   const items = useMemo(
      () => [
         {
            label: "Content Type",
            value: formatValue(contentType),
            icon: FileText,
         },
         {
            label: "Voice Tone",
            value: formatValue(voiceTone),
            icon: Megaphone,
         },
         {
            label: "Target Audience",
            value: formatValue(targetAudience),
            icon: Users,
         },
         {
            label: "Formatting Style",
            value: formatValue(formattingStyle),
            icon: Type,
         },
         {
            label: "Language",
            value: formatValue(language),
            icon: Type,
         },
         {
            label: "Brand Integration",
            value: formatValue(brandIntegration),
            icon: Bot,
         },
      ],
      [
         contentType,
         voiceTone,
         targetAudience,
         formattingStyle,
         language,
         brandIntegration,
      ],
   );

   return (
      <>
         <Card>
            <CardHeader className="flex flex-row items-start justify-between">
               <div>
                  <CardTitle className="line-clamp-1">Agent Persona</CardTitle>
                  <CardDescription className="line-clamp-1">
                     Configuration summary
                  </CardDescription>
               </div>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem
                        onClick={() =>
                           router.navigate({
                              to: "/agents/$agentId/edit",
                              params: { agentId },
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
            </CardHeader>{" "}
            <CardContent className="flex flex-col gap-4">
               <div className="flex items-center gap-4 rounded-lg bg-muted p-4 ">
                  <Bot className="w-8 h-8 rounded-full bg-muted" />
                  <div>
                     <p className="font-medium text-sm line-clamp-1">{name}</p>
                     <p className="text-xs text-muted-foreground line-clamp-1">
                        {description}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(({ label, value, icon: Icon }) => (
                     <InfoItem
                        key={label}
                        label={label}
                        value={value}
                        icon={<Icon className="w-4 h-4" />}
                     />
                  ))}
               </div>
            </CardContent>
         </Card>
         <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                     This action cannot be undone. This will permanently delete
                     your agent and remove your data from our servers.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => deleteAgent({ id: agentId })}
                     disabled={isPending}
                  >
                     Continue
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   );
};
