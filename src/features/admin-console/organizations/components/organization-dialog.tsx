import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import {
  type OrganizationOnboardInput,
  createOrganization,
} from '@/api/organizations'
import type { OrganizationOnboardResult, Plan } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CopyField } from '@/components/copy-field'
import { PlanCombobox } from '@/features/admin-console/billing/components/plan-combobox'

export function OrganizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [planId, setPlanId] = useState<string>()
  const [result, setResult] = useState<OrganizationOnboardResult | null>(null)
  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async (data) => {
      setResult(data)
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const currentPeriodEnd = String(form.get('currentPeriodEnd') ?? '')
    const input: OrganizationOnboardInput = {
      name: String(form.get('name') ?? ''),
      planId: planId ?? '',
      currentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd).toISOString()
        : undefined,
      branch: {
        name: String(form.get('branchName') ?? ''),
        timezone: String(form.get('branchTimezone') ?? '') || undefined,
      },
      owner: {
        fullName: String(form.get('ownerFullName') ?? ''),
        email: String(form.get('ownerEmail') ?? ''),
      },
    }
    mutation.mutate(input)
  }

  function close() {
    onOpenChange(false)
  }

  if (result) {
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Organization created</DialogTitle>
            <DialogDescription>
              This owner temporary password is shown only once. Copy it now and
              relay it to the organization owner securely.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>
            <div className='grid gap-1 text-sm'>
              <p>
                <span className='text-muted-foreground'>Organization: </span>
                {result.organization.name} ({result.organization.slug})
              </p>
              <p>
                <span className='text-muted-foreground'>Branch: </span>
                {result.branch.name}
              </p>
              <p>
                <span className='text-muted-foreground'>Owner: </span>
                {result.owner.fullName} ({result.owner.email})
              </p>
              <p>
                <span className='text-muted-foreground'>Plan: </span>
                {result.subscription.plan.name}
              </p>
            </div>
            <Separator />
            <CopyField
              label='Owner temporary password'
              value={result.ownerTemporaryPassword}
            />
          </div>
          <DialogFooter>
            <Button onClick={close}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-xl'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              Onboards a new organization with its first branch, billing plan,
              and owner account.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Label>Organization name</Label>
            <Input name='name' required />
            <Label>Plan</Label>
            <PlanCombobox
              value={planId}
              onChange={(nextPlanId: string | undefined, plan?: Plan) => {
                setPlanId(nextPlanId ?? plan?.id)
              }}
            />
            <Label>Initial billing period end (optional)</Label>
            <Input name='currentPeriodEnd' type='datetime-local' />

            <Separator />

            <Label>Branch name</Label>
            <Input name='branchName' required />
            <Label>Branch timezone</Label>
            <Input name='branchTimezone' placeholder='Asia/Yangon' />

            <Separator />

            <Label>Owner full name</Label>
            <Input name='ownerFullName' required />
            <Label>Owner email</Label>
            <Input name='ownerEmail' type='email' required />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={close}>
              Cancel
            </Button>
            <Button disabled={mutation.isPending || !planId}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Create organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
