import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { type PlanInput, createPlan, updatePlan } from '@/api/billing'
import type { Plan } from '@/api/types'
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

export function PlanDialog({
  open,
  plan,
  onOpenChange,
}: {
  open: boolean
  plan: Plan | null
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(plan?.id)
  const mutation = useMutation({
    mutationFn: async (input: PlanInput) =>
      isEdit && plan?.id ? updatePlan(plan.id, input) : createPlan(input),
    onSuccess: async () => {
      toast.success(isEdit ? 'Plan updated.' : 'Plan created.')
      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      name: String(form.get('name') ?? ''),
      maxBranches: Number(form.get('maxBranches') ?? 1),
      maxItemsPerBranch: Number(form.get('maxItemsPerBranch') ?? 1),
      monthlyPrice: String(form.get('monthlyPrice') ?? '0'),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit plan' : 'Add plan'}</DialogTitle>
            <DialogDescription>
              Plans define branch and menu-item limits and the monthly price
              organizations are billed.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Label>Name</Label>
            <Input name='name' defaultValue={plan?.name ?? ''} required />
            <Label>Max branches</Label>
            <Input
              name='maxBranches'
              type='number'
              min={1}
              defaultValue={plan?.maxBranches ?? 1}
              required
            />
            <Label>Max items per branch</Label>
            <Input
              name='maxItemsPerBranch'
              type='number'
              min={1}
              defaultValue={plan?.maxItemsPerBranch ?? 1}
              required
            />
            <Label>Monthly price</Label>
            <Input
              name='monthlyPrice'
              type='number'
              min={0}
              step='0.01'
              defaultValue={plan?.monthlyPrice ?? '0'}
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
            <Button disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
