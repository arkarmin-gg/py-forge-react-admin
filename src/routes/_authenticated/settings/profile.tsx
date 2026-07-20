import { createFileRoute } from '@tanstack/react-router'
import { ProfileSettingsPage } from '@/features/admin-console/shared'

export const Route = createFileRoute('/_authenticated/settings/profile')({
  component: ProfileSettingsPage,
})
