import { a as useSuspenseQuery } from "../_chunks/_libs/@tanstack/react-query.mjs";
import { o as orpc } from "./router-HyRWfAJI.mjs";
function useActiveOrganization() {
  const { data: activeOrganization } = useSuspenseQuery(
    orpc.organization.getActiveOrganization.queryOptions({})
  );
  if (!activeOrganization) {
    throw new Error("No active organization found");
  }
  const { activeSubscription, ...organization } = activeOrganization;
  return { activeOrganization: organization, activeSubscription };
}
export {
  useActiveOrganization as u
};
