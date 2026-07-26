import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import { getOrganization, searchOrganizations } from '@/api/organizations'
import type { Organization } from '@/api/types'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Debounced server-side search combobox over /admin/organizations. */
export function OrganizationCombobox({
  value,
  label,
  onChange,
  allowClear,
  modal = false,
  portalled = true,
  placeholder = 'Choose organization',
}: {
  value?: string
  label?: string
  onChange: (organizationId: string | undefined, organization?: Organization) => void
  allowClear?: boolean
  modal?: boolean
  portalled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pickedLabel, setPickedLabel] = useState<string>()

  const debouncedSearch = useDebouncedValue(search)

  const shouldSearchOrganizations = open
  const shouldResolveOrganization = Boolean(value) && !label && !pickedLabel

  const organizations = useQuery({
    queryKey: ['organizations', 'search', debouncedSearch],
    queryFn: () => searchOrganizations(debouncedSearch),
    enabled: shouldSearchOrganizations,
  })

  const resolvedOrganization = useQuery({
    queryKey: ['organizations', 'resolve', value],
    queryFn: () => getOrganization(value!),
    enabled: shouldResolveOrganization,
  })

  const displayLabel = value
    ? (pickedLabel ?? label ?? resolvedOrganization.data?.name)
    : undefined

  const isResolvingSelectedOrganization =
    shouldResolveOrganization && resolvedOrganization.isFetching

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
            {isResolvingSelectedOrganization
              ? 'Loading organization...'
              : (displayLabel ?? placeholder)}
          </span>

          <ChevronsUpDown className='size-4 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-64 p-0' align='start' portalled={portalled}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search organizations...'
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            <CommandEmpty>
              {organizations.isFetching
                ? 'Searching...'
                : organizations.isError
                  ? 'Failed to load organizations.'
                  : 'No organizations found.'}
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
                  All organizations
                </CommandItem>
              )}

              {organizations.data?.items.map((organization) => (
                <CommandItem
                  key={organization.id}
                  value={organization.id}
                  onSelect={() => {
                    onChange(organization.id, organization)
                    setPickedLabel(organization.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      value === organization.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />

                  {organization.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
