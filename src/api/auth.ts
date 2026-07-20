import { api, getData, toFormData } from './client'
import type { CurrentAdmin, TokenResponse } from './types'

type AdminLoginInput = {
  email: string
  password: string
}

type UpdateProfileInput = {
  fullName?: string
  email?: string
  profileImage?: File
}

export async function loginAdmin(input: AdminLoginInput) {
  const body = new URLSearchParams({
    username: input.email,
    password: input.password,
    grant_type: 'password',
  })
  return getData<TokenResponse>({
    method: 'POST',
    url: '/auth/admin/login',
    data: body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function logout() {
  await api.post('/auth/admin/logout')
}

export async function getCurrentAdmin() {
  return getData<CurrentAdmin>({ method: 'GET', url: '/auth/admin/me' })
}

export async function updateCurrentAdmin(input: UpdateProfileInput) {
  return getData<CurrentAdmin>({
    method: 'PATCH',
    url: '/auth/admin/me',
    data: toFormData(input),
  })
}

export async function changeCurrentPassword(input: {
  currentPassword: string
  newPassword: string
}) {
  await api.patch('/auth/admin/me/change-password', input)
}
