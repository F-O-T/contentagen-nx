import type { CompetitorSelect } from "@packages/database/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { Badge } from "@packages/ui/components/badge";
import { ExternalLink, Edit, Trash2, Globe, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DeleteCompetitorConfirmationDialog } from "../features/delete-competitor-confirmation-dialog";
import { CreateEditCompetitorDialog } from "../features/create-edit-competitor-dialog";
import { useState } from "react";

interface CompetitorCardProps {
   competitor: CompetitorSelect;
}

export function CompetitorCard({ competitor }: CompetitorCardProps) {
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const [showEditDialog, setShowEditDialog] = useState(false);

   const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      }).format(date);
   };

   return (
      <>
         <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
               <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                     {competitor.name}
                  </CardTitle>
                  <div className="flex gap-1 ml-2">
                     <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        target="_blank"
                        rel="noopener noreferrer"
                     >
                        <a href={competitor.websiteUrl}>
                           <ExternalLink className="h-4 w-4" />
                        </a>
                     </Button>
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditDialog(true)}
                     >
                        <Edit className="h-4 w-4" />
                     </Button>
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="pt-0">
               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Globe className="h-4 w-4" />
                     <span className="truncate">{competitor.websiteUrl}</span>
                  </div>
                  
                  {competitor.changelogUrl && (
                     <div className="flex items-center gap-2 text-sm text-blue-600">
                        <ExternalLink className="h-4 w-4" />
                        <span className="truncate">Changelog available</span>
                     </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                     <Calendar className="h-4 w-4" />
                     <span>Added {formatDate(new Date(competitor.createdAt))}</span>
                  </div>

                  {competitor.features && competitor.features.length > 0 && (
                     <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                           {competitor.features.length} features tracked
                        </Badge>
                     </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                     <Link
                        to="/competitors/$id"
                        params={{ id: competitor.id }}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                     >
                        View details →
                     </Link>
                  </div>
               </div>
            </CardContent>
         </Card>

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