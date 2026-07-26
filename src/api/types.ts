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
  createdFrom?: string
  createdTo?: string
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
  status: string
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
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

export type DashboardWindow = {
  fromAt: string
  toAt: string
  timezone: string
}

export type ScanTrendPoint = {
  date: string
  scanCount: number
}

export type SubscriptionStatusCount = {
  status: string
  count: number
}

export type PlatformTopOrganization = {
  organizationId: string
  organizationName: string
  scanCount: number
}

export type PlatformTopBranch = {
  branchId: string
  branchName: string
  organizationId: string
  organizationName: string
  scanCount: number
}

export type PlatformDashboard = {
  window: DashboardWindow
  activeOrganizations: number
  suspendedOrganizations: number
  totalBranches: number
  totalTables: number
  totalCategories: number
  totalItems: number
  subscriptionStatuses: SubscriptionStatusCount[]
  monthlyRecurringRevenue: string
  scanCount: number
  scanTrend: ScanTrendPoint[]
  topOrganizations: PlatformTopOrganization[]
  topBranches: PlatformTopBranch[]
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
  old_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
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

export type DashboardWindowWire = {
  from_at: string
  to_at: string
  timezone: string
}

export type ScanTrendPointWire = {
  date: string
  scan_count: number
}

export type SubscriptionStatusCountWire = {
  status: string
  count: number
}

export type PlatformTopOrganizationWire = {
  organization_id: string
  organization_name: string
  scan_count: number
}

export type PlatformTopBranchWire = {
  branch_id: string
  branch_name: string
  organization_id: string
  organization_name: string
  scan_count: number
}

export type PlatformDashboardWire = {
  window: DashboardWindowWire
  active_organizations: number
  suspended_organizations: number
  total_branches: number
  total_tables: number
  total_categories: number
  total_items: number
  subscription_statuses: SubscriptionStatusCountWire[]
  monthly_recurring_revenue: string
  scan_count: number
  scan_trend: ScanTrendPointWire[]
  top_organizations: PlatformTopOrganizationWire[]
  top_branches: PlatformTopBranchWire[]
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
    oldValue: log.old_value,
    newValue: log.new_value,
    metadata: log.meta,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    createdAt: log.created_at,
  }
}

export function toPlatformDashboard(
  dashboard: PlatformDashboardWire
): PlatformDashboard {
  return {
    window: {
      fromAt: dashboard.window.from_at,
      toAt: dashboard.window.to_at,
      timezone: dashboard.window.timezone,
    },
    activeOrganizations: dashboard.active_organizations,
    suspendedOrganizations: dashboard.suspended_organizations,
    totalBranches: dashboard.total_branches,
    totalTables: dashboard.total_tables,
    totalCategories: dashboard.total_categories,
    totalItems: dashboard.total_items,
    subscriptionStatuses: dashboard.subscription_statuses.map((item) => ({
      status: item.status,
      count: item.count,
    })),
    monthlyRecurringRevenue: dashboard.monthly_recurring_revenue,
    scanCount: dashboard.scan_count,
    scanTrend: dashboard.scan_trend.map((point) => ({
      date: point.date,
      scanCount: point.scan_count,
    })),
    topOrganizations: dashboard.top_organizations.map((organization) => ({
      organizationId: organization.organization_id,
      organizationName: organization.organization_name,
      scanCount: organization.scan_count,
    })),
    topBranches: dashboard.top_branches.map((branch) => ({
      branchId: branch.branch_id,
      branchName: branch.branch_name,
      organizationId: branch.organization_id,
      organizationName: branch.organization_name,
      scanCount: branch.scan_count,
    })),
  }
}

export type Organization = {
  id: string
  name: string
  slug: string
  isSuspended: boolean
  createdAt: string
  updatedAt: string
}

export type OrganizationWire = {
  id: string
  name: string
  slug: string
  is_suspended: boolean
  created_at: string
  updated_at: string
}

export type OrganizationPageWire = Page<OrganizationWire>

