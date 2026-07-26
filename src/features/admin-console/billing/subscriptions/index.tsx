import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteSubscription, listSubscriptions } from '@/api/billing'
import { SUBSCRIPTION_STATUSES, type Subscription } from '@/api/types'
import { formatDate, formatEnumLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
import { Pagination } from '@/components/pagination'
import { Toolbar } from '@/components/toolbar'
import { SubscriptionDialog } from '@/features/admin-console/billing/components/subscription-dialog'
import { TableRowActions } from '@/features/admin-console/components/table-row-actions'
import { useCan } from '@/features/admin-console/hooks/use-can'
import { useDebouncedQuery } from '@/features/admin-console/hooks/use-debounced-query'
import { OrganizationCombobox } from '@/features/admin-console/organizations/components/organization-combobox'
import { defaultQuery, type QueryState } from '@/features/admin-console/types'

export function SubscriptionsTab() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [organizationLabel, setOrganizationLabel] = useState<string>()
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [deleting, setDeleting] = useState<Subscription | null>(null)

  const canUpdate = useCan([{ module: 'billing', action: 'update' }])
  const canDelete = useCan([{ module: 'billing', action: 'delete' }])

  const debouncedQuery = useDebouncedQuery(query)
  const subscriptions = useQuery({
    queryKey: ['subscriptions', debouncedQuery],
    queryFn: () => listSubscriptions(debouncedQuery),
  })
  const remove = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: async () => {
      toast.success('Subscription deleted.')
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Toolbar
          query={query}
          onChange={setQuery}
          defaultQuery={defaultQuery}
          showDateRange
        >
          <OrganizationCombobox
            value={query.organizationId}
            label={organizationLabel}
            allowClear
            placeholder='All organizations'
            onChange={(organizationId, organization) => {
              setOrganizationLabel(organization?.name)
              setQuery({ ...query, page: 1, organizationId })
            }}
          />
          <Select
            value={query.status ?? 'all'}
            onValueChange={(value) =>
              setQuery({
                ...query,
                page: 1,
                status: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger className='h-9 w-36'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All status</SelectItem>
              {SUBSCRIPTION_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {formatEnumLabel(value.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Toolbar>
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period end</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-20' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.data?.items.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell className='font-mono text-xs'>
                  {subscription.organizationName}
                </TableCell>
                <TableCell>{subscription.plan.name}</TableCell>
                <TableCell>
                  <Badge variant='outline'>{subscription.status}</Badge>
                </TableCell>
                <TableCell>
                  {formatDate(subscription.currentPeriodEnd)}
                </TableCell>
                <TableCell>{formatDate(subscription.createdAt)}</TableCell>
                <TableCell>
                  <TableRowActions
                    actions={[
                      canUpdate && {
                        label: 'Edit',
                        icon: <Pencil />,
                        onSelect: () => setEditing(subscription),
                      },
                      canDelete && {
                        label: 'Delete',
                        icon: <Trash2 />,
                        variant: 'destructive',
                        onSelect: () => setDeleting(subscription),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!subscriptions.data?.items.length && (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  {subscriptions.isLoading
                    ? 'Loading subscriptions...'
                    : 'No subscriptions found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={subscriptions.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <SubscriptionDialog
        key={editing?.id ?? 'new'}
        open={Boolean(editing)}
        subscription={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete subscription'
        desc='Delete this subscription? This action cannot be undone.'
        destructive
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
