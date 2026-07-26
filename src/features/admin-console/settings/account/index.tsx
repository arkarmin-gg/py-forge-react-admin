import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { changeCurrentPassword } from '@/api/auth'
import { Card, CardContent } from '@/components/ui/card'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AccountSettingsPage() {
  const mutation = useMutation({
    mutationFn: changeCurrentPassword,
    onSuccess: () => toast.success('Password changed.'),
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      currentPassword: String(form.get('currentPassword') ?? ''),
      newPassword: String(form.get('newPassword') ?? ''),
    })
    event.currentTarget.reset()
  }

  return (
    <PageShell title='Account' description='Change your admin password.'>
      <Card>
        <CardContent className='pt-6'>
          <form onSubmit={submit} className='grid max-w-xl gap-4'>
            <Label>Current password</Label>
            <Input name='currentPassword' type='password' required />
            <Label>New password</Label>
            <Input name='newPassword' type='password' required />
            <Button className='w-fit' disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
