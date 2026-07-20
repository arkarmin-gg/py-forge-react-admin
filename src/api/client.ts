import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import type { ListQuery, PaginatedResult, TokenResponse } from './types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

export const api = axios.create({
  baseURL: API_BASE_URL,
})

function toSnakeCase(key: string) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function toCamelCase(key: string) {
  return key.replace(/_([a-z0-9])/g, (_match, letter) => letter.toUpperCase())
}

function transformKeys(
  value: unknown,
  convert: (key: string) => string
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => transformKeys(item, convert))
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof File) &&
    !(value instanceof FormData) &&
    !(value instanceof Date)
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        convert(key),
        transformKeys(val, convert),
      ])
    )
  }
  return value
}

/** Converts a request body from the app's camelCase to the wire's snake_case. */
function toWire<T>(value: T): unknown {
  return transformKeys(value, toSnakeCase)
}

/** Converts a response body from the wire's snake_case to the app's camelCase. */
function fromWire<T>(value: unknown): T {
  return transformKeys(value, toCamelCase) as T
}

let refreshPromise: Promise<string> | null = null

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (
    config.data &&
    !(config.data instanceof FormData) &&
    !(config.data instanceof URLSearchParams)
  ) {
    config.data = toWire(config.data)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequest | undefined
    const status = error.response?.status

    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const { refreshToken } = useAuthStore.getState().auth
    if (!refreshToken || original.url?.includes('/auth/admin/refresh')) {
      useAuthStore.getState().auth.reset()
      return Promise.reject(error)
    }

    original._retry = true

    try {
      refreshPromise ??= refreshAccessToken(refreshToken).finally(() => {
        refreshPromise = null
      })
      const accessToken = await refreshPromise
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (refreshError) {
      useAuthStore.getState().auth.reset()
      return Promise.reject(refreshError)
    }
  }
)

async function refreshAccessToken(refreshToken: string) {
  const response = await axios.post(
    `${API_BASE_URL}/auth/admin/refresh`,
    toWire({ refreshToken })
  )
  const { accessToken, refreshToken: nextRefreshToken } =
    fromWire<TokenResponse>(response.data)
  const state = useAuthStore.getState().auth
  state.setSession({ accessToken, refreshToken: nextRefreshToken })
  return accessToken
}

export async function getData<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request(config)
  if (response.status === 204 || response.data === undefined)
    return undefined as T
  return fromWire<T>(response.data)
}

type PyForgePage<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

function buildSort(query: Pick<ListQuery, 'sortBy' | 'sortOrder'>) {
  if (!query.sortBy) return undefined
  return query.sortOrder === 'DESC' ? `-${query.sortBy}` : query.sortBy
}

export async function getPaginated<T>(
  config: AxiosRequestConfig,
  query: ListQuery = {}
): Promise<PaginatedResult<T>> {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const response = await api.request<PyForgePage<unknown>>({
    ...config,
    params: {
      ...config.params,
      limit,
      offset: (page - 1) * limit,
      sort: buildSort(query),
    },
  })
  const raw = fromWire<PyForgePage<T>>(response.data)
  return {
    items: raw.items,
    meta: {
      total: raw.total,
      page,
      limit: raw.limit,
      totalPages: Math.max(1, Math.ceil(raw.total / raw.limit)),
    },
  }
}

export async function getList<T>(config: AxiosRequestConfig): Promise<T[]> {
  const response = await api.request(config)
  return fromWire<T[]>(response.data)
}

export function toFormData(values: Record<string, unknown>) {
  const formData = new FormData()
  const { profileImage, ...rest } = values
  formData.append('data', JSON.stringify(toWire(rest)))
  if (profileImage instanceof File) {
    formData.append('profile_image', profileImage)
  }
  return formData
}
