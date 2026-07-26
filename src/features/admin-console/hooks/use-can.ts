import { useAdmin } from '@/features/admin-console/hooks/use-admin'
import { hasAnyPermission } from '@/lib/permissions'

export function useCan(
  checks: { module: string; action: 'create' | 'read' | 'update' | 'delete' }[]
) {
  const admin = useAdmin()
  return hasAnyPermission(admin, checks)
}
