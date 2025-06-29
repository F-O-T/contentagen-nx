import { createFileRoute } from '@tanstack/react-router'
import { ContentRequestsPage } from '@/pages/content-requests/ui/content-requests-page'

export const Route = createFileRoute('/_dashboard/content/')({
  component: ContentRequestsPage,
})
