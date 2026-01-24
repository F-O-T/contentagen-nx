import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DashboardLayout } from '@/layout/dashboard/dashboard-layout'

export const Route = createFileRoute('/_authenticated/$slug/_dashboard')({
  component: DashboardLayoutRoute,
})

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
