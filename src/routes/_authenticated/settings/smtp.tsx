import { createFileRoute } from '@tanstack/react-router'
import { SmtpSettingsPage } from '@/features/admin-console/settings/smtp'

export const Route = createFileRoute('/_authenticated/settings/smtp')({
  component: SmtpSettingsPage,
})
