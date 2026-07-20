import type { CurrentAdmin, Permission } from '@/api/types'

type PermissionVerb = 'create' | 'read' | 'update' | 'delete'

function normalizePermission(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}

function getAdminPermissions(admin: CurrentAdmin | null | undefined) {
  return admin?.role?.permissions ?? []
}

function hasPermission(
  admin: CurrentAdmin | null | undefined,
  moduleCodeOrName: string,
  action: PermissionVerb
) {
  const moduleKey = normalizePermission(moduleCodeOrName)
  const actionKey = normalizePermission(action)
  return getAdminPermissions(admin).some((permission) => {
    const module = permission.module
    return (
      normalizePermission(permission.action) === actionKey &&
      (normalizePermission(module?.code ?? '') === moduleKey ||
        normalizePermission(module?.name ?? '') === moduleKey)
    )
  })
}

export function hasAnyPermission(
  admin: CurrentAdmin | null | undefined,
  checks: { module: string; action: PermissionVerb }[]
) {
  return checks.some((check) =>
    hasPermission(admin, check.module, check.action)
  )
}

export function permissionLabel(permission: Permission) {
  const module = permission.module?.name ?? permission.module?.code ?? 'Module'
  return `${module}: ${permission.action.toLowerCase()}`
}
