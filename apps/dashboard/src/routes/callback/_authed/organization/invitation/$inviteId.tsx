import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute(
   "/callback/_authed/organization/invitation/$inviteId",
)({
   component: RouteComponent,
});

function RouteComponent() {
   const router = useRouter();
   const inviteId = Route.useParams({
      select: (params) => params.inviteId,
   });

   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const handleLogout = useCallback(async () => {
      await betterAuthClient.signOut(
         {},
         {
            onSuccess: async () => {
               await queryClient.invalidateQueries({
                  queryKey: trpc.sessionHelper.getSession.queryKey(),
               });
               router.navigate({
                  to: "/auth/sign-in",
               });
            },
         },
      );
   }, [router, queryClient, trpc.sessionHelper.getSession.queryKey]);
   const acceptInvitation = useCallback(async () => {
      await betterAuthClient.organization.acceptInvitation(
         {
            invitationId: inviteId,
         },
         {
            onError: (error) => {
               console.error("Failed to accept invitation:", error);
               toast.error(
                  "Failed to accept invitation. Please try again later.",
               );
            },
            onSuccess: async () => {
               toast.success("Invitation accepted successfully!");
               await handleLogout();
            },
         },
      );
   }, [inviteId, handleLogout]);
   //TODO: melhorar design
   return (
      <Card>
         <CardHeader>
            <CardTitle>Organization Invitation</CardTitle>
         </CardHeader>
         <CardContent>
            <Button
               variant="default"
               className="mt-4"
               onClick={acceptInvitation}
            >
               Accept Invitation
            </Button>
         </CardContent>
      </Card>
   );
}
