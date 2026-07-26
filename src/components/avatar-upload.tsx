import * as React from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn, validateImageFile } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

type AvatarUploadProps = {
  name?: string
  fallback: React.ReactNode
  initialImageUrl?: string | null
  file: File | undefined
  onFileChange: (file: File | undefined) => void
  onRemove?: () => Promise<void>
  size?: 'default' | 'lg'
  disabled?: boolean
}

export function AvatarUpload({
  name,
  fallback,
  initialImageUrl,
  file,
  onFileChange,
  onRemove,
  size = 'default',
  disabled,
}: AvatarUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [removed, setRemoved] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)

  const previewUrl = React.useMemo(
    () => (file ? URL.createObjectURL(file) : undefined),
    [file]
  )
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const displayImageUrl = file
    ? previewUrl
    : removed
      ? undefined
      : (initialImageUrl ?? undefined)

  const canRemove =
    Boolean(onRemove) &&
    (Boolean(file) || (Boolean(initialImageUrl) && !removed))

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return

    const error = validateImageFile(selected)
    if (error) {
      toast.error(error)
      event.target.value = ''
      return
    }

    onFileChange(selected)
    event.target.value = ''
  }

  function handleRemoveClick() {
    if (file) {
      onFileChange(undefined)
      return
    }
    setConfirmOpen(true)
  }

  async function confirmRemove() {
    if (!onRemove) return
    setRemoving(true)
    try {
      await onRemove()
      setRemoved(true)
      setConfirmOpen(false)
    } catch {
      toast.error('Failed to remove profile photo.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className='flex flex-col items-start gap-2'>
      <div className='relative'>
        <Avatar className={cn(size === 'lg' ? 'size-20' : 'size-8')}>
          <AvatarImage
            src={displayImageUrl}
            alt={name ? `${name}'s profile photo` : 'Profile photo'}
          />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <Button
          type='button'
          size='icon'
          variant='secondary'
          disabled={disabled}
          className='absolute -inset-e-1 -bottom-1 size-7 rounded-full'
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={14} />
          <span className='sr-only'>Change profile photo</span>
        </Button>
        <input
          ref={inputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp'
          className='sr-only'
          onChange={handleFileInputChange}
        />
      </div>
      {canRemove && (
        <Button
          type='button'
          variant='link'
          size='sm'
          className='h-auto p-0 text-muted-foreground hover:text-red-500'
          disabled={disabled}
          onClick={handleRemoveClick}
        >
          Remove photo
        </Button>
      )}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove profile photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the current profile photo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type='button' disabled={removing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type='button'
              disabled={removing}
              onClick={(event) => {
                event.preventDefault()
                void confirmRemove()
              }}
            >
              {removing && <Loader2 className='animate-spin' />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
