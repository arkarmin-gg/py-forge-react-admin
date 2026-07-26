import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import { getRole, searchRoles } from '@/api/admin'
import type { Role } from '@/api/types'
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

/** Debounced server-side search combobox over /admin/rbac/roles. */
export function RoleCombobox({
  value,
  label,
  onChange,
  allowClear,
  modal = false,
  portalled = true,
  placeholder = 'Choose role',
}: {
  value?: string
  label?: string
  onChange: (roleId: string | undefined, role?: Role) => void
  allowClear?: boolean
  modal?: boolean
  portalled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pickedLabel, setPickedLabel] = useState<string>()

  const debouncedSearch = useDebouncedValue(search)

  const shouldSearchRoles = open
  const shouldResolveRole = Boolean(value) && !label && !pickedLabel

  const roles = useQuery({
    queryKey: ['roles', 'search', debouncedSearch],
    queryFn: () => searchRoles(debouncedSearch),
    enabled: shouldSearchRoles,
  })

  const resolvedRole = useQuery({
    queryKey: ['roles', 'resolve', value],
    queryFn: () => getRole(value!),
    enabled: shouldResolveRole,
  })

  const displayLabel = value
    ? (pickedLabel ?? label ?? resolvedRole.data?.name)
    : undefined

  const isResolvingSelectedRole = shouldResolveRole && resolvedRole.isFetching

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
            {isResolvingSelectedRole
              ? 'Loading role...'
              : (displayLabel ?? placeholder)}
          </span>

          <ChevronsUpDown className='size-4 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-64 p-0' align='start' portalled={portalled}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search roles...'
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            <CommandEmpty>
              {roles.isFetching
                ? 'Searching...'
                : roles.isError
                  ? 'Failed to load roles.'
                  : 'No roles found.'}
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
                  All roles
                </CommandItem>
              )}

              {roles.data?.items.map((role) => (
                <CommandItem
                  key={role.id}
                  value={role.id}
                  onSelect={() => {
                    onChange(role.id, role)
                    setPickedLabel(role.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      value === role.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />

                  {role.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
