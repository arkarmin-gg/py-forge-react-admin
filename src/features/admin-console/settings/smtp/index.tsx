import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getSmtpSettings, updateSmtpSettings } from '@/api/admin'
import { Card, CardContent } from '@/components/ui/card'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function SmtpSettingsPage() {
  const queryClient = useQueryClient()
  const smtp = useQuery({
    queryKey: ['settings', 'smtp'],
    queryFn: getSmtpSettings,
  })
  const mutation = useMutation({
    mutationFn: updateSmtpSettings,
    onSuccess: async () => {
      toast.success('SMTP settings saved.')
      await queryClient.invalidateQueries({ queryKey: ['settings', 'smtp'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      smtpHost: String(form.get('smtpHost') ?? ''),
      smtpPort: Number(form.get('smtpPort') ?? 587),
      smtpSecure: form.get('smtpSecure') === 'on',
      smtpUsername: String(form.get('smtpUsername') ?? ''),
      smtpPassword: String(form.get('smtpPassword') ?? ''),
      smtpFromEmail: String(form.get('smtpFromEmail') ?? ''),
      smtpFromName: String(form.get('smtpFromName') ?? ''),
      smtpEnabled: form.get('smtpEnabled') === 'on',
    })
  }

  return (
    <PageShell
      title='SMTP Settings'
      description='Configure outbound email settings used by the backend.'
    >
      <Card>
        <CardContent className='pt-6'>
          <form onSubmit={submit} className='grid max-w-2xl gap-4'>
            <Label>Host</Label>
            <Input
              name='smtpHost'
              defaultValue={smtp.data?.smtpHost ?? ''}
              required
            />
            <Label>Port</Label>
            <Input
              name='smtpPort'
              type='number'
              defaultValue={smtp.data?.smtpPort ?? 587}
              required
            />
            <Label>Username</Label>
            <Input
              name='smtpUsername'
              defaultValue={smtp.data?.smtpUsername ?? ''}
            />
            <Label>Password</Label>
            <Input
              name='smtpPassword'
              type='password'
              defaultValue={smtp.data?.smtpPassword ?? ''}
            />
            <Label>From email</Label>
            <Input
              name='smtpFromEmail'
              type='email'
              defaultValue={smtp.data?.smtpFromEmail ?? ''}
              required
            />
            <Label>From name</Label>
            <Input
              name='smtpFromName'
              defaultValue={smtp.data?.smtpFromName ?? ''}
              required
            />
            <label className='flex items-center gap-2 text-sm'>
              <Switch
                name='smtpSecure'
                defaultChecked={smtp.data?.smtpSecure}
              />
              Use secure SMTP
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Switch
                name='smtpEnabled'
                defaultChecked={smtp.data?.smtpEnabled}
              />
              SMTP enabled
            </label>
            <Button
              className='w-fit'
              disabled={mutation.isPending || smtp.isLoading}
            >
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save SMTP settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
