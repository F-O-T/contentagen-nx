import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/home")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_dashboard/"!</div>;
}
