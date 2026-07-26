import type { ListQuery } from '@/api/types'

export type QueryState = ListQuery & {
  roleId?: string
  isBanned?: boolean
  action?: string
  status?: string
  actorType?: string
}

export const defaultQuery: QueryState = {
  page: 1,
  limit: 10,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
}
