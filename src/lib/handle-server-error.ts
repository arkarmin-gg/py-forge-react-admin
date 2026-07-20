import { AxiosError } from 'axios'
import { toast } from 'sonner'

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

  if (error instanceof AxiosError) {
    const data = error.response?.data
    const title =
      data && typeof data === 'object' && 'title' in data
        ? data.title
        : undefined
    const message =
      data && typeof data === 'object' && 'message' in data
        ? data.message
        : undefined
    if (typeof title === 'string' && title.length > 0) errMsg = title
    if (typeof message === 'string' && message.length > 0) errMsg = message
  }

  toast.error(errMsg)
}
