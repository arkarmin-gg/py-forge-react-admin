import { createFileRoute } from '@tanstack/react-router'
import { SmtpSettingsPage } from '@/features/admin-console/shared'

export const Route = createFileRoute('/_authenticated/settings/smtp')({
  component: SmtpSettingsPage,
})
