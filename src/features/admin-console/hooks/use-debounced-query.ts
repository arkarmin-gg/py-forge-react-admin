import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { QueryState } from '@/features/admin-console/types'

export function useDebouncedQuery(query: QueryState): QueryState {
  const debouncedSearch = useDebouncedValue(query.search, 300)
  return { ...query, search: debouncedSearch }
}
