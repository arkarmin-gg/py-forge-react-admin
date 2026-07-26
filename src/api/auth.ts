import { apiRequest } from './client'
import {
  toAdmin,
  toCurrentAdmin,
  toTokenResponse,
  type AdminWire,
  type CurrentAdmin,
  type CurrentAdminWire,
  type TokenResponseWire,
} from './types'

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
    scope: '',
  })
  const data = await apiRequest<TokenResponseWire>({
    method: 'POST',
    url: '/auth/admin/login',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  return toTokenResponse(data)
}

export async function logout() {
  await apiRequest<void>({ method: 'POST', url: '/auth/admin/logout' })
}

export async function refreshAdmin(refreshToken: string) {
  const data = await apiRequest<TokenResponseWire>({
    method: 'POST',
    url: '/auth/admin/refresh',
    body: { refresh_token: refreshToken },
  })

  return toTokenResponse(data)
}

export async function deleteCurrentAdmin() {
  await apiRequest<void>({ method: 'DELETE', url: '/auth/admin/me' })
}

export async function getCurrentAdmin(): Promise<CurrentAdmin> {
  const data = await apiRequest<CurrentAdminWire>({
    method: 'GET',
    url: '/auth/admin/me',
  })
  return toCurrentAdmin(data)
}

export async function updateCurrentAdmin(input: UpdateProfileInput) {
  const data = await apiRequest<AdminWire>({
    method: 'PATCH',
    url: '/auth/admin/me',
    body: toProfileFormData(input),
  })

  toAdmin(data)
  return getCurrentAdmin()
}

export async function changeCurrentPassword(input: {
  currentPassword: string
  newPassword: string
}) {
  await apiRequest<void>({
    method: 'PATCH',
    url: '/auth/admin/me/change-password',
    body: {
      current_password: input.currentPassword,
      new_password: input.newPassword,
    },
  })
}

export async function deleteCurrentAdminProfileImage() {
  const data = await apiRequest<AdminWire>({
    method: 'DELETE',
    url: '/auth/admin/me/profile-image',
  })

  toAdmin(data)
  return getCurrentAdmin()
}

function toProfileFormData(input: UpdateProfileInput) {
  const formData = new FormData()
  const data = {
    full_name: input.fullName,
    email: input.email,
  }

  formData.append('data', JSON.stringify(data))
  if (input.profileImage instanceof File) {
    formData.append('profile_image', input.profileImage)
  }

  return formData
}
