import { useTRPC } from "@/integrations/clients";
import { UsersIcon, FileArchive } from "lucide-react";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { StatsCard } from "@packages/ui/components/stats-card";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { Link } from "@tanstack/react-router";
import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";
import { Separator } from "@packages/ui/components/separator";
import { useSuspenseQuery } from "@tanstack/react-query";
import { QuickActions } from "./quick-actions";
export function OrganizationOverviewPage() {
   const trpc = useTRPC();
   const { data: organization } = useSuspenseQuery(
      trpc.authHelpers.getDefaultOrganization.queryOptions(),
   );
   const { data } = useSuspenseQuery(
      trpc.organization.getOverviewStats.queryOptions(),
   );
   return (
      <main className="space-y-4">
         <TalkingMascot message="Here you can see your organization overview" />
         <div className="gap-4 grid grid-cols-1 md:grid-cols-3 ">
            <div className="md:col-span-2">
               <Card>
                  <CardHeader>
                     <CardTitle>Organization Details</CardTitle>
                     <CardDescription>
                        Here is an overview of your organization details
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                     <div className="space-y-4 col-span-2">
                        <AgentWriterCard
                           description={organization?.slug ?? ""}
                           name={organization?.name ?? ""}
                        />
                        <Separator />
                     </div>

                     <StatsCard
                        title="Total Members"
                        value={data.totalMembers}
                        description="The total number of members in the organization"
                     />
                     <StatsCard
                        title="Total agents"
                        value={data.totalAgents}
                        description="The total number of writer agents in the organization"
                     />
                  </CardContent>
               </Card>
            </div>
            <div className="col-span-1 space-y-4">
               <Card>
                  <CardHeader>
                     <CardTitle>Quick actions</CardTitle>
                     <CardDescription>
                        Here you can quickly access some actions
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                     <QuickActions />
                  </CardContent>
               </Card>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to="/organization/members">
                     <SquaredIconButton>
                        <UsersIcon /> Members
                     </SquaredIconButton>
                  </Link>
                  <Link to="/organization/brand-files">
                     <SquaredIconButton>
                        <FileArchive /> Brand settings
                     </SquaredIconButton>
                  </Link>
               </div>
            </div>
         </div>
      </main>
   );
}
