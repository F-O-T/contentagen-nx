import React from "react";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
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
import { Link, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { EdenClientType } from "@packages/eden";
import {
   MoreVertical,
   Edit,
   Trash,
   AlertTriangle,
   CheckCircle,
   Info,
   XCircle,
   Activity,
   Hash,
} from "lucide-react";
import {
   Alert,
   AlertTitle,
   AlertDescription,
} from "@packages/ui/components/alert";
type ContentRequest = NonNullable<
   Awaited<
      ReturnType<
         EdenClientType["api"]["v1"]["content"]["request"]["list"]["get"]
      >
   >["data"]
>["requests"][number];
export function ContentRequestCard({ request }: { request: ContentRequest }) {
   const queryClient = useQueryClient();
   const { eden } = useRouteContext({ from: "/_dashboard/content/" });

   // Helper function to get icon based on similarity category
   const getSimilarityIcon = (category?: string) => {
      switch (category) {
         case "error":
            return <XCircle className="h-4 w-4" />;
         case "warning":
            return <AlertTriangle className="h-4 w-4" />;
         case "success":
            return <CheckCircle className="h-4 w-4" />;
         default:
            return <Info className="h-4 w-4" />;
      }
   };

   // Fetch similarity data for the request
   const { data: similarityData } = useQuery({
      queryKey: ["content-request-similarity", request.id],
      queryFn: async () => {
         const response = await eden.api.v1.content.ai
            .similarities({ id: request.id })
            .get();
         return response.data;
      },
      enabled: !!request.id,
   });

   const { mutate: deleteContentRequest, isPending } = useMutation({
      mutationFn: async (id: string) =>
         await eden.api.v1.content.request({ id }).delete(),

      onError: () => {
         toast.error("Failed to delete content request");
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: ["get-content-requests"],
         });
         toast.success("Content request deleted successfully");
      },
   });

   const [dropdownOpen, setDropdownOpen] = React.useState(false);
   const [alertOpen, setAlertOpen] = React.useState(false);

   return (
      <Card>
         <CardHeader>
            <CardTitle>{request.topic}</CardTitle>
            <CardDescription>{request.briefDescription}</CardDescription>
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
                              requestId: request.id,
                           }}
                           to="/content/requests/$requestId/edit"
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
                           delete your content request and remove your data from
                           our servers.
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                           onClick={() => deleteContentRequest(request.id)}
                           disabled={isPending}
                        >
                           Continue
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            </CardAction>
         </CardHeader>
         <CardContent>
            <Alert variant="default">
               {getSimilarityIcon(similarityData?.category)}
               <AlertTitle className="capitalize">
                  {similarityData?.category}
               </AlertTitle>

               <AlertDescription>{similarityData?.message}</AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 mt-4">
               <InfoItem
                  icon={<Activity className="h-4 w-4" />}
                  label="Status"
                  value={request.status}
               />
               <InfoItem
                  icon={<Hash className="h-4 w-4" />}
                  label="Target Length"
                  value={`${request.targetLength}`}
               />
            </div>
         </CardContent>
         <CardFooter>
            <Button className="w-full" variant="outline" asChild>
               <Link
                  params={{ requestId: request.id }}
                  to="/content/requests/$requestId"
               >
                  Manage your content
               </Link>
            </Button>
         </CardFooter>
      </Card>
   );
}
