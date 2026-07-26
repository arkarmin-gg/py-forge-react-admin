import { createFileRoute } from '@tanstack/react-router'
import { OverviewPage } from '@/features/admin-console/overview'

export const Route = createFileRoute('/_authenticated/')({
  component: OverviewPage,
})