export function toOrganization(organization: OrganizationWire): Organization {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    isSuspended: organization.is_suspended,
    createdAt: organization.created_at,
    updatedAt: organization.updated_at,
  }
}

export type Plan = {
  id: string
  name: string
  maxBranches: number
  maxItemsPerBranch: number
  monthlyPrice: string
  createdAt: string
}

export type PlanWire = {
  id: string
  name: string
  max_branches: number
  max_items_per_branch: number
  monthly_price: string
  created_at: string
}

export type PlanPageWire = Page<PlanWire>

export function toPlan(plan: PlanWire): Plan {
  return {
    id: plan.id,
    name: plan.name,
    maxBranches: plan.max_branches,
    maxItemsPerBranch: plan.max_items_per_branch,
    monthlyPrice: plan.monthly_price,
    createdAt: plan.created_at,
  }
}

export const SUBSCRIPTION_STATUSES = ['active', 'canceled', 'past_due']

export type Subscription = {
  id: string
  organizationId: string
  organizationName: string
  planId: string
  plan: Plan
  status: string
  currentPeriodEnd?: string | null
  createdAt: string
  updatedAt: string
}

export type SubscriptionWire = {
  id: string
  organization_id: string
  organization_name: string
  plan_id: string
  plan: PlanWire
  status: string
  current_period_end?: string | null
  created_at: string
  updated_at: string
}

export type SubscriptionPageWire = Page<SubscriptionWire>

export function toSubscription(subscription: SubscriptionWire): Subscription {
  return {
    id: subscription.id,
    organizationId: subscription.organization_id,
    organizationName: subscription.organization_name,
    planId: subscription.plan_id,
    plan: toPlan(subscription.plan),
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    createdAt: subscription.created_at,
    updatedAt: subscription.updated_at,
  }
}

// Minimal shapes for the tenant-side entities embedded in an organization
// onboarding result — the full Branch/TenantUser resources are out of scope
// (tenant-level, not platform-admin).
export type OnboardedBranch = {
  id: string
  name: string
  slug: string
  timezone: string
}

export type BranchWire = {
  id: string
  organization_id: string
  name: string
  slug: string
  timezone: string
  created_at: string
  updated_at: string
}

function toOnboardedBranch(branch: BranchWire): OnboardedBranch {
  return {
    id: branch.id,
    name: branch.name,
    slug: branch.slug,
    timezone: branch.timezone,
  }
}

export type OnboardedOwner = {
  id: string
  fullName: string
  email: string
}

export type TenantUserWire = {
  id: string
  full_name: string
  email: string
  status: string
  must_reset_password: boolean
  created_at: string
  updated_at: string
}

function toOnboardedOwner(owner: TenantUserWire): OnboardedOwner {
  return {
    id: owner.id,
    fullName: owner.full_name,
    email: owner.email,
  }
}

export type OrganizationOnboardResultWire = {
  organization: OrganizationWire
  branch: BranchWire
  owner: TenantUserWire
  subscription: SubscriptionWire
  owner_temporary_password: string
}

export type OrganizationOnboardResult = {
  organization: Organization
  branch: OnboardedBranch
  owner: OnboardedOwner
  subscription: Subscription
  ownerTemporaryPassword: string
}

export function toOrganizationOnboardResult(
  data: OrganizationOnboardResultWire
): OrganizationOnboardResult {
  return {
    organization: toOrganization(data.organization),
    branch: toOnboardedBranch(data.branch),
    owner: toOnboardedOwner(data.owner),
    subscription: toSubscription(data.subscription),
    ownerTemporaryPassword: data.owner_temporary_password,
  }
}

export type ResetPasswordResultWire = {
  user: TenantUserWire
  temporary_password: string
}

export type ResetPasswordResult = {
  user: OnboardedOwner
  temporaryPassword: string
}

export function toResetPasswordResult(
  data: ResetPasswordResultWire
): ResetPasswordResult {
  return {
    user: toOnboardedOwner(data.user),
    temporaryPassword: data.temporary_password,
  }
}
