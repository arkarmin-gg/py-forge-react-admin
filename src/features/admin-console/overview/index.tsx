import { useQuery } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { getHealth } from '@/api/admin'
import { hasAnyPermission } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageShell } from '@/components/page-shell'
import { useAdmin } from '@/features/admin-console/hooks/use-admin'

export function OverviewPage() {
  const admin = useAdmin()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const status =
    typeof health.data?.status === 'string' ? health.data.status : 'OK'
  const quickLinks = [
    {
      label: 'Admins',
      href: '/admins',
      checks: [{ module: 'admins', action: 'read' as const }],
    },
    {
      label: 'Roles',
      href: '/roles',
      checks: [{ module: 'rbac', action: 'read' as const }],
    },
    {
      label: 'SMTP Settings',
      href: '/settings/smtp',
      checks: [{ module: 'settings', action: 'read' as const }],
    },
  ].filter((link) => hasAnyPermission(admin, link.checks))

  return (
    <PageShell
      title='Overview'
      description='Live admin status and shortcuts for this backend.'
    >
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
            <CardTitle className='text-base'>Signed In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-medium'>{admin?.fullName ?? 'Admin'}</div>
            <div className='text-sm text-muted-foreground'>{admin?.email}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-medium'>{admin?.role?.name ?? '-'}</div>
            <div className='text-sm text-muted-foreground'>
              Rank {admin?.role?.rank ?? '-'}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          {quickLinks.map((link) => (
            <Button key={link.href} asChild variant='outline'>
              <a href={link.href}>{link.label}</a>
            </Button>
          ))}
          {quickLinks.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No management shortcuts are available for your current role.
            </p>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
