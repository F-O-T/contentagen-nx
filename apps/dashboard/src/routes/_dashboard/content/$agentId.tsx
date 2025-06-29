import { createFileRoute } from '@tanstack/react-router'
import { ContentRequestDetailsPage } from '@/pages/content-request-details/ui/content-request-details-page'

export const Route = createFileRoute('/_dashboard/content/$agentId')({
  component: ContentRequestDetailsPage,
})
