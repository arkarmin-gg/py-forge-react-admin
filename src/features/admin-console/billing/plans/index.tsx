import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deletePlan, listPlans } from '@/api/billing'
import type { Plan } from '@/api/types'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Pagination } from '@/components/pagination'
import { Toolbar } from '@/components/toolbar'
import { useCan } from '@/features/admin-console/hooks/use-can'
import { useDebouncedQuery } from '@/features/admin-console/hooks/use-debounced-query'
import { PlanDialog } from '@/features/admin-console/billing/components/plan-dialog'
import { defaultQuery, type QueryState } from '@/features/admin-console/types'

export function PlansTab() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [editing, setEditing] = useState<Plan | null>(null)
  const [deleting, setDeleting] = useState<Plan | null>(null)
  const canCreate = useCan([{ module: 'billing', action: 'create' }])
  const canUpdate = useCan([{ module: 'billing', action: 'update' }])
  const canDelete = useCan([{ module: 'billing', action: 'delete' }])

  const debouncedQuery = useDebouncedQuery(query)
  const plans = useQuery({
    queryKey: ['plans', debouncedQuery],
    queryFn: () => listPlans(debouncedQuery),
  })
  const remove = useMutation({
    mutationFn: deletePlan,
    onSuccess: async () => {
      toast.success('Plan deleted.')
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Toolbar query={query} onChange={setQuery} defaultQuery={defaultQuery} />
        {canCreate && (
          <Button onClick={() => setEditing({} as Plan)}>
            <Plus /> Add plan
          </Button>
        )}
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Max branches</TableHead>
              <TableHead>Max items/branch</TableHead>
              <TableHead>Monthly price</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-20' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.data?.items.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className='font-medium'>{plan.name}</TableCell>
                <TableCell>{plan.maxBranches}</TableCell>
                <TableCell>{plan.maxItemsPerBranch}</TableCell>
                <TableCell>{plan.monthlyPrice}</TableCell>
                <TableCell>{formatDate(plan.createdAt)}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1'>
                    {canUpdate && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setEditing(plan)}
                      >
                        <Pencil />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setDeleting(plan)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!plans.data?.items.length && (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  {plans.isLoading ? 'Loading plans...' : 'No plans found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={plans.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <PlanDialog
        key={editing?.id ?? 'new'}
        open={Boolean(editing)}
        plan={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete plan'
        desc={`Delete ${deleting?.name ?? 'this plan'}? Plans with active subscriptions cannot be deleted.`}
        destructive
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
