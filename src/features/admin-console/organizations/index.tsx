import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Plus, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  deleteOrganization,
  listOrganizations,
  setOrganizationSuspended,
} from '@/api/organizations'
import type { Organization } from '@/api/types'
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
import { useCan } from '@/features/admin-console/hooks/use-can'
import { useDebouncedQuery } from '@/features/admin-console/hooks/use-debounced-query'
import { OrganizationDialog } from '@/features/admin-console/organizations/components/organization-dialog'
import { ResetPasswordDialog } from '@/features/admin-console/organizations/components/reset-password-dialog'
import { defaultQuery, type QueryState } from '@/features/admin-console/types'
import { statusBadge } from '@/features/admin-console/utils'

export function OrganizationsPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<Organization | null>(null)
  const [deleting, setDeleting] = useState<Organization | null>(null)
  const canCreate = useCan([{ module: 'organizations', action: 'create' }])
  const canUpdate = useCan([{ module: 'organizations', action: 'update' }])
  const canDelete = useCan([{ module: 'organizations', action: 'delete' }])

  const debouncedQuery = useDebouncedQuery(query)
  const organizations = useQuery({
    queryKey: ['organizations', debouncedQuery],
    queryFn: () => listOrganizations(debouncedQuery),
  })
  const suspend = useMutation({
    mutationFn: (input: { id: string; isSuspended: boolean }) =>
      setOrganizationSuspended(input.id, input.isSuspended),
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.isSuspended ? 'Organization suspended.' : 'Organization unsuspended.'
      )
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
  const remove = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: async () => {
      toast.success('Organization deleted.')
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  return (
    <PageShell
      title='Organizations'
      description='Onboard and manage tenant organizations, their billing subscription, and suspension state.'
      actions={
        canCreate && (
          <Button onClick={() => setCreating(true)}>
            <Plus /> Create organization
          </Button>
        )
      }
    >
      <Toolbar query={query} onChange={setQuery} defaultQuery={defaultQuery}>
        <Select
          value={String(query.isSuspended ?? 'all')}
          onValueChange={(value) =>
            setQuery({
              ...query,
              page: 1,
              isSuspended: value === 'all' ? undefined : value === 'true',
            })
          }
        >
          <SelectTrigger className='h-9 w-36'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All status</SelectItem>
            <SelectItem value='false'>Active</SelectItem>
            <SelectItem value='true'>Suspended</SelectItem>
          </SelectContent>
        </Select>
      </Toolbar>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-32' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.data?.items.map((organization) => (
              <TableRow key={organization.id}>
                <TableCell className='font-medium'>
                  {organization.name}
                </TableCell>
                <TableCell>{organization.slug}</TableCell>
                <TableCell>{statusBadge(organization.isSuspended)}</TableCell>
                <TableCell>{formatDate(organization.createdAt)}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1'>
                    {canUpdate && (
                      <Button
                        variant='ghost'
                        size='icon'
                        title={
                          organization.isSuspended ? 'Unsuspend' : 'Suspend'
                        }
                        onClick={() =>
                          suspend.mutate({
                            id: organization.id,
                            isSuspended: !organization.isSuspended,
                          })
                        }
                      >
                        {organization.isSuspended ? (
                          <ShieldCheck />
                        ) : (
                          <ShieldOff />
                        )}
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        variant='ghost'
                        size='icon'
                        title='Reset user password'
                        onClick={() => setResetting(organization)}
                      >
                        <KeyRound />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setDeleting(organization)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!organizations.data?.items.length && (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  {organizations.isLoading
                    ? 'Loading organizations...'
                    : 'No organizations found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={organizations.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <OrganizationDialog
        key={creating ? 'open' : 'closed'}
        open={creating}
        onOpenChange={setCreating}
      />
      <ResetPasswordDialog
        key={resetting?.id ?? 'none'}
        open={Boolean(resetting)}
        organization={resetting}
        onOpenChange={(open) => !open && setResetting(null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete organization'
        desc={`Delete ${deleting?.name ?? 'this organization'}? This action cannot be undone.`}
        destructive
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </PageShell>
  )
}
