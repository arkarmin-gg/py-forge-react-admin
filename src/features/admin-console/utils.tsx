import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function statusBadge(value: boolean | string) {
  const banned = value === true || String(value).toLowerCase() === 'failure'
  return (
    <Badge variant='outline' className={cn(banned && 'border-destructive')}>
      {typeof value === 'boolean' ? (value ? 'Banned' : 'Active') : value}
    </Badge>
  )
}
