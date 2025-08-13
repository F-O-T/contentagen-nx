import {
  createFileRoute,
  useParams,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useCallback } from "react";
import { betterAuthClient } from "@/integrations/clients";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/callback/organization/invitation/$inviteId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const inviteId = useParams({
    from: "/callback/organization/invitation/$inviteId",
    select: (params) => params.inviteId,
  });

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
        onSuccess: () => {
          toast.success("Invitation accepted successfully!");
          router.navigate({
            to: "/organization",
            replace: true,
          });
        },
      },
    );
  }, [inviteId, router]);

  useEffect(() => {
    acceptInvitation();
  }, [acceptInvitation]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Invitation</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Processing your invitation...</p>
        <Link to="/organization">
          <Button variant="default" className="mt-4">
            Go to Organization
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
