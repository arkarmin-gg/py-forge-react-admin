type PaginatedResult<T> = {
  items: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type ListQuery = {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export type Module = {
  id: string
  name: string
  code: string
  parentId?: string | null
}

export type Permission = {
  id: string
  action: ActionType | string
  module: Module
}

export type Role = {
  id: string
  name: string
  description?: string | null
  rank: number
  permissions?: Permission[]
  createdAt: string
  updatedAt?: string
}

export type Admin = {
  id: string
  fullName: string
  email: string
  profileImageUrl?: string | null
  roleId: string
  roleName: string
  role?: Role
  isBanned: boolean
  isTwoFactorEnabled?: boolean
  lastLoginAt?: string | null
  lastLogoutAt?: string | null
  createdAt: string
  updatedAt: string
}

export type CurrentAdmin = Admin & {
  role: Role
}

type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export type Setting<T = unknown> = {
  id?: string
  key: string
  value: T
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export type SmtpSettings = {
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUsername?: string
  smtpPassword?: string
  smtpFromEmail: string
  smtpFromName: string
  smtpEnabled: boolean
}

export type ActivityLog = {
  id: string
  actorType: string
  actorId?: string | null
  action: string
  description?: string | null
  resourceType?: string | null
  resourceId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  device?: string | null
  browser?: string | null
  os?: string | null
  location?: string | null
  status: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export type HealthStatus = {
  status?: string
  environment?: string
  appName?: string
  version?: string
  timestamp?: string
}

type ActionType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

type Page<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

function toSnakeCase(key: string) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function buildSort(query: Pick<ListQuery, 'sortBy' | 'sortOrder'>) {
  if (!query.sortBy) return undefined
  const field = toSnakeCase(query.sortBy)
  return query.sortOrder === 'DESC' ? `-${field}` : field
}

export function getPaginationQuery(query: ListQuery = {}) {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sort: buildSort(query),
  }
}

export function toPaginated<Wire, App>(
  page: Page<Wire>,
  requestedPage: number,
  mapItem: (item: Wire) => App
): PaginatedResult<App> {
  return {
    items: page.items.map(mapItem),
    meta: {
      total: page.total,
      page: requestedPage,
      limit: page.limit,
      totalPages: Math.max(1, Math.ceil(page.total / page.limit)),
    },
  }
}

export type ModuleWire = {
  id: string
  name: string
  code: string
  parent_id?: string | null
}

export type PermissionWire = {
  id: string
  action: ActionType | string
  module: ModuleWire
}

export type RoleWire = {
  id: string
  name: string
  description?: string | null
  rank: number
  permissions: PermissionWire[]
  created_at: string
  updated_at?: string
}

export type AdminWire = {
  id: string
  full_name: string
  email: string
  profile_image_url?: string | null
  role_id: string
  role_name: string
  role?: RoleWire
  is_banned: boolean
  is_two_factor_enabled?: boolean
  last_login_at?: string | null
  last_logout_at?: string | null
  created_at: string
  updated_at: string
}

export type CurrentAdminWire = AdminWire & {
  role: RoleWire
}

export type TokenResponseWire = {
  access_token: string
  refresh_token: string
  token_type: string
}

export type SettingWire = {
  id?: string
  key: string
  value: unknown
  description?: string | null
  created_at?: string
  updated_at?: string
}

export type ActivityLogWire = {
  id: string
  actor_type: string
  actor_id?: string | null
  action: string
  description?: string | null
  resource_type?: string | null
  resource_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
  device?: string | null
  browser?: string | null
  os?: string | null
  location?: string | null
  status: string
  meta?: Record<string, unknown> | null
  created_at: string
}

export type AdminPageWire = Page<AdminWire>
export type RolePageWire = Page<RoleWire>
export type ActivityLogPageWire = Page<ActivityLogWire>

function toModule(module: ModuleWire): Module {
  return {
    id: module.id,
    name: module.name,
    code: module.code,
    parentId: module.parent_id,
  }
}

export function toPermission(permission: PermissionWire): Permission {
  return {
    id: permission.id,
    action: permission.action,
    module: toModule(permission.module),
  }
}

export function toRole(role: RoleWire): Role {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    rank: role.rank,
    permissions: role.permissions.map(toPermission),
    createdAt: role.created_at,
    updatedAt: role.updated_at,
  }
}

export function toAdmin(admin: AdminWire): Admin {
  return {
    id: admin.id,
    fullName: admin.full_name,
    email: admin.email,
    profileImageUrl: admin.profile_image_url,
    roleId: admin.role_id,
    roleName: admin.role_name,
    role: admin.role ? toRole(admin.role) : undefined,
    isBanned: admin.is_banned,
    isTwoFactorEnabled: admin.is_two_factor_enabled,
    lastLoginAt: admin.last_login_at,
    lastLogoutAt: admin.last_logout_at,
    createdAt: admin.created_at,
    updatedAt: admin.updated_at,
  }
}

export function toCurrentAdmin(admin: CurrentAdminWire): CurrentAdmin {
  return {
    ...toAdmin(admin),
    role: toRole(admin.role),
  }
}

export function toTokenResponse(token: TokenResponseWire): TokenResponse {
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    tokenType: token.token_type,
  }
}

export function toSetting<T = unknown>(setting: SettingWire) {
  return {
    id: setting.id,
    key: setting.key,
    value: setting.value as T,
    description: setting.description,
    createdAt: setting.created_at,
    updatedAt: setting.updated_at,
  } satisfies Setting<T>
}

export function toActivityLog(log: ActivityLogWire): ActivityLog {
  return {
    id: log.id,
    actorType: log.actor_type,
    actorId: log.actor_id,
    action: log.action,
    status: log.status,
    resourceType: log.resource_type,
    resourceId: log.resource_id,
    description: log.description,
    metadata: log.meta,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    createdAt: log.created_at,
  }
}
