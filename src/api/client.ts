import { useAuthStore } from '@/stores/auth-store'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

// Requests to these endpoints must never trigger a refresh-and-retry: the
// refresh endpoint itself would recurse, and a login 401 means bad
// credentials, not an expired session.
const AUTH_ENDPOINTS_EXEMPT_FROM_REFRESH = [
  '/auth/admin/refresh',
  '/auth/admin/login',
]

export class ApiError<TData = unknown> extends Error {
  response: Response
  data: TData

  constructor(response: Response, data: TData) {
    super(getErrorMessage(response, data))
    this.name = 'ApiError'
    this.response = response
    this.data = data
  }
}

type ApiRequestOptions = {
  method?: string
  url: string
  query?: Record<string, unknown>
  body?: BodyInit | Record<string, unknown> | unknown[]
  headers?: HeadersInit
}

export function getApiOrigin() {
  return new URL(API_BASE_URL).origin
}

export async function apiRequest<TData = unknown>(
  options: ApiRequestOptions,
  isRetry = false
): Promise<TData> {
  const { method = 'GET', url, query, body, headers } = options
  const response = await fetch(buildUrl(url, query), {
    method,
    headers: buildHeaders(headers, body),
    body: serializeBody(body),
  })

  const data = await parseResponse(response)
  if (!response.ok) {
    if (
      response.status === 401 &&
      !isRetry &&
      !AUTH_ENDPOINTS_EXEMPT_FROM_REFRESH.some((path) => url.includes(path))
    ) {
      const refreshed = await refreshSession()
      if (refreshed) return apiRequest<TData>(options, true)
    }
    throw new ApiError(response, data)
  }

  return data as TData
}

let refreshPromise: Promise<boolean> | null = null

function refreshSession() {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().auth.refreshToken
  if (!refreshToken) return false

  try {
    // Imported dynamically to avoid a circular import at module init time:
    // auth.ts imports apiRequest from this module.
    const { refreshAdmin } = await import('./auth')
    const token = await refreshAdmin(refreshToken)
    useAuthStore.getState().auth.setSession({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    })
    return true
  } catch {
    return false
  }
}

function buildUrl(url: string, query?: Record<string, unknown>) {
  const requestUrl = new URL(
    /^https?:\/\//.test(url)
      ? url
      : `${API_BASE_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
  )

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value)
        requestUrl.searchParams.append(key, String(item))
      continue
    }
    requestUrl.searchParams.set(key, String(value))
  }

  return requestUrl
}

function buildHeaders(headers: HeadersInit | undefined, body: unknown) {
  const nextHeaders = new Headers(headers)
  const token = useAuthStore.getState().auth.accessToken

  if (token) nextHeaders.set('Authorization', `Bearer ${token}`)
  if (body && !(body instanceof FormData) && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json')
  }

  return nextHeaders
}

function serializeBody(body: ApiRequestOptions['body']) {
  if (!body) return undefined
  if (body instanceof FormData || body instanceof URLSearchParams) return body
  if (typeof body === 'string') return body
  return JSON.stringify(body)
}

async function parseResponse(response: Response) {
  if (response.status === 204) return undefined

  const contentType = response.headers.get('Content-Type')
  const text = await response.text()
  if (text.length === 0) return undefined
  if (contentType?.includes('application/json')) return JSON.parse(text)

  return text.length > 0 ? text : undefined
}

function getErrorMessage(response: Response, data: unknown) {
  if (data && typeof data === 'object') {
    for (const key of ['message', 'detail', 'title']) {
      const value = (data as Record<string, unknown>)[key]
      if (typeof value === 'string' && value.length > 0) return value
    }
  }

  return response.statusText || `Request failed with status ${response.status}`
}
