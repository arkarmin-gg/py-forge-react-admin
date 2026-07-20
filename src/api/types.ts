export type PaginatedResult<T> = {
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
}

export type Permission = {
  id: string
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | string
  module: Module
}

export type Role = {
  id: string
  name: string
  description?: string | null
  rank: number
  permissions?: Permission[]
  createdAt: string
  updatedAt: string
}

export type Admin = {
  id: string
  fullName: string
  email: string
  profileImageUrl?: string | null
  roleId: string
  role?: Role
  isBanned: boolean
  isTwoFactorEnabled?: boolean
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export type CurrentAdmin = Admin

export type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export type Setting<T = unknown> = {
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
  id: number
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
