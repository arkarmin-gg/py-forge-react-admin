import type { Permission } from '@/api/types'
import { Checkbox } from '@/components/ui/checkbox'

/** Inline checkbox matrix grouped by module, with per-module select-all. */
export function PermissionPicker({
  permissions,
  selected,
  onToggle,
  onToggleModule,
}: {
  permissions: Permission[]
  selected: Set<string>
  onToggle: (permissionId: string) => void
  onToggleModule: (modulePermissions: Permission[], checked: boolean) => void
}) {
  const grouped = permissions.reduce<Record<string, Permission[]>>(
    (acc, permission) => {
      const key = permission.module?.name ?? 'Other'
      acc[key] ??= []
      acc[key].push(permission)
      return acc
    },
    {}
  )

  return (
    <div className='divide-y rounded-md border'>
      {Object.entries(grouped).map(([moduleName, modulePermissions]) => {
        const selectedCount = modulePermissions.filter((permission) =>
          selected.has(permission.id)
        ).length
        const moduleChecked =
          selectedCount === modulePermissions.length
            ? true
            : selectedCount > 0
              ? 'indeterminate'
              : false

        return (
          <div
            key={moduleName}
            className='flex flex-wrap items-center gap-x-4 gap-y-2 p-3'
          >
            <label className='flex min-w-32 items-center gap-2 font-medium'>
              <Checkbox
                checked={moduleChecked}
                onCheckedChange={(checked) =>
                  onToggleModule(modulePermissions, checked === true)
                }
              />
              {moduleName}
            </label>
            <div className='flex flex-wrap gap-x-4 gap-y-2'>
              {modulePermissions.map((permission) => (
                <label
                  key={permission.id}
                  className='flex items-center gap-2 text-sm text-muted-foreground'
                >
                  <Checkbox
                    checked={selected.has(permission.id)}
                    onCheckedChange={() => onToggle(permission.id)}
                  />
                  {permission.action.toLowerCase()}
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
