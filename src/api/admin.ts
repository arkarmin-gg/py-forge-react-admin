import { api, getData, getList, getPaginated, toFormData } from './client'
import type {
  ActivityLog,
  Admin,
  HealthStatus,
  ListQuery,
  Permission,
  Role,
  Setting,
  SmtpSettings,
} from './types'

type AdminListQuery = ListQuery & { roleId?: string; isBanned?: boolean }

export type LogQuery = ListQuery & {
  actorType?: string
  actorId?: string
  action?: string
  status?: string
  resourceType?: string
  resourceId?: string
}

export type AdminInput = {
  fullName: string
  email: string
  password?: string
  roleId: string
  isBanned?: boolean
  profileImage?: File
}

export type RoleInput = {
  name: string
  description?: string
  rank?: number
  permissionIds: string[]
}

const SMTP_SETTING_KEY = 'smtp.config'

export function getHealth() {
  return getData<HealthStatus>({
    method: 'GET',
    url: `${new URL(api.defaults.baseURL ?? '').origin}/health`,
  })
}

export function listAdmins(params: AdminListQuery) {
  const { roleId, ...query } = params
  return getPaginated<Admin>(
    {
      method: 'GET',
      url: '/admin/admins',
      params: {
        search: query.search || undefined,
        is_banned: query.isBanned,
        role_ids: roleId,
      },
    },
    query
  )
}

export function createAdmin(input: AdminInput) {
  return getData<Admin>({
    method: 'POST',
    url: '/admin/admins',
    data: toFormData(input),
  })
}

export function updateAdmin(id: string, input: Partial<AdminInput>) {
  return getData<Admin>({
    method: 'PATCH',
    url: `/admin/admins/${id}`,
    data: toFormData(input),
  })
}

export async function deleteAdmin(id: string) {
  await api.delete(`/admin/admins/${id}`)
}

export function listRoles(params: ListQuery) {
  return getPaginated<Role>(
    {
      method: 'GET',
      url: '/admin/rbac/roles',
      params: { search: params.search || undefined },
    },
    params
  )
}

export function searchRoles(search: string, limit = 20) {
  return getPaginated<Role>(
    {
      method: 'GET',
      url: '/admin/rbac/roles',
      params: { search: search || undefined },
    },
    { page: 1, limit }
  )
}

export function createRole(input: RoleInput) {
  return getData<Role>({
    method: 'POST',
    url: '/admin/rbac/roles',
    data: input,
  })
}

export function updateRole(id: string, input: RoleInput) {
  return getData<Role>({
    method: 'PATCH',
    url: `/admin/rbac/roles/${id}`,
    data: input,
  })
}

export async function deleteRole(id: string) {
  await api.delete(`/admin/rbac/roles/${id}`)
}

export function listPermissions() {
  return getList<Permission>({
    method: 'GET',
    url: '/admin/rbac/permissions',
  })
}

export function listLogs(params: LogQuery) {
  return getPaginated<ActivityLog>(
    {
      method: 'GET',
      url: '/admin/logs',
      params: {
        search: params.search || undefined,
        actor_type: params.actorType,
        actor_id: params.actorId,
        action: params.action,
        status: params.status,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
      },
    },
    params
  )
}

function isNotFound(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  )
}

function getSetting<T = unknown>(key: string) {
  return getData<Setting<T>>({ method: 'GET', url: `/admin/settings/${key}` })
}

function upsertSetting<T = unknown>(
  key: string,
  input: { value: T; description?: string }
) {
  return getData<Setting<T>>({
    method: 'PUT',
    url: `/admin/settings/${key}`,
    data: input,
  })
}

export async function getSmtpSettings() {
  try {
    const setting = await getSetting<SmtpSettings>(SMTP_SETTING_KEY)
    return setting.value
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export async function updateSmtpSettings(value: SmtpSettings) {
  const setting = await upsertSetting<SmtpSettings>(SMTP_SETTING_KEY, {
    value,
    description: 'SMTP configuration used by the backend for outbound email.',
  })
  return setting.value
}
