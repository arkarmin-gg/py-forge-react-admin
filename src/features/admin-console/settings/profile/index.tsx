import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCurrentAdminProfileImage, updateCurrentAdmin } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { getInitials } from '@/lib/utils'
import { AvatarUpload } from '@/components/avatar-upload'
import { Card, CardContent } from '@/components/ui/card'
import { PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfileSettingsPage() {
  const queryClient = useQueryClient()
  const auth = useAuthStore((state) => state.auth)
  const [profileImage, setProfileImage] = useState<File>()
  const mutation = useMutation({
    mutationFn: updateCurrentAdmin,
    onSuccess: async (user) => {
      auth.setUser(user)
      toast.success('Profile updated.')
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      fullName: String(form.get('fullName') ?? ''),
      email: String(form.get('email') ?? ''),
      profileImage,
    })
  }

  return (
    <PageShell title='Profile' description='Update your admin profile.'>
      <Card>
        <CardContent className='pt-6'>
          <form onSubmit={submit} className='grid max-w-xl gap-4'>
            <Label>Profile image</Label>
            <AvatarUpload
              name={auth.user?.fullName}
              fallback={getInitials(auth.user?.fullName)}
              initialImageUrl={auth.user?.profileImageUrl}
              file={profileImage}
              onFileChange={setProfileImage}
              onRemove={async () => {
                const user = await deleteCurrentAdminProfileImage()
                auth.setUser(user)
                await queryClient.invalidateQueries({
                  queryKey: ['auth', 'me'],
                })
                toast.success('Profile photo removed.')
              }}
              size='lg'
            />
            <Label>Full name</Label>
            <Input
              name='fullName'
              defaultValue={auth.user?.fullName ?? ''}
              required
            />
            <Label>Email</Label>
            <Input
              name='email'
              type='email'
              defaultValue={auth.user?.email ?? ''}
              required
            />

            <Button className='w-fit' disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
