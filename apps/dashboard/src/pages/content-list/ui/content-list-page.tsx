import { createQueryKey } from "@packages/eden";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ContentRequestCard } from "./content-request-card";
import { CreateNewContentRequestButton } from "./create-new-content-request-button";

export function ContentListPage() {
  const { eden, agentId } = useRouteContext({
    from: "/_dashboard/content/$agentId/",
  });

  const { data } = useSuspenseQuery({
    queryFn: () => {
      if (agentId) {
        return eden.api.v1.content.request.agent[":agentId"].get({
          params: { agentId },
        });
      }
      return eden.api.v1.content.request.get();
    },
    queryKey: createQueryKey(
      agentId
        ? `eden.api.v1.content.request.agent.${agentId}.get`
        : "eden.api.v1.content.request.get",
    ),
    select: (data) => data.data,
  });

  return (
    <main className="h-full w-full flex flex-col gap-4 ">
      <TalkingMascot message="Here you can manage all your content requests. Create, edit, or explore your requests below!" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.requests.map((request) => (
          <ContentRequestCard key={request.id} request={request} />
        ))}
      </div>
      <CreateNewContentRequestButton />
    </main>
  );
}
