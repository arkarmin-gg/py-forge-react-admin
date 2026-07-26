import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSubscription, updateSubscription } from '@/api/billing'
import {
  SUBSCRIPTION_STATUSES,
  type Organization,
  type Plan,
  type Subscription,
} from '@/api/types'
import { formatEnumLabel } from '@/lib/utils'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlanCombobox } from '@/features/admin-console/billing/components/plan-combobox'
import { OrganizationCombobox } from '@/features/admin-console/organizations/components/organization-combobox'

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function SubscriptionDialog({
  open,
  subscription,
  onOpenChange,
}: {
  open: boolean
  subscription: Subscription | null
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(subscription?.id)
  const [organizationId, setOrganizationId] = useState<string | undefined>(
    () => subscription?.organizationId
  )
  const [planId, setPlanId] = useState<string | undefined>(
    () => subscription?.planId
  )
  const [status, setStatus] = useState(subscription?.status ?? 'active')

  const mutation = useMutation({
    mutationFn: async (currentPeriodEnd: string) => {
      const periodEnd = currentPeriodEnd
        ? new Date(currentPeriodEnd).toISOString()
        : null
      if (isEdit && subscription?.id) {
        return updateSubscription(subscription.id, {
          planId,
          status,
          currentPeriodEnd: periodEnd,
        })
      }
      return createSubscription({
        organizationId: organizationId ?? '',
        planId: planId ?? '',
        status,
        currentPeriodEnd: periodEnd,
      })
    },
    onSuccess: async () => {
      toast.success(isEdit ? 'Subscription updated.' : 'Subscription created.')
      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate(String(form.get('currentPeriodEnd') ?? ''))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit subscription' : 'Add subscription'}
            </DialogTitle>
            <DialogDescription>
              Subscribes an organization to a billing plan.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Label>Organization</Label>
            <OrganizationCombobox
              value={organizationId}
              label={undefined}
              modal
              portalled={false}
              onChange={(
                nextOrganizationId: string | undefined,
                organization?: Organization
              ) => setOrganizationId(nextOrganizationId ?? organization?.id)}
            />
            <Label>Plan</Label>
            <PlanCombobox
              value={planId}
              label={subscription?.plan.name}
              modal
              portalled={false}
              onChange={(nextPlanId: string | undefined, plan?: Plan) =>
                setPlanId(nextPlanId ?? plan?.id)
              }
            />
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatEnumLabel(value.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Current period end (optional)</Label>
            <Input
              name='currentPeriodEnd'
              type='datetime-local'
              defaultValue={toDateTimeLocalValue(
                subscription?.currentPeriodEnd
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                mutation.isPending || !planId || (!isEdit && !organizationId)
              }
            >
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
