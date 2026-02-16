import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/integrations/orpc/client";

export function useActiveTeam() {
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   const { data: teams } = useSuspenseQuery(
      orpc.organization.getOrganizationTeams.queryOptions({}),
   );

   const activeTeamId = session?.session.activeTeamId ?? null;
   const activeTeam = teams.find((team) => team.id === activeTeamId) ?? null;

   return { activeTeam, activeTeamId, teams };
}
