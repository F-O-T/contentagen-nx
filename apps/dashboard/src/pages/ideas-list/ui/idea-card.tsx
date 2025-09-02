import {
   Card,
   CardHeader,
   CardContent,
   CardFooter,
   CardTitle,
   CardAction,
   CardDescription,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { Checkbox } from "@packages/ui/components/checkbox";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaTrigger,
   CredenzaBody,
} from "@packages/ui/components/credenza";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { useIdeasList } from "../lib/ideas-list-context";
import { formatValueForDisplay } from "@packages/helpers/text";
export function IdeaCard({
   idea,
}: {
   idea: RouterOutput["ideas"]["listAllIdeas"]["items"][number];
}) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: idea.agent.id,
      }),
   );

   const { selectedItems, handleSelectionChange } = useIdeasList();
   const [isCredenzaOpen, setIsCredenzaOpen] = useState(false);
   const navigate = useNavigate();

   const handleViewDetails = () => {
      navigate({
         to: "/ideas/$id",
         params: { id: idea.id },
      });
      setIsCredenzaOpen(false);
   };

   const contentText =
      (idea.content as any)?.title || (idea.content as string) || "";
   const isGenerating =
      idea.status === "pending" && contentText.includes("Generating");

   return (
      <Credenza open={isCredenzaOpen} onOpenChange={setIsCredenzaOpen}>
         <CredenzaTrigger asChild>
            <Card
               className={`cursor-pointer ${isGenerating ? "border-blue-500 bg-blue-50/50" : ""}`}
            >
               <CardHeader>
                  <CardTitle className="line-clamp-1 flex items-center gap-2">
                     {isGenerating && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                     )}
                     Idea #{idea.id.slice(-8)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                     {isGenerating
                        ? "Generating ideas..."
                        : contentText || "No content available"}
                  </CardDescription>
                  <CardAction>
                     <Checkbox
                        checked={selectedItems.has(idea.id)}
                        disabled={idea.status !== "pending"}
                        onCheckedChange={(checked) =>
                           handleSelectionChange(idea.id, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                     />
                  </CardAction>
               </CardHeader>
               <CardContent className="flex flex-col gap-2">
                  <AgentWriterCard
                     photo={data?.data}
                     name={idea.agent?.personaConfig.metadata.name || "Unknown"}
                     description={
                        idea.agent?.personaConfig.metadata.description ||
                        "No description"
                     }
                  />
               </CardContent>
               <CardFooter className="flex items-center justify-between">
                  <Badge variant="outline">
                     {idea.createdAt
                        ? new Date(idea.createdAt).toLocaleDateString()
                        : "Unknown"}
                  </Badge>
                  <Badge
                     className={`text-xs ${isGenerating ? "bg-blue-500" : ""}`}
                  >
                     {isGenerating
                        ? "Generating"
                        : formatValueForDisplay(idea.status ?? "")}
                  </Badge>
               </CardFooter>
            </Card>
         </CredenzaTrigger>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Idea #{idea.id.slice(-8)}</CredenzaTitle>
               <CredenzaDescription>
                  {isGenerating
                     ? "Generating ideas..."
                     : contentText || "No content available"}
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-1 gap-2">
               <SquaredIconButton onClick={handleViewDetails}>
                  <Eye className="h-4 w-4" />
                  View idea details
               </SquaredIconButton>
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
