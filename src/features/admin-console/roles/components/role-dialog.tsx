import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { type RoleInput, createRole, updateRole } from '@/api/admin'
import type { Permission, Role } from '@/api/types'
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
import { Textarea } from '@/components/ui/textarea'
import { PermissionPicker } from '@/features/admin-console/roles/components/permission-picker'

export function RoleDialog({
  open,
  role,
  permissions,
  onOpenChange,
}: {
  open: boolean
  role: Role | null
  permissions: Permission[]
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(role?.id)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(role?.permissions?.map((item) => item.id) ?? [])
  )
  const mutation = useMutation({
    mutationFn: async (input: RoleInput) =>
      isEdit && role?.id ? updateRole(role.id, input) : createRole(input),
    onSuccess: async () => {
      toast.success(isEdit ? 'Role updated.' : 'Role created.')
      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })

  function togglePermission(permissionId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) next.delete(permissionId)
      else next.add(permissionId)
      return next
    })
  }

  function toggleModulePermissions(
    modulePermissions: Permission[],
    checked: boolean
  ) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const permission of modulePermissions) {
        if (checked) next.add(permission.id)
        else next.delete(permission.id)
      }
      return next
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      name: String(form.get('name') ?? ''),
      description: String(form.get('description') ?? '') || undefined,
      rank: Number(form.get('rank') ?? 99),
      permissionIds: Array.from(selected),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-2xl'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit role' : 'Add role'}</DialogTitle>
            <DialogDescription>
              Select the permissions this role grants.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Label>Name</Label>
            <Input name='name' defaultValue={role?.name ?? ''} required />
            <Label>Description</Label>
            <Textarea
              name='description'
              defaultValue={role?.description ?? ''}
            />
            <Label>Rank</Label>
            <Input
              name='rank'
              type='number'
              min={1}
              defaultValue={role?.rank ?? 99}
              required
            />
            <Label>Permissions</Label>
            <PermissionPicker
              permissions={permissions}
              selected={selected}
              onToggle={togglePermission}
              onToggleModule={toggleModulePermissions}
            />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
