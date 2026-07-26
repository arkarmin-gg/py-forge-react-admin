import { apiRequest } from './client'
import {
  getPaginationQuery,
  toPaginated,
  toPlan,
  toSubscription,
  type ListQuery,
  type PlanPageWire,
  type PlanWire,
  type SubscriptionPageWire,
  type SubscriptionWire,
} from './types'

export type PlanInput = {
  name: string
  maxBranches: number
  maxItemsPerBranch: number
  monthlyPrice?: string | number
}

type SubscriptionListQuery = ListQuery & {
  organizationId?: string
  planId?: string
  status?: string
}

type SubscriptionInput = {
  organizationId: string
  planId: string
  status?: string
  currentPeriodEnd?: string | null
}

type SubscriptionUpdateInput = {
  planId?: string
  status?: string
  currentPeriodEnd?: string | null
}

export async function listPlans(params: ListQuery) {
  const page = getPaginationQuery(params)
  const data = await apiRequest<PlanPageWire>({
    method: 'GET',
    url: '/admin/billing/plans',
    query: {
      limit: page.limit,
      offset: page.offset,
      sort: page.sort,
      search: params.search || undefined,
      created_from: params.createdFrom,
      created_to: params.createdTo,
    },
  })

  return toPaginated(data, page.page, toPlan)
}

export function searchPlans(search: string, limit = 20) {
  return listPlans({ page: 1, limit, search })
}

export async function getPlan(id: string) {
  const data = await apiRequest<PlanWire>({
    method: 'GET',
    url: `/admin/billing/plans/${id}`,
  })

  return toPlan(data)
}

export async function createPlan(input: PlanInput) {
  const data = await apiRequest<PlanWire>({
    method: 'POST',
    url: '/admin/billing/plans',
    body: toPlanBody(input),
  })

  return toPlan(data)
}

export async function updatePlan(id: string, input: Partial<PlanInput>) {
  const data = await apiRequest<PlanWire>({
    method: 'PATCH',
    url: `/admin/billing/plans/${id}`,
    body: toPlanBody(input),
  })

  return toPlan(data)
}

export async function deletePlan(id: string) {
  await apiRequest<void>({
    method: 'DELETE',
    url: `/admin/billing/plans/${id}`,
  })
}

export async function listSubscriptions(params: SubscriptionListQuery) {
  const page = getPaginationQuery(params)
  const data = await apiRequest<SubscriptionPageWire>({
    method: 'GET',
    url: '/admin/billing/subscriptions',
    query: {
      limit: page.limit,
      offset: page.offset,
      sort: page.sort,
      organization_id: params.organizationId,
      plan_id: params.planId,
      status: params.status,
      created_from: params.createdFrom,
      created_to: params.createdTo,
    },
  })

  return toPaginated(data, page.page, toSubscription)
}

export async function createSubscription(input: SubscriptionInput) {
  const data = await apiRequest<SubscriptionWire>({
    method: 'POST',
    url: '/admin/billing/subscriptions',
    body: {
      organization_id: input.organizationId,
      plan_id: input.planId,
      status: input.status,
      current_period_end: input.currentPeriodEnd,
    },
  })

  return toSubscription(data)
}

export async function updateSubscription(
  id: string,
  input: SubscriptionUpdateInput
) {
  const data = await apiRequest<SubscriptionWire>({
    method: 'PATCH',
    url: `/admin/billing/subscriptions/${id}`,
    body: {
      plan_id: input.planId,
      status: input.status,
      current_period_end: input.currentPeriodEnd,
    },
  })

  return toSubscription(data)
}

export async function deleteSubscription(id: string) {
  await apiRequest<void>({
    method: 'DELETE',
    url: `/admin/billing/subscriptions/${id}`,
  })
}

function toPlanBody(input: Partial<PlanInput>) {
  return {
    name: input.name,
    max_branches: input.maxBranches,
    max_items_per_branch: input.maxItemsPerBranch,
    monthly_price: input.monthlyPrice,
  }
}
