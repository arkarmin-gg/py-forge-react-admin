import { hasAnyPermission } from '@/lib/permissions'
import { useAdmin } from '@/features/admin-console/hooks/use-admin'

export function useCan(
  checks: { module: string; action: 'create' | 'read' | 'update' | 'delete' }[]
) {
  const admin = useAdmin()
  return hasAnyPermission(admin, checks)
}
