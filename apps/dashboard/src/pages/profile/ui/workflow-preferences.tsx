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
import { translate } from "@packages/localization";

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

         toast.success(translate("pages.profile.toast.preference-updated"));
      } catch (error) {
         toast.error(translate("pages.profile.toast.preference-failed"));
         console.error("Error updating workflow preference:", error);
      }
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("pages.profile.preferences.workflow.workflow-title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "pages.profile.preferences.workflow.workflow-description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <Card>
               <CardHeader>
                  <CardTitle>
                     {translate(
                        "pages.profile.preferences.workflow.missing-urls-title",
                     )}
                  </CardTitle>
                  <CardDescription>
                     {translate(
                        "pages.profile.preferences.workflow.missing-urls-description",
                     )}
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
