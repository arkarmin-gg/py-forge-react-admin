import { apiRequest, getApiOrigin } from './client'
import {
  getPaginationQuery,
  toActivityLog,
  toAdmin,
  toPaginated,
  toPermission,
  toRole,
  toSetting,
  type HealthStatus,
  type ActivityLogPageWire,
  type AdminPageWire,
  type AdminWire,
  type ListQuery,
  type PermissionWire,
  type RolePageWire,
  type RoleWire,
  type Setting,
  type SettingWire,
  type SmtpSettings,
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

export async function getHealth() {
  return apiRequest<HealthStatus>({
    method: 'GET',
    url: `${getApiOrigin()}/health`,
  })
}

export async function listAdmins(params: AdminListQuery) {
  const page = getPaginationQuery(params)
  const data = await apiRequest<AdminPageWire>({
    method: 'GET',
    url: '/admin/admins',
    query: {
      limit: page.limit,
      offset: page.offset,
      sort: page.sort,
      search: params.search || undefined,
      is_banned: params.isBanned,
      role_ids: params.roleId ? [params.roleId] : undefined,
    },
  })

  return toPaginated(data, page.page, toAdmin)
}

export async function createAdmin(input: AdminInput) {
  const data = await apiRequest<AdminWire>({
    method: 'POST',
    url: '/admin/admins',
    body: toAdminFormData(input),
  })

  return toAdmin(data)
}

export async function updateAdmin(id: string, input: Partial<AdminInput>) {
  const data = await apiRequest<AdminWire>({
    method: 'PATCH',
    url: `/admin/admins/${id}`,
    body: toAdminFormData(input),
  })

  return toAdmin(data)
}

export async function deleteAdmin(id: string) {
  await apiRequest<void>({ method: 'DELETE', url: `/admin/admins/${id}` })
}

export async function deleteAdminProfileImage(id: string) {
  await apiRequest<AdminWire>({
    method: 'DELETE',
    url: `/admin/admins/${id}/profile-image`,
  })
}

export async function getRole(id: string) {
  const data = await apiRequest<RoleWire>({
    method: 'GET',
    url: `/admin/rbac/roles/${id}`,
  })

  return toRole(data)
}

export async function listRoles(params: ListQuery) {
  const page = getPaginationQuery(params)
  const data = await apiRequest<RolePageWire>({
    method: 'GET',
    url: '/admin/rbac/roles',
    query: {
      limit: page.limit,
      offset: page.offset,
      sort: page.sort,
      search: params.search || undefined,
    },
  })

  return toPaginated(data, page.page, toRole)
}

export function searchRoles(search: string, limit = 20) {
  return listRoles({ page: 1, limit, search })
}

export async function createRole(input: RoleInput) {
  const data = await apiRequest<RoleWire>({
    method: 'POST',
    url: '/admin/rbac/roles',
    body: toRoleCreate(input),
  })

  return toRole(data)
}

export async function updateRole(id: string, input: RoleInput) {
  const data = await apiRequest<RoleWire>({
    method: 'PATCH',
    url: `/admin/rbac/roles/${id}`,
    body: toRoleUpdate(input),
  })

  return toRole(data)
}

export async function deleteRole(id: string) {
  await apiRequest<void>({ method: 'DELETE', url: `/admin/rbac/roles/${id}` })
}

export async function listPermissions() {
  const data = await apiRequest<PermissionWire[]>({
    method: 'GET',
    url: '/admin/rbac/permissions',
  })

  return data.map(toPermission)
}

export async function listLogs(params: LogQuery) {
  const page = getPaginationQuery(params)
  const data = await apiRequest<ActivityLogPageWire>({
    method: 'GET',
    url: '/admin/logs',
    query: {
      limit: page.limit,
      offset: page.offset,
      sort: page.sort,
      actor_type: params.actorType,
      actor_id: params.actorId,
      action: params.action,
      status: params.status,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
    },
  })

  return toPaginated(data, page.page, toActivityLog)
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

function toAdminFormData(input: Partial<AdminInput>) {
  const formData = new FormData()
  const data = {
    full_name: input.fullName,
    email: input.email,
    password: input.password,
    role_id: input.roleId,
    is_banned: input.isBanned,
  }

  formData.append('data', JSON.stringify(data))
  if (input.profileImage instanceof File) {
    formData.append('profile_image', input.profileImage)
  }

  return formData
}

function toRoleCreate(input: RoleInput) {
  return {
    name: input.name,
    description: input.description,
    rank: input.rank ?? 99,
    permission_ids: input.permissionIds,
  }
}

function toRoleUpdate(input: RoleInput) {
  return {
    name: input.name,
    description: input.description,
    rank: input.rank,
    permission_ids: input.permissionIds,
  }
}

function isNotFound(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  )
}

async function getSetting<T = unknown>(key: string): Promise<Setting<T>> {
  const data = await apiRequest<SettingWire>({
    method: 'GET',
    url: `/admin/settings/${key}`,
  })

  return toSetting<T>(data)
}

async function upsertSetting<T = unknown>(
  key: string,
  input: { value: T; description?: string }
) {
  const data = await apiRequest<SettingWire>({
    method: 'PUT',
    url: `/admin/settings/${key}`,
    body: {
      value: input.value as Record<string, unknown>,
      description: input.description,
    },
  })

  return toSetting<T>(data)
}
