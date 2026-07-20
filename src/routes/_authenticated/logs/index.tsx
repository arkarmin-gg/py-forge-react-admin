import { createFileRoute } from '@tanstack/react-router'
import { LogsPage } from '@/features/admin-console/shared'

export const Route = createFileRoute('/_authenticated/logs/')({
  component: LogsPage,
})
