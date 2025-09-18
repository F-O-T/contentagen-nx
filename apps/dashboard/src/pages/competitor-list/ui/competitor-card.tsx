import {
   Card,
   CardHeader,
   CardAction,
   CardFooter,
} from "@packages/ui/components/card";
import { Badge } from "@packages/ui/components/badge";
import { Edit, Trash2, Globe, Eye } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { DeleteCompetitorConfirmationDialog } from "../features/delete-competitor-confirmation-dialog";
import { CreateEditCompetitorDialog } from "../features/create-edit-competitor-dialog";
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
import { useCompetitorList } from "../lib/competitor-list-context";
import { useCallback, useState } from "react";
import { Checkbox } from "@packages/ui/components/checkbox";
import type { RouterOutput } from "@packages/api/client";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";

interface CompetitorCardProps {
   competitor: RouterOutput["competitor"]["list"]["items"][number];
}

export function CompetitorCard({ competitor }: CompetitorCardProps) {
   const { selectedItems, handleSelectionChange } = useCompetitorList();
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [isCredenzaOpen, setIsCredenzaOpen] = useState(false);
   const router = useRouter();
   const handleNavigate = useCallback(() => {
      router.navigate({
         to: "/competitors/$id",
         params: { id: competitor.id },
      });
   }, [competitor.id, router]);
   const handleExternalNavigation = useCallback(() => {
      window.open(competitor.websiteUrl, "_blank");
   }, [competitor.websiteUrl]);
   const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      }).format(date);
   };
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.competitorFile.getLogo.queryOptions({
         competitorId: competitor.id,
      }),
   );
   return (
      <>
         <Credenza open={isCredenzaOpen} onOpenChange={setIsCredenzaOpen}>
            <CredenzaTrigger asChild>
               <Card className="cursor-pointer">
                  <CardHeader>
                     <AgentWriterCard
                        name={competitor.name ?? ""}
                        description={competitor.description ?? ""}
                        photo={data?.data ?? ""}
                        isHeader
                     />

                     <CardAction>
                        <Checkbox
                           checked={selectedItems.has(competitor.id)}
                           onCheckedChange={(checked) =>
                              handleSelectionChange(
                                 competitor.id,
                                 checked as boolean,
                              )
                           }
                           onClick={(e) => e.stopPropagation()}
                        />
                     </CardAction>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between">
                     <Badge variant="outline">
                        {formatDate(new Date(competitor.createdAt))}
                     </Badge>
                     {competitor.features && competitor.features.length > 0 && (
                        <Badge className="text-xs">
                           {competitor.features.length} features
                        </Badge>
                     )}
                  </CardFooter>
               </Card>
            </CredenzaTrigger>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>{competitor.name}</CredenzaTitle>
                  <CredenzaDescription>
                     Your competitor website: {competitor.websiteUrl}
                  </CredenzaDescription>
               </CredenzaHeader>
               <CredenzaBody className="grid grid-cols-2 gap-2">
                  <SquaredIconButton onClick={handleNavigate}>
                     <Eye className="h-4 w-4" />
                     View details
                  </SquaredIconButton>

                  <SquaredIconButton
                     onClick={() => {
                        setShowEditDialog(true);
                        setIsCredenzaOpen(false);
                     }}
                  >
                     <Edit className="h-4 w-4" />
                     Edit competitor
                  </SquaredIconButton>
                  <SquaredIconButton onClick={handleExternalNavigation}>
                     <Globe className="h-4 w-4" />
                     Visit website
                  </SquaredIconButton>
                  <SquaredIconButton
                     destructive
                     onClick={() => {
                        setShowDeleteDialog(true);
                        setIsCredenzaOpen(false);
                     }}
                  >
                     <Trash2 className="h-4 w-4" />
                     Delete competitor
                  </SquaredIconButton>
               </CredenzaBody>
            </CredenzaContent>
         </Credenza>

         <DeleteCompetitorConfirmationDialog
            competitor={competitor}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
         />

         <CreateEditCompetitorDialog
            competitor={competitor}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
         />
      </>
   );
}
