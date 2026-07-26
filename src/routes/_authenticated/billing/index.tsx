import { createFileRoute } from '@tanstack/react-router'
import { BillingPage } from '@/features/admin-console/billing'

export const Route = createFileRoute('/_authenticated/billing/')({
  component: BillingPage,
})
