import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { changeCurrentPassword, deleteCurrentAdmin } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function AccountSettingsPage() {
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const mutation = useMutation({
    mutationFn: changeCurrentPassword,
    onSuccess: () => toast.success('Password changed.'),
  })
  const deleteAccount = useMutation({
    mutationFn: deleteCurrentAdmin,
    onSuccess: async () => {
      useAuthStore.getState().auth.reset()
      toast.success('Account deleted.')
      await navigate({ to: '/sign-in', replace: true })
    },
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
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your own admin account. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant='destructive'
            className='w-fit'
            onClick={() => setConfirmingDelete(true)}
          >
            Delete account
          </Button>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title='Delete account'
        desc='Are you sure you want to delete your admin account? This will sign you out and cannot be undone.'
        confirmText='Delete account'
        destructive
        isLoading={deleteAccount.isPending}
        handleConfirm={() => deleteAccount.mutate()}
      />
    </PageShell>
  )
}
