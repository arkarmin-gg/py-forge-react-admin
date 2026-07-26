import { createFileRoute } from '@tanstack/react-router'
import { OrganizationsPage } from '@/features/admin-console/organizations'

export const Route = createFileRoute('/_authenticated/organizations/')({
  component: OrganizationsPage,
})
