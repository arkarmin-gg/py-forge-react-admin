import { createFileRoute } from '@tanstack/react-router'
import { AdminsPage } from '@/features/admin-console/admins'

export const Route = createFileRoute('/_authenticated/admins/')({
  component: AdminsPage,
})
