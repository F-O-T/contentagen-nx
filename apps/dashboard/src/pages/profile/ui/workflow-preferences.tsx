import { useTRPC } from "@/integrations/clients";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Switch } from "@packages/ui/components/switch";
import { toast } from "sonner";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";

export function WorkflowPreferences() {
   const trpc = useTRPC();
   // Fetch workflow preferences
   const { data } = useSuspenseQuery(
      trpc.preferences.getWorkflow.queryOptions(),
   );
   const queryClient = useQueryClient();
   const updateWorkflowMutation = useMutation(
      trpc.preferences.updateWorkflow.mutationOptions({
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.preferences.getWorkflow.queryKey(),
            });
         },
      }),
   );

   const handleToggleMissingImages = async (checked: boolean) => {
      try {
         await updateWorkflowMutation.mutateAsync({
            notifyMissingImages: checked,
         });

         toast.success("Preference updated successfully");
      } catch (error) {
         toast.error("Failed to update preference");
         console.error("Error updating workflow preference:", error);
      }
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>Content workflow Preferences</CardTitle>
            <CardDescription>
               Customize your content workflow settings.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <Card>
               <CardHeader>
                  <CardTitle>Notify on missing urls</CardTitle>
                  <CardDescription>
                     Receive notifications when posts are missing image URLs.
                  </CardDescription>
                  <CardAction>
                     <Switch
                        id="notify-missing-images"
                        checked={data.notifyMissingImages}
                        onCheckedChange={handleToggleMissingImages}
                     />
                  </CardAction>
               </CardHeader>
            </Card>
         </CardContent>
      </Card>
   );
}
