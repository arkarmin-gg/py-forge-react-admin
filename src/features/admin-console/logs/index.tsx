import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { type LogQuery, listLogs } from '@/api/admin'
import type { ActivityLog } from '@/api/types'
import { formatDate } from '@/lib/utils'
import { Pagination } from '@/components/pagination'
import { PageShell } from '@/components/page-shell'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Toolbar } from '@/components/toolbar'
import { TableRowActions } from '@/features/admin-console/components/table-row-actions'
import { useDebouncedQuery } from '@/features/admin-console/hooks/use-debounced-query'
import { defaultQuery, type QueryState } from '@/features/admin-console/types'
import { statusBadge } from '@/features/admin-console/utils'

const logActions = [
  'auth.login',
  'auth.logout',
  'admin.create',
  'admin.update',
  'admin.delete',
  'rbac.role.create',
  'rbac.role.update',
  'rbac.role.delete',
  'settings.upsert',
  'settings.delete',
]

export function LogsPage() {
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [viewing, setViewing] = useState<ActivityLog | null>(null)
  const debouncedQuery = useDebouncedQuery(query)
  const logs = useQuery({
    queryKey: ['logs', debouncedQuery],
    queryFn: () => {
      const params: LogQuery = {
        ...debouncedQuery,
        sortBy: debouncedQuery.sortBy ?? 'createdAt',
        sortOrder: debouncedQuery.sortOrder ?? 'DESC',
      }
      return listLogs(params)
    },
  })

  return (
    <PageShell
      title='Logs'
      description='Inspect backend activity with server-side pagination and filters.'
    >
      <Toolbar
        query={query}
        onChange={setQuery}
        defaultQuery={defaultQuery}
        showDateRange
      >
        <Select
          value={query.actorType ?? 'all'}
          onValueChange={(value) =>
            setQuery({
              ...query,
              page: 1,
              actorType: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className='h-9 w-36'>
            <SelectValue placeholder='Actor' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All actors</SelectItem>
            <SelectItem value='admin'>Admin</SelectItem>
            <SelectItem value='user'>User</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={query.action ?? 'all'}
          onValueChange={(value) =>
            setQuery({
              ...query,
              page: 1,
              action: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className='h-9 w-48'>
            <SelectValue placeholder='Action' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All actions</SelectItem>
            {logActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <SelectTrigger className='h-9 w-40'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All status</SelectItem>
            <SelectItem value='success'>success</SelectItem>
            <SelectItem value='failure'>failure</SelectItem>
          </SelectContent>
        </Select>
      </Toolbar>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.data?.items.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.actorType}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{statusBadge(log.status)}</TableCell>
                <TableCell>{log.ipAddress ?? '-'}</TableCell>
                <TableCell>{formatDate(log.createdAt)}</TableCell>
                <TableCell>
                  <TableRowActions
                    actions={[
                      {
                        label: 'View details',
                        icon: <Eye />,
                        onSelect: () => setViewing(log),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!logs.data?.items.length && (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  {logs.isLoading ? 'Loading logs...' : 'No logs found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={logs.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Log detail</DialogTitle>
            <DialogDescription>Raw backend log payload.</DialogDescription>
          </DialogHeader>
          <pre className='overflow-auto rounded-md bg-muted p-4 text-xs'>
            {JSON.stringify(viewing, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
