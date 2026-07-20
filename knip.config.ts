import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: [
    'src/components/ui/**',
    'src/components/layout/app-title.tsx',
    'src/tanstack-table.d.ts',
  ],
  ignoreIssues: {
    'src/features/admin-console/shared.tsx': ['exports'],
  },
}

export default config
