import { toast } from 'sonner'
import { ApiError } from '@/api/client'

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'No content.'
  }

  if (error instanceof ApiError) {
    const data = error.data

    const title =
      data && typeof data === 'object' && 'title' in data
        ? data.title
        : undefined
    const message =
      data && typeof data === 'object' && 'message' in data
        ? data.message
        : undefined
    const detail =
      data && typeof data === 'object' && 'detail' in data
        ? data.detail
        : undefined

    if (typeof detail === 'string' && detail.length > 0) errMsg = detail
    if (typeof title === 'string' && title.length > 0) errMsg = title
    if (typeof message === 'string' && message.length > 0) errMsg = message
  } else if (error instanceof Error && error.message.length > 0) {
    errMsg = error.message
  }

  toast.error(errMsg)
}
