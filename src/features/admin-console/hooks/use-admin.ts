import { useAuthStore } from '@/stores/auth-store'

export function useAdmin() {
  return useAuthStore((state) => state.auth.user)
}
