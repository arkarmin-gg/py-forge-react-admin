import type { QueryState } from '@/features/admin-console/types'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export function useDebouncedQuery(query: QueryState): QueryState {
  const debouncedSearch = useDebouncedValue(query.search, 300)
  return { ...query, search: debouncedSearch }
}
