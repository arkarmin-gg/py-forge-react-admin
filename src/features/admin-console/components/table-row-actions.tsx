import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type TableRowAction = {
  label: string
  icon?: ReactNode
  onSelect: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

type TableRowActionsProps = {
  actions: Array<TableRowAction | false | null | undefined>
}

export function TableRowActions({ actions }: TableRowActionsProps) {
  const visibleActions = actions.filter(
    (action): action is TableRowAction => Boolean(action)
  )

  if (!visibleActions.length) {
    return null
  }

  return (
    <div className='flex justify-end'>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='Open row actions'>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {visibleActions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              variant={action.variant}
              onSelect={action.onSelect}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
