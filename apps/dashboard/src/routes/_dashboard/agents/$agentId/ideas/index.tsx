import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/agents/$agentId/ideas/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboard/agents/$agentId/ideas/"!</div>
}
