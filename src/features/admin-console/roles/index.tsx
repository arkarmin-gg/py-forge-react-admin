import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteRole, listPermissions, listRoles } from '@/api/admin'
import type { Role } from '@/api/types'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Pagination } from '@/components/pagination'
import { PageShell } from '@/components/page-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Toolbar } from '@/components/toolbar'
import { RoleDialog } from '@/features/admin-console/roles/components/role-dialog'
import { useCan } from '@/features/admin-console/hooks/use-can'
import { useDebouncedQuery } from '@/features/admin-console/hooks/use-debounced-query'
import { defaultQuery, type QueryState } from '@/features/admin-console/types'

export function RolesPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)
  const debouncedQuery = useDebouncedQuery(query)
  const roles = useQuery({
    queryKey: ['roles', debouncedQuery],
    queryFn: () => listRoles(debouncedQuery),
  })
  const permissions = useQuery({
    queryKey: ['permissions'],
    queryFn: listPermissions,
  })
  const canCreate = useCan([{ module: 'rbac', action: 'create' }])
  const canUpdate = useCan([{ module: 'rbac', action: 'update' }])
  const canDelete = useCan([{ module: 'rbac', action: 'delete' }])
  const remove = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      toast.success('Role deleted.')
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })

  return (
    <PageShell
      title='Roles & Permissions'
      description='Manage role ranks and permission assignments.'
      actions={
        canCreate && (
          <Button onClick={() => setEditing({} as Role)}>
            <Plus /> Add role
          </Button>
        )
      }
    >
      <Toolbar
        query={query}
        onChange={setQuery}
        defaultQuery={defaultQuery}
        showDateRange
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className='w-20' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.data?.items.map((role) => (
              <TableRow key={role.id}>
                <TableCell className='font-medium'>{role.name}</TableCell>
                <TableCell>{role.description ?? '-'}</TableCell>
                <TableCell>{role.rank}</TableCell>
                <TableCell>{role.permissions?.length ?? 0}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1'>
                    {canUpdate && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setEditing(role)}
                      >
                        <Pencil />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setDeleting(role)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!roles.data?.items.length && (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  {roles.isLoading ? 'Loading roles...' : 'No roles found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={roles.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <RoleDialog
        key={editing?.id ?? 'new'}
        open={Boolean(editing)}
        role={editing}
        permissions={permissions.data ?? []}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete role'
        desc={`Delete ${deleting?.name ?? 'this role'}?`}
        destructive
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </PageShell>
  )
}
