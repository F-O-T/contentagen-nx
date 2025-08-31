import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaDescription,
   CredenzaTrigger,
   CredenzaBody,
} from "@packages/ui/components/credenza";
import { Trash2, Eye } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@packages/ui/components/badge";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { formatValueForDisplay } from "@packages/helpers/text";

export function ContentRequestCard({
   request,
   isSelected = false,
   onSelectionChange,
   onView,
   onDelete,
}: {
   request: RouterOutput["content"]["listAllContent"]["items"][0];
   isSelected?: boolean;
   onSelectionChange?: (id: string, selected: boolean) => void;
   onView?: (id: string) => void;
   onDelete?: (id: string) => void;
}) {
   const trpc = useTRPC();
   const navigate = useNavigate();
   const { data: profilePhoto } = useSuspenseQuery(
      trpc.agentFile.getProfilePhoto.queryOptions({
         agentId: request.agent?.id,
      }),
   );

   const [isCredenzaOpen, setIsCredenzaOpen] = useState(false);

   const handleView = () => {
      navigate({
         to: "/content/$id",
         params: { id: request.id },
      });
      onView?.(request.id);
      setIsCredenzaOpen(false);
   };

   const handleDelete = () => {
      onDelete?.(request.id);
      setIsCredenzaOpen(false);
   };

   return (
      <Credenza open={isCredenzaOpen} onOpenChange={setIsCredenzaOpen}>
         <CredenzaTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
               <CardHeader>
                  <div className="flex items-start justify-between">
                     <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-1">
                           {request.meta?.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                           {request.meta?.description ?? "No description found"}
                        </CardDescription>
                     </div>
                     <div data-checkbox className="ml-2">
                        <Checkbox
                           checked={isSelected}
                           onCheckedChange={(checked) =>
                              onSelectionChange?.(
                                 request.id,
                                 checked as boolean,
                              )
                           }
                           onClick={(e) => e.stopPropagation()}
                        />
                     </div>
                  </div>
               </CardHeader>
               <CardContent>
                  <AgentWriterCard
                     photo={profilePhoto?.data}
                     name={
                        request.agent?.personaConfig.metadata.name || "Unknown"
                     }
                     description={
                        request.agent?.personaConfig.metadata.description ||
                        "No description"
                     }
                  />
               </CardContent>
               <CardFooter className="flex items-center justify-between">
                  <Badge variant="outline">
                     {new Date(request.createdAt).toLocaleDateString()}
                  </Badge>
                  <Badge className="text-xs">
                     {formatValueForDisplay(request.status ?? "")}
                  </Badge>
               </CardFooter>
            </Card>
         </CredenzaTrigger>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>{request.meta?.title || "Content"}</CredenzaTitle>
               <CredenzaDescription>
                  {request.meta?.description || "No description available"}
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-2 gap-2">
               <SquaredIconButton onClick={handleView}>
                  <Eye className="h-4 w-4" />
                  View your content details
               </SquaredIconButton>

               <SquaredIconButton destructive onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Delete this content
               </SquaredIconButton>
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
