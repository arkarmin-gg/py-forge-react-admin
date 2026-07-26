import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Building2, CreditCard, ScanLine, Store } from 'lucide-react'
import { getHealth, getPlatformDashboard } from '@/api/admin'
import type { PlatformDashboard } from '@/api/types'
import { formatDate, formatEnumLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageShell } from '@/components/page-shell'
import { useAdmin } from '@/features/admin-console/hooks/use-admin'

const dashboardLimit = 5

export function OverviewPage() {
  const admin = useAdmin()
  const [range, setRange] = useState({ from: '', to: '' })
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const dashboard = useQuery({
    queryKey: ['platform-dashboard', range, timezone],
    queryFn: () =>
      getPlatformDashboard({
        from: range.from,
        to: range.to,
        timezone,
        limit: dashboardLimit,
      }),
  })
  const status =
    typeof health.data?.status === 'string' ? health.data.status : 'OK'

  return (
    <PageShell
      title='Overview'
      description='Platform analytics, backend status, and shortcuts.'
      actions={
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            aria-label='Dashboard from'
            className='h-9 w-36'
            type='date'
            value={range.from}
            onChange={(event) =>
              setRange((current) => ({ ...current, from: event.target.value }))
            }
          />
          <Input
            aria-label='Dashboard to'
            className='h-9 w-36'
            type='date'
            min={range.from || undefined}
            value={range.to}
            onChange={(event) =>
              setRange((current) => ({ ...current, to: event.target.value }))
            }
          />
          <Button
            variant='outline'
            size='sm'
            onClick={() => setRange({ from: '', to: '' })}
          >
            Reset
          </Button>
        </div>
      }
    >
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          title='Organizations'
          value={dashboard.data?.activeOrganizations}
          detail={`${dashboard.data?.suspendedOrganizations ?? 0} suspended`}
          loading={dashboard.isLoading}
          icon={<Building2 className='size-5 text-muted-foreground' />}
        />
        <MetricCard
          title='MRR'
          value={formatMoney(dashboard.data?.monthlyRecurringRevenue)}
          detail={formatSubscriptionStatuses(dashboard.data)}
          loading={dashboard.isLoading}
          icon={<CreditCard className='size-5 text-muted-foreground' />}
        />
        <MetricCard
          title='Scans'
          value={dashboard.data?.scanCount}
          detail={formatWindow(dashboard.data)}
          loading={dashboard.isLoading}
          icon={<ScanLine className='size-5 text-muted-foreground' />}
        />
        <MetricCard
          title='Menu Footprint'
          value={dashboard.data?.totalItems}
          detail={`${dashboard.data?.totalBranches ?? 0} branches, ${dashboard.data?.totalTables ?? 0} tables`}
          loading={dashboard.isLoading}
          icon={<Store className='size-5 text-muted-foreground' />}
        />
      </div>
      <div className='grid gap-4 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader>
            <CardTitle className='text-base'>Scan Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ScanTrend
              dashboard={dashboard.data}
              loading={dashboard.isLoading}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Top Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList
              loading={dashboard.isLoading}
              items={(dashboard.data?.topOrganizations ?? []).map((item) => ({
                id: item.organizationId,
                label: item.organizationName,
                value: item.scanCount,
              }))}
            />
          </CardContent>
        </Card>
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>API Health</CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-2'>
            <Activity className='size-5 text-muted-foreground' />
            <span className='font-medium'>
              {health.isLoading ? 'Checking...' : status}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Top Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList
              loading={dashboard.isLoading}
              items={(dashboard.data?.topBranches ?? []).map((item) => ({
                id: item.branchId,
                label: item.branchName,
                detail: item.organizationName,
                value: item.scanCount,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Signed In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-medium'>
              {admin?.fullName ?? 'Admin'} - {admin?.role.name}
            </div>
            <div className='text-sm text-muted-foreground'>{admin?.email}</div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

function MetricCard({
  title,
  value,
  detail,
  loading,
  icon,
}: {
  title: string
  value?: string | number
  detail?: string
  loading: boolean
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-base'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-semibold'>
          {loading ? '...' : (value ?? 0)}
        </div>
        <div className='text-sm text-muted-foreground'>{detail || '-'}</div>
      </CardContent>
    </Card>
  )
}

function ScanTrend({
  dashboard,
  loading,
}: {
  dashboard?: PlatformDashboard
  loading: boolean
}) {
  const points = dashboard?.scanTrend ?? []
  const max = Math.max(...points.map((point) => point.scanCount), 1)

  if (loading)
    return <p className='text-sm text-muted-foreground'>Loading...</p>
  if (points.length === 0) {
    return <p className='text-sm text-muted-foreground'>No scan data found.</p>
  }

  return (
    <div className='flex h-56 items-end gap-2 overflow-x-auto pb-2'>
      {points.map((point) => (
        <div
          key={point.date}
          className='flex min-w-10 flex-1 flex-col items-center gap-2'
        >
          <div
            className='w-full rounded-t bg-primary/80'
            style={{ height: `${Math.max((point.scanCount / max) * 100, 4)}%` }}
            title={`${point.date}: ${point.scanCount}`}
          />
          <span className='text-xs text-muted-foreground'>
            {point.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

function RankedList({
  items,
  loading,
}: {
  items: { id: string; label: string; detail?: string; value: number }[]
  loading: boolean
}) {
  if (loading)
    return <p className='text-sm text-muted-foreground'>Loading...</p>
  if (items.length === 0) {
    return <p className='text-sm text-muted-foreground'>No scan data found.</p>
  }

  return (
    <div className='space-y-3'>
      {items.map((item) => (
        <div key={item.id} className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <div className='truncate font-medium'>{item.label}</div>
            {item.detail && (
              <div className='truncate text-sm text-muted-foreground'>
                {item.detail}
              </div>
            )}
          </div>
          <div className='font-mono text-sm'>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

function formatMoney(value?: string) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'MMK',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function formatSubscriptionStatuses(dashboard?: PlatformDashboard) {
  const statuses = dashboard?.subscriptionStatuses ?? []
  if (statuses.length === 0) return '0 subscriptions'
  return statuses
    .map((item) => `${formatEnumLabel(item.status)} ${item.count}`)
    .join(', ')
}

function formatWindow(dashboard?: PlatformDashboard) {
  if (!dashboard) return '-'
  return `${formatDate(dashboard.window.fromAt)} - ${formatDate(dashboard.window.toAt)}`
}
