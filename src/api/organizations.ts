import { apiRequest } from './client'
import {
  getPaginationQuery,
  toOrganization,
  toOrganizationOnboardResult,
  toPaginated,
  toResetPasswordResult,
  type ListQuery,
  type OrganizationOnboardResultWire,
  type OrganizationPageWire,
  type OrganizationWire,
  type ResetPasswordResultWire,
} from './types'

type OrganizationListQuery = ListQuery & { isSuspended?: boolean }

export type OrganizationOnboardInput = {
  name: string
  planId: string
  currentPeriodEnd?: string
  branch: {
    name: string
    timezone?: string
  }
  owner: {
    fullName: string
    email: string
  }
}

export async function listOrganizations(params: OrganizationListQuery) {
  const page = getPaginationQuery(params)
  const data = await apiRequest<OrganizationPageWire>({
    method: 'GET',
    url: '/admin/organizations',
    query: {
      limit: page.limit,
      offset: page.offset,
      sort: page.sort,
      search: params.search || undefined,
      is_suspended: params.isSuspended,
      created_from: params.createdFrom,
      created_to: params.createdTo,
    },
  })

  return toPaginated(data, page.page, toOrganization)
}

export async function createOrganization(input: OrganizationOnboardInput) {
  const data = await apiRequest<OrganizationOnboardResultWire>({
    method: 'POST',
    url: '/admin/organizations',
    body: {
      name: input.name,
      plan_id: input.planId,
      current_period_end: input.currentPeriodEnd,
      branch: {
        name: input.branch.name,
        timezone: input.branch.timezone,
      },
      owner: {
        full_name: input.owner.fullName,
        email: input.owner.email,
      },
    },
  })

  return toOrganizationOnboardResult(data)
}

export function searchOrganizations(search: string, limit = 20) {
  return listOrganizations({ page: 1, limit, search })
}

export async function getOrganization(id: string) {
  const data = await apiRequest<OrganizationWire>({
    method: 'GET',
    url: `/admin/organizations/${id}`,
  })

  return toOrganization(data)
}

export async function deleteOrganization(id: string) {
  await apiRequest<void>({ method: 'DELETE', url: `/admin/organizations/${id}` })
}

export async function setOrganizationSuspended(id: string, isSuspended: boolean) {
  const data = await apiRequest<OrganizationWire>({
    method: 'PATCH',
    url: `/admin/organizations/${id}/suspend`,
    body: { is_suspended: isSuspended },
  })

  return toOrganization(data)
}

export async function resetOrganizationUserPassword(
  organizationId: string,
  userId: string
) {
  const data = await apiRequest<ResetPasswordResultWire>({
    method: 'PATCH',
    url: `/admin/organizations/${organizationId}/users/${userId}/reset-password`,
  })

  return toResetPasswordResult(data)
}
