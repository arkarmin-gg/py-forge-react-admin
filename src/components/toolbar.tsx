import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Toolbar<TQuery extends { search?: string; page?: number }>({
  query,
  onChange,
  defaultQuery,
  children,
}: {
  query: TQuery
  onChange: (query: TQuery) => void
  defaultQuery: TQuery
  children?: React.ReactNode
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
