import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@packages/ui/components/card";
import { betterAuthClient } from "@/integrations/clients";
import { useState } from "react";

function OrganizationCreatePage() {
  const { data: organizations } = betterAuthClient.useListOrganizations();
  const hasOrg = organizations && organizations.length > 0;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await betterAuthClient.organization.create({
        name,
        slug,
      });
      if (error) {
        setError(error.message || "Failed to create organization");
      } else {
        navigate({ to: "/organization" });
      }
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col h-full w-full gap-4">
      <TalkingMascot
        message={
          hasOrg
            ? "You already have an organization. You cannot create another."
            : "Create your organization to get started!"
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>
            {hasOrg
              ? "You can only have one organization."
              : "Fill in the details below to create your organization."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasOrg ? (
            <Link to="/organization" className="btn btn-primary">
              Back to Organization Settings
            </Link>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <input
                  className="input input-bordered w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Slug</label>
                <input
                  className="input input-bordered w-full"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-red-500">{error}</div>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Organization"}
                </button>
                <Link to="/organization" className="btn">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export const Route = createFileRoute("/_dashboard/organization/create")({
  component: OrganizationCreatePage,
});
