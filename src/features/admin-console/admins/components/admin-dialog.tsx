import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  type AdminInput,
  createAdmin,
  deleteAdminProfileImage,
  updateAdmin,
} from '@/api/admin'
import type { Admin } from '@/api/types'
import { getInitials } from '@/lib/utils'
import { AvatarUpload } from '@/components/avatar-upload'
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
import { Switch } from '@/components/ui/switch'
import { RoleCombobox } from '@/features/admin-console/admins/components/role-combobox'

export function AdminDialog({
  open,
  admin,
  currentAdmin,
  onOpenChange,
}: {
  open: boolean
  admin: Admin | null
  currentAdmin: Admin | null
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(admin?.id)
  const [profileImage, setProfileImage] = useState<File>()
  const [roleId, setRoleId] = useState<string | undefined>(() => admin?.roleId)
  const mutation = useMutation({
    mutationFn: async (input: AdminInput) =>
      isEdit && admin?.id ? updateAdmin(admin.id, input) : createAdmin(input),
    onSuccess: async () => {
      toast.success(isEdit ? 'Admin updated.' : 'Admin created.')
      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      fullName: String(form.get('fullName') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? '') || undefined,
      roleId: roleId ?? '',
      isBanned: form.get('isBanned') === 'on',
      profileImage,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit admin' : 'Add admin'}</DialogTitle>
            <DialogDescription>
              Admin mutations are sent as multipart form data.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Label>Profile image</Label>
            <AvatarUpload
              name={admin?.fullName}
              fallback={getInitials(admin?.fullName)}
              initialImageUrl={admin?.profileImageUrl}
              file={profileImage}
              onFileChange={setProfileImage}
              onRemove={
                isEdit && admin?.id
                  ? async () => {
                      await deleteAdminProfileImage(admin.id)
                      await queryClient.invalidateQueries({
                        queryKey: ['admins'],
                      })
                      toast.success('Profile photo removed.')
                    }
                  : undefined
              }
              size='lg'
            />

            <Label>Full name</Label>
            <Input
              name='fullName'
              defaultValue={admin?.fullName ?? ''}
              required
            />
            <Label>Email</Label>
            <Input
              name='email'
              type='email'
              defaultValue={admin?.email ?? ''}
              required
            />
            <Label>Password {isEdit && '(leave blank to keep current)'}</Label>
            <Input name='password' type='password' />
            <Label>Role</Label>
            <RoleCombobox
              value={roleId}
              label={admin?.role?.name ?? admin?.roleName}
              modal
              portalled={false}
              onChange={(nextRoleId) => setRoleId(nextRoleId)}
            />
            {admin?.id !== currentAdmin?.id && (
              <label className='flex items-center gap-2 text-sm'>
                <Switch name='isBanned' defaultChecked={admin?.isBanned} />
                Banned
              </label>
            )}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending || !roleId}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
