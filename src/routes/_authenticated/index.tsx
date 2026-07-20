import { createFileRoute } from '@tanstack/react-router'
import { OverviewPage } from '@/features/admin-console/shared'

export const Route = createFileRoute('/_authenticated/')({
  component: OverviewPage,
})
