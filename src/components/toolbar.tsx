import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ToolbarQuery = {
  search?: string
  page?: number
  createdFrom?: string
  createdTo?: string
}

export function Toolbar<TQuery extends ToolbarQuery>({
  query,
  onChange,
  defaultQuery,
  children,
  showDateRange,
}: {
  query: TQuery
  onChange: (query: TQuery) => void
  defaultQuery: TQuery
  children?: React.ReactNode
  showDateRange?: boolean
}) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='relative'>
        <Search className='absolute top-2.5 left-2.5 size-4 text-muted-foreground' />
        <Input
          className='h-9 w-64 ps-8'
          placeholder='Search...'
          value={query.search ?? ''}
          onChange={(event) =>
            onChange({ ...query, page: 1, search: event.target.value })
          }
        />
      </div>
      {showDateRange && (
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            aria-label='Created from'
            className='h-9 w-36'
            type='date'
            value={query.createdFrom ?? ''}
            onChange={(event) =>
              onChange({
                ...query,
                page: 1,
                createdFrom: event.target.value,
              })
            }
          />
          <Input
            aria-label='Created to'
            className='h-9 w-36'
            type='date'
            min={query.createdFrom || undefined}
            value={query.createdTo ?? ''}
            onChange={(event) =>
              onChange({
                ...query,
                page: 1,
                createdTo: event.target.value,
              })
            }
          />
        </div>
      )}
      {children}
      <Button
        variant='outline'
        size='sm'
        onClick={() => onChange({ ...defaultQuery })}
      >
        Reset
      </Button>
    </div>
  )
}
