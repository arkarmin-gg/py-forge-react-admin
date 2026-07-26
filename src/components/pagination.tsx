import { Button } from '@/components/ui/button'

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className='flex items-center justify-end gap-2'>
      <Button
        variant='outline'
        size='sm'
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className='text-sm text-muted-foreground'>
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <Button
        variant='outline'
        size='sm'
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}
