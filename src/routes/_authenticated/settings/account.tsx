import { createFileRoute } from '@tanstack/react-router'
import { AccountSettingsPage } from '@/features/admin-console/shared'

export const Route = createFileRoute('/_authenticated/settings/account')({
  component: AccountSettingsPage,
})
