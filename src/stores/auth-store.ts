import { create } from 'zustand'
import type { CurrentAdmin } from '@/api/types'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

const AUTH_COOKIE = 'py_forge_admin_auth'

type AuthSession = {
  accessToken: string
  refreshToken: string
}

type PersistedAuth = AuthSession & {
  user: CurrentAdmin | null
}

interface AuthState {
  auth: {
    user: CurrentAdmin | null
    accessToken: string
    refreshToken: string
    setUser: (user: CurrentAdmin | null) => void
    setSession: (session: AuthSession, user?: CurrentAdmin | null) => void
    reset: () => void
  }
}

function readPersistedAuth(): PersistedAuth {
  const fallback: PersistedAuth = {
    user: null,
    accessToken: '',
    refreshToken: '',
  }

  const raw = getCookie(AUTH_COOKIE)
  if (!raw) return fallback

  try {
    return { ...fallback, ...JSON.parse(decodeURIComponent(raw)) }
  } catch {
    removeCookie(AUTH_COOKIE)
    return fallback
  }
}

function persistAuth(value: PersistedAuth) {
  setCookie(AUTH_COOKIE, encodeURIComponent(JSON.stringify(value)))
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const persisted = readPersistedAuth()

  return {
    auth: {
      ...persisted,
      setUser: (user) =>
        set((state) => {
          const next = { ...state.auth, user }
          persistAuth({
            user,
            accessToken: next.accessToken,
            refreshToken: next.refreshToken,
          })
          return { auth: next }
        }),
      setSession: (session, user) =>
        set((state) => {
          const next = {
            ...state.auth,
            ...session,
            user: user === undefined ? state.auth.user : user,
          }
          persistAuth({
            user: next.user,
            accessToken: next.accessToken,
            refreshToken: next.refreshToken,
          })
          return { auth: next }
        }),
      reset: () =>
        set(() => {
          removeCookie(AUTH_COOKIE)
          return {
            auth: {
              ...get().auth,
              user: null,
              accessToken: '',
              refreshToken: '',
            },
          }
        }),
    },
  }
})
