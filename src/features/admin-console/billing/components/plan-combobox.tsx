import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import { getPlan, searchPlans } from '@/api/billing'
import type { Plan } from '@/api/types'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/** Debounced server-side search combobox over /admin/billing/plans. */
export function PlanCombobox({
  value,
  label,
  onChange,
  allowClear,
  modal = false,
  portalled = true,
  placeholder = 'Choose plan',
}: {
  value?: string
  label?: string
  onChange: (planId: string | undefined, plan?: Plan) => void
  allowClear?: boolean
  modal?: boolean
  portalled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pickedLabel, setPickedLabel] = useState<string>()

  const debouncedSearch = useDebouncedValue(search)

  const shouldSearchPlans = open
  const shouldResolvePlan = Boolean(value) && !label && !pickedLabel

  const plans = useQuery({
    queryKey: ['plans', 'search', debouncedSearch],
    queryFn: () => searchPlans(debouncedSearch),
    enabled: shouldSearchPlans,
  })

  const resolvedPlan = useQuery({
    queryKey: ['plans', 'resolve', value],
    queryFn: () => getPlan(value!),
    enabled: shouldResolvePlan,
  })

  const displayLabel = value
    ? (pickedLabel ?? label ?? resolvedPlan.data?.name)
    : undefined

  const isResolvingSelectedPlan = shouldResolvePlan && resolvedPlan.isFetching

  return (
    <Popover
      modal={modal}
      open={open}
      onOpenChange={(next) => {
        setOpen(next)

        if (!next) {
          setSearch('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='justify-between font-normal'
        >
          <span className={cn(!displayLabel && 'text-muted-foreground')}>
            {isResolvingSelectedPlan
              ? 'Loading plan...'
              : (displayLabel ?? placeholder)}
          </span>

          <ChevronsUpDown className='size-4 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-64 p-0' align='start' portalled={portalled}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search plans...'
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            <CommandEmpty>
              {plans.isFetching
                ? 'Searching...'
                : plans.isError
                  ? 'Failed to load plans.'
                  : 'No plans found.'}
            </CommandEmpty>

            <CommandGroup>
              {allowClear && !search && (
                <CommandItem
                  value='__all__'
                  onSelect={() => {
                    onChange(undefined)
                    setPickedLabel(undefined)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      !value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  All plans
                </CommandItem>
              )}

              {plans.data?.items.map((plan) => (
                <CommandItem
                  key={plan.id}
                  value={plan.id}
                  onSelect={() => {
                    onChange(plan.id, plan)
                    setPickedLabel(plan.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      value === plan.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />

                  {plan.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
