import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { resetOrganizationUserPassword } from '@/api/organizations'
import type { Organization, ResetPasswordResult } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyField } from '@/components/copy-field'

export function ResetPasswordDialog({
  open,
  organization,
  onOpenChange,
}: {
  open: boolean
  organization: Organization | null
  onOpenChange: (open: boolean) => void
}) {
  const [userId, setUserId] = useState('')
  const [result, setResult] = useState<ResetPasswordResult | null>(null)
  const mutation = useMutation({
    mutationFn: (input: { organizationId: string; userId: string }) =>
      resetOrganizationUserPassword(input.organizationId, input.userId),
    onSuccess: setResult,
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organization) return
    mutation.mutate({ organizationId: organization.id, userId })
  }

  function close() {
    onOpenChange(false)
  }

  if (result) {
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Password reset</DialogTitle>
            <DialogDescription>
              This temporary password is shown only once for{' '}
              {result.user.fullName} ({result.user.email}). Copy it now and
              relay it securely.
            </DialogDescription>
          </DialogHeader>
          <CopyField
            label='Temporary password'
            value={result.temporaryPassword}
          />
          <DialogFooter>
            <Button onClick={close}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>Reset user password</DialogTitle>
            <DialogDescription>
              Reset the password for a tenant user in{' '}
              {organization?.name ?? 'this organization'}. There is no endpoint
              to browse this organization's members, so paste the user ID
              directly (e.g. from the onboarding result or a support ticket).
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Label>User ID</Label>
            <Input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder='00000000-0000-0000-0000-000000000000'
              required
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={close}>
              Cancel
            </Button>
            <Button disabled={mutation.isPending || !userId}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
