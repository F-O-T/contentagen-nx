import { createFileRoute, Link } from "@tanstack/react-router";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@packages/ui/components/card";
import { betterAuthClient } from "@/integrations/clients";

function OrganizationPage() {
  const { data: organizations, isPending } =
    betterAuthClient.useListOrganizations();
  const hasOrg = organizations && organizations.length > 0;
  const org = hasOrg && organizations ? organizations[0] : undefined;

  return (
    <main className="flex flex-col h-full w-full gap-4">
      <TalkingMascot
        message={
          hasOrg && org
            ? `Welcome to your organization: ${org.name}`
            : "You don't have an organization yet. Create one to get started!"
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            {hasOrg
              ? "View and configure your organization."
              : "Create your first organization to unlock team features."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <p>Loading...</p>
          ) : hasOrg && org ? (
            <div>
              <div className="mb-2 font-semibold">Name: {org.name}</div>
              <div className="mb-2">Slug: {org.slug}</div>
              {/* Add more organization details/configuration here */}
            </div>
          ) : (
            <div>
              <Link to="/organization/create" className="btn btn-primary">
                Create New Organization
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export const Route = createFileRoute("/_dashboard/organization/")({
  component: OrganizationPage,
});
