import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteAdmin, listAdmins } from '@/api/admin'
import type { Admin } from '@/api/types'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageShell } from '@/components/page-shell'
import { Pagination } from '@/components/pagination'
import { Toolbar } from '@/components/toolbar'
import { AdminDialog } from '@/features/admin-console/admins/components/admin-dialog'
import { useAdmin } from '@/features/admin-console/hooks/use-admin'
import { useCan } from '@/features/admin-console/hooks/use-can'
import { useDebouncedQuery } from '@/features/admin-console/hooks/use-debounced-query'
import { RoleCombobox } from '@/features/admin-console/roles/components/role-combobox'
import { defaultQuery, type QueryState } from '@/features/admin-console/types'
import { statusBadge } from '@/features/admin-console/utils'

export function AdminsPage() {
  const queryClient = useQueryClient()
  const currentAdmin = useAdmin()
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [roleFilterLabel, setRoleFilterLabel] = useState<string>()
  const [editing, setEditing] = useState<Admin | null>(null)
  const [deleting, setDeleting] = useState<Admin | null>(null)
  const canCreate = useCan([{ module: 'admins', action: 'create' }])
  const canUpdate = useCan([{ module: 'admins', action: 'update' }])
  const canDelete = useCan([{ module: 'admins', action: 'delete' }])

  const debouncedQuery = useDebouncedQuery(query)
  const admins = useQuery({
    queryKey: ['admins', debouncedQuery],
    queryFn: () => listAdmins(debouncedQuery),
  })
  const remove = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: async () => {
      toast.success('Admin deleted.')
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })

  return (
    <PageShell
      title='Admins'
      description='Manage admin accounts, roles, profile images, and access state.'
      actions={
        canCreate && (
          <Button onClick={() => setEditing({} as Admin)}>
            <Plus /> Add admin
          </Button>
        )
      }
    >
      <Toolbar query={query} onChange={setQuery} defaultQuery={defaultQuery}>
        <Select
          value={String(query.isBanned ?? 'all')}
          onValueChange={(value) =>
            setQuery({
              ...query,
              page: 1,
              isBanned: value === 'all' ? undefined : value === 'true',
            })
          }
        >
          <SelectTrigger className='h-9 w-36'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All status</SelectItem>
            <SelectItem value='false'>Active</SelectItem>
            <SelectItem value='true'>Banned</SelectItem>
          </SelectContent>
        </Select>
        <RoleCombobox
          value={query.roleId}
          label={roleFilterLabel}
          allowClear
          placeholder='All roles'
          onChange={(roleId, role) => {
            setRoleFilterLabel(role?.name)
            setQuery({ ...query, page: 1, roleId })
          }}
        />
      </Toolbar>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className='w-20' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.data?.items.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className='font-medium'>{admin.fullName}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.roleName ?? admin.roleId}</TableCell>
                <TableCell>{statusBadge(admin.isBanned)}</TableCell>
                <TableCell>{formatDate(admin.lastLoginAt)}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1'>
                    {canUpdate && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setEditing(admin)}
                      >
                        <Pencil />
                      </Button>
                    )}
                    {canDelete && admin.id !== currentAdmin?.id && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setDeleting(admin)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!admins.data?.items.length && (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  {admins.isLoading ? 'Loading admins...' : 'No admins found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={admins.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <AdminDialog
        key={editing?.id ?? 'new'}
        open={Boolean(editing)}
        admin={editing}
        currentAdmin={currentAdmin}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete admin'
        desc={`Delete ${deleting?.fullName ?? 'this admin'}? This action soft-deletes the account.`}
        destructive
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </PageShell>
  )
}
