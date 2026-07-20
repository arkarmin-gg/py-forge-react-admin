import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Check,
  ChevronsUpDown,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type AdminInput,
  type LogQuery,
  type RoleInput,
  createAdmin,
  createRole,
  deleteAdmin,
  deleteRole,
  getHealth,
  getSmtpSettings,
  listAdmins,
  listLogs,
  listPermissions,
  listRoles,
  searchRoles,
  updateAdmin,
  updateRole,
  updateSmtpSettings,
} from '@/api/admin'
import { changeCurrentPassword, updateCurrentAdmin } from '@/api/auth'
import type {
  ActivityLog,
  Admin,
  CurrentAdmin,
  ListQuery,
  Permission,
  Role,
} from '@/api/types'
import { useAuthStore } from '@/stores/auth-store'
import { hasAnyPermission, permissionLabel } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ConfigDrawer } from '@/components/config-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

type QueryState = ListQuery & {
  roleId?: string
  isBanned?: boolean
  action?: string
  status?: string
  actorType?: string
}

const defaultQuery: QueryState = {
  page: 1,
  limit: 10,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
}

const logActions = [
  'auth.login',
  'auth.logout',
  'admin.create',
  'admin.update',
  'admin.delete',
  'rbac.role.create',
  'rbac.role.update',
  'rbac.role.delete',
  'settings.upsert',
  'settings.delete',
]

function useAdmin() {
  return useAuthStore((state) => state.auth.user)
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  return debounced
}

function useDebouncedQuery(query: QueryState): QueryState {
  const debouncedSearch = useDebouncedValue(query.search, 300)
  return { ...query, search: debouncedSearch }
}

function PageShell({
  title,
  description,
  children,
  actions,
}: {
  title: string
  description: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <>
      <Header fixed>
        <div className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
            <p className='text-muted-foreground'>{description}</p>
          </div>
          {actions}
        </div>
        {children}
      </Main>
    </>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusBadge(value: boolean | string) {
  const banned = value === true || String(value).toLowerCase() === 'failure'
  return (
    <Badge variant='outline' className={cn(banned && 'border-destructive')}>
      {typeof value === 'boolean' ? (value ? 'Banned' : 'Active') : value}
    </Badge>
  )
}

function Toolbar({
  query,
  onChange,
  children,
}: {
  query: QueryState
  onChange: (query: QueryState) => void
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

function Pagination({
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

function FileInput({
  onChange,
}: {
  onChange: (file: File | undefined) => void
}) {
  return (
    <Input
      type='file'
      accept='image/*'
      onChange={(event) => onChange(event.target.files?.[0])}
    />
  )
}

function useCan(
  checks: { module: string; action: 'create' | 'read' | 'update' | 'delete' }[]
) {
  const admin = useAdmin()
  return hasAnyPermission(admin, checks)
}

/** Debounced server-side search combobox over /admin/rbac/roles. */
function RoleCombobox({
  value,
  label,
  onChange,
  allowClear,
  placeholder = 'Choose role',
}: {
  value?: string
  label?: string
  onChange: (roleId: string | undefined, role?: Role) => void
  allowClear?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pickedLabel, setPickedLabel] = useState<string>()
  const debouncedSearch = useDebouncedValue(search)
  const roles = useQuery({
    queryKey: ['roles', 'search', debouncedSearch],
    queryFn: () => searchRoles(debouncedSearch),
    enabled: open,
  })
  const displayLabel = pickedLabel ?? label

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
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
            {displayLabel ?? placeholder}
          </span>
          <ChevronsUpDown className='size-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-64 p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search roles...'
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {roles.isFetching ? 'Searching...' : 'No roles found.'}
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

/** Multi-select combobox that filters client-side over the full permissions list. */
function PermissionPicker({
  permissions,
  selected,
  onToggle,
}: {
  permissions: Permission[]
  selected: Set<string>
  onToggle: (permissionId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const grouped = permissions.reduce<Record<string, Permission[]>>(
    (acc, permission) => {
      const key = permission.module?.name ?? 'Other'
      acc[key] ??= []
      acc[key].push(permission)
      return acc
    },
    {}
  )
  const selectedPermissions = permissions.filter((permission) =>
    selected.has(permission.id)
  )

  return (
    <div className='grid gap-2'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='justify-between font-normal'
          >
            {selected.size > 0
              ? `${selected.size} permission${selected.size === 1 ? '' : 's'} selected`
              : 'Select permissions'}
            <ChevronsUpDown className='size-4 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-md p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search permissions...' />
            <CommandList className='max-h-80'>
              <CommandEmpty>No permissions found.</CommandEmpty>
              {Object.entries(grouped).map(
                ([moduleName, modulePermissions]) => (
                  <CommandGroup key={moduleName} heading={moduleName}>
                    {modulePermissions.map((permission) => (
                      <CommandItem
                        key={permission.id}
                        value={`${moduleName} ${permissionLabel(permission)}`}
                        onSelect={() => onToggle(permission.id)}
                      >
                        <Check
                          className={cn(
                            'size-4',
                            selected.has(permission.id)
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {permissionLabel(permission)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedPermissions.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {selectedPermissions.map((permission) => (
            <Badge key={permission.id} variant='secondary' className='gap-1'>
              {permissionLabel(permission)}
              <button
                type='button'
                onClick={() => onToggle(permission.id)}
                className='rounded-full hover:bg-muted-foreground/20'
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function OverviewPage() {
  const admin = useAdmin()
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth })
  const quickLinks = [
    {
      label: 'Admins',
      href: '/admins',
      checks: [{ module: 'admins', action: 'read' as const }],
    },
    {
      label: 'Roles',
      href: '/roles',
      checks: [{ module: 'rbac', action: 'read' as const }],
    },
    {
      label: 'SMTP Settings',
      href: '/settings/smtp',
      checks: [{ module: 'settings', action: 'read' as const }],
    },
  ].filter((link) => hasAnyPermission(admin, link.checks))

  return (
    <PageShell
      title='Overview'
      description='Live admin status and shortcuts for this backend.'
    >
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>API Health</CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-2'>
            <Activity className='size-5 text-muted-foreground' />
            <span className='font-medium'>
              {health.isLoading ? 'Checking...' : (health.data?.status ?? 'OK')}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Signed In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-medium'>{admin?.fullName ?? 'Admin'}</div>
            <div className='text-sm text-muted-foreground'>{admin?.email}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-medium'>{admin?.role?.name ?? '-'}</div>
            <div className='text-sm text-muted-foreground'>
              Rank {admin?.role?.rank ?? '-'}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          {quickLinks.map((link) => (
            <Button key={link.href} asChild variant='outline'>
              <a href={link.href}>{link.label}</a>
            </Button>
          ))}
          {quickLinks.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No management shortcuts are available for your current role.
            </p>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}

export function AdminsPage() {
  const queryClient = useQueryClient()
  const currentAdmin = useAdmin()
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [roleFilterLabel, setRoleFilterLabel] = useState<string>()
  const [editing, setEditing] = useState<Admin | null>(null)
  const [deleting, setDeleting] = useState<Admin | null>(null)
  const canCreate = useCan([{ module: 'admins', action: 'create' }])
  const canUpdate = useCan([{ module: 'admins', action: 'update' }])
  const canDelete = useCan([{ module: 'admins', action: 'delete' }])

  const debouncedQuery = useDebouncedQuery(query)
  const admins = useQuery({
    queryKey: ['admins', debouncedQuery],
    queryFn: () => listAdmins(debouncedQuery),
  })
  const remove = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: async () => {
      toast.success('Admin deleted.')
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })

  return (
    <PageShell
      title='Admins'
      description='Manage admin accounts, roles, profile images, and access state.'
      actions={
        canCreate && (
          <Button onClick={() => setEditing({} as Admin)}>
            <Plus /> Add admin
          </Button>
        )
      }
    >
      <Toolbar query={query} onChange={setQuery}>
        <Select
          value={String(query.isBanned ?? 'all')}
          onValueChange={(value) =>
            setQuery({
              ...query,
              page: 1,
              isBanned: value === 'all' ? undefined : value === 'true',
            })
          }
        >
          <SelectTrigger className='h-9 w-36'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All status</SelectItem>
            <SelectItem value='false'>Active</SelectItem>
            <SelectItem value='true'>Banned</SelectItem>
          </SelectContent>
        </Select>
        <RoleCombobox
          value={query.roleId}
          label={roleFilterLabel}
          allowClear
          placeholder='All roles'
          onChange={(roleId, role) => {
            setRoleFilterLabel(role?.name)
            setQuery({ ...query, page: 1, roleId })
          }}
        />
      </Toolbar>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className='w-20' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.data?.items.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className='font-medium'>{admin.fullName}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.role?.name ?? admin.roleId}</TableCell>
                <TableCell>{statusBadge(admin.isBanned)}</TableCell>
                <TableCell>{formatDate(admin.lastLoginAt)}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1'>
                    {canUpdate && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setEditing(admin)}
                      >
                        <Pencil />
                      </Button>
                    )}
                    {canDelete && admin.id !== currentAdmin?.id && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setDeleting(admin)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!admins.data?.items.length && (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  {admins.isLoading ? 'Loading admins...' : 'No admins found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={admins.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <AdminDialog
        key={editing?.id ?? 'new'}
        open={Boolean(editing)}
        admin={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete admin'
        desc={`Delete ${deleting?.fullName ?? 'this admin'}? This action soft-deletes the account.`}
        destructive
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </PageShell>
  )
}

function AdminDialog({
  open,
  admin,
  onOpenChange,
}: {
  open: boolean
  admin: Admin | null
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(admin?.id)
  const [profileImage, setProfileImage] = useState<File>()
  const [roleId, setRoleId] = useState<string | undefined>(() => admin?.roleId)
  const mutation = useMutation({
    mutationFn: async (input: AdminInput) =>
      isEdit && admin?.id ? updateAdmin(admin.id, input) : createAdmin(input),
    onSuccess: async () => {
      toast.success(isEdit ? 'Admin updated.' : 'Admin created.')
      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      fullName: String(form.get('fullName') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? '') || undefined,
      roleId: roleId ?? '',
      isBanned: form.get('isBanned') === 'on',
      profileImage,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit admin' : 'Add admin'}</DialogTitle>
            <DialogDescription>
              Admin mutations are sent as multipart form data.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Label>Full name</Label>
            <Input
              name='fullName'
              defaultValue={admin?.fullName ?? ''}
              required
            />
            <Label>Email</Label>
            <Input
              name='email'
              type='email'
              defaultValue={admin?.email ?? ''}
              required
            />
            <Label>Password {isEdit && '(leave blank to keep current)'}</Label>
            <Input name='password' type='password' />
            <Label>Role</Label>
            <RoleCombobox
              value={roleId}
              label={admin?.role?.name}
              onChange={(nextRoleId) => setRoleId(nextRoleId)}
            />
            <Label>Profile image</Label>
            <FileInput onChange={setProfileImage} />
            <label className='flex items-center gap-2 text-sm'>
              <Switch name='isBanned' defaultChecked={admin?.isBanned} />
              Banned
            </label>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending || !roleId}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function RolesPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)
  const debouncedQuery = useDebouncedQuery(query)
  const roles = useQuery({
    queryKey: ['roles', debouncedQuery],
    queryFn: () => listRoles(debouncedQuery),
  })
  const permissions = useQuery({
    queryKey: ['permissions'],
    queryFn: listPermissions,
  })
  const canCreate = useCan([{ module: 'rbac', action: 'create' }])
  const canUpdate = useCan([{ module: 'rbac', action: 'update' }])
  const canDelete = useCan([{ module: 'rbac', action: 'delete' }])
  const remove = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      toast.success('Role deleted.')
      setDeleting(null)
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })

  return (
    <PageShell
      title='Roles & Permissions'
      description='Manage role ranks and permission assignments.'
      actions={
        canCreate && (
          <Button onClick={() => setEditing({} as Role)}>
            <Plus /> Add role
          </Button>
        )
      }
    >
      <Toolbar query={query} onChange={setQuery} />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className='w-20' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.data?.items.map((role) => (
              <TableRow key={role.id}>
                <TableCell className='font-medium'>{role.name}</TableCell>
                <TableCell>{role.description ?? '-'}</TableCell>
                <TableCell>{role.rank}</TableCell>
                <TableCell>{role.permissions?.length ?? 0}</TableCell>
                <TableCell>
                  <div className='flex justify-end gap-1'>
                    {canUpdate && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setEditing(role)}
                      >
                        <Pencil />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setDeleting(role)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!roles.data?.items.length && (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  {roles.isLoading ? 'Loading roles...' : 'No roles found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={roles.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <RoleDialog
        key={editing?.id ?? 'new'}
        open={Boolean(editing)}
        role={editing}
        permissions={permissions.data ?? []}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title='Delete role'
        desc={`Delete ${deleting?.name ?? 'this role'}?`}
        destructive
        isLoading={remove.isPending}
        handleConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </PageShell>
  )
}

function RoleDialog({
  open,
  role,
  permissions,
  onOpenChange,
}: {
  open: boolean
  role: Role | null
  permissions: Permission[]
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(role?.id)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(role?.permissions?.map((item) => item.id) ?? [])
  )
  const mutation = useMutation({
    mutationFn: async (input: RoleInput) =>
      isEdit && role?.id ? updateRole(role.id, input) : createRole(input),
    onSuccess: async () => {
      toast.success(isEdit ? 'Role updated.' : 'Role created.')
      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })

  function togglePermission(permissionId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) next.delete(permissionId)
      else next.add(permissionId)
      return next
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      name: String(form.get('name') ?? ''),
      description: String(form.get('description') ?? '') || undefined,
      rank: Number(form.get('rank') ?? 99),
      permissionIds: Array.from(selected),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-2xl'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit role' : 'Add role'}</DialogTitle>
            <DialogDescription>
              Select the permissions this role grants.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3'>
            <Label>Name</Label>
            <Input name='name' defaultValue={role?.name ?? ''} required />
            <Label>Description</Label>
            <Textarea
              name='description'
              defaultValue={role?.description ?? ''}
            />
            <Label>Rank</Label>
            <Input
              name='rank'
              type='number'
              min={1}
              defaultValue={role?.rank ?? 99}
              required
            />
            <Label>Permissions</Label>
            <PermissionPicker
              permissions={permissions}
              selected={selected}
              onToggle={togglePermission}
            />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LogsPage() {
  const [query, setQuery] = useState<QueryState>({ ...defaultQuery })
  const [viewing, setViewing] = useState<ActivityLog | null>(null)
  const debouncedQuery = useDebouncedQuery(query)
  const logs = useQuery({
    queryKey: ['logs', debouncedQuery],
    queryFn: () => {
      const params: LogQuery = {
        ...debouncedQuery,
        sortBy: debouncedQuery.sortBy ?? 'createdAt',
        sortOrder: debouncedQuery.sortOrder ?? 'DESC',
      }
      return listLogs(params)
    },
  })

  return (
    <PageShell
      title='Logs'
      description='Inspect backend activity with server-side pagination and filters.'
    >
      <Toolbar query={query} onChange={setQuery}>
        <Select
          value={query.actorType ?? 'all'}
          onValueChange={(value) =>
            setQuery({
              ...query,
              page: 1,
              actorType: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className='h-9 w-36'>
            <SelectValue placeholder='Actor' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All actors</SelectItem>
            <SelectItem value='admin'>Admin</SelectItem>
            <SelectItem value='user'>User</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={query.action ?? 'all'}
          onValueChange={(value) =>
            setQuery({
              ...query,
              page: 1,
              action: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className='h-9 w-48'>
            <SelectValue placeholder='Action' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All actions</SelectItem>
            {logActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.status ?? 'all'}
          onValueChange={(value) =>
            setQuery({
              ...query,
              page: 1,
              status: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className='h-9 w-40'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All status</SelectItem>
            <SelectItem value='success'>success</SelectItem>
            <SelectItem value='failure'>failure</SelectItem>
          </SelectContent>
        </Select>
      </Toolbar>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-12' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.data?.items.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.actorType}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{statusBadge(log.status)}</TableCell>
                <TableCell>{log.ipAddress ?? '-'}</TableCell>
                <TableCell>{formatDate(log.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setViewing(log)}
                  >
                    <Eye />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!logs.data?.items.length && (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  {logs.isLoading ? 'Loading logs...' : 'No logs found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={query.page ?? 1}
        totalPages={logs.data?.meta.totalPages ?? 1}
        onPageChange={(page) => setQuery({ ...query, page })}
      />
      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Log detail</DialogTitle>
            <DialogDescription>Raw backend log payload.</DialogDescription>
          </DialogHeader>
          <pre className='overflow-auto rounded-md bg-muted p-4 text-xs'>
            {JSON.stringify(viewing, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

export function SmtpSettingsPage() {
  const queryClient = useQueryClient()
  const smtp = useQuery({
    queryKey: ['settings', 'smtp'],
    queryFn: getSmtpSettings,
  })
  const mutation = useMutation({
    mutationFn: updateSmtpSettings,
    onSuccess: async () => {
      toast.success('SMTP settings saved.')
      await queryClient.invalidateQueries({ queryKey: ['settings', 'smtp'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      smtpHost: String(form.get('smtpHost') ?? ''),
      smtpPort: Number(form.get('smtpPort') ?? 587),
      smtpSecure: form.get('smtpSecure') === 'on',
      smtpUsername: String(form.get('smtpUsername') ?? ''),
      smtpPassword: String(form.get('smtpPassword') ?? ''),
      smtpFromEmail: String(form.get('smtpFromEmail') ?? ''),
      smtpFromName: String(form.get('smtpFromName') ?? ''),
      smtpEnabled: form.get('smtpEnabled') === 'on',
    })
  }

  return (
    <PageShell
      title='SMTP Settings'
      description='Configure outbound email settings used by the backend.'
    >
      <Card>
        <CardContent className='pt-6'>
          <form onSubmit={submit} className='grid max-w-2xl gap-4'>
            <Label>Host</Label>
            <Input
              name='smtpHost'
              defaultValue={smtp.data?.smtpHost ?? ''}
              required
            />
            <Label>Port</Label>
            <Input
              name='smtpPort'
              type='number'
              defaultValue={smtp.data?.smtpPort ?? 587}
              required
            />
            <Label>Username</Label>
            <Input
              name='smtpUsername'
              defaultValue={smtp.data?.smtpUsername ?? ''}
            />
            <Label>Password</Label>
            <Input
              name='smtpPassword'
              type='password'
              defaultValue={smtp.data?.smtpPassword ?? ''}
            />
            <Label>From email</Label>
            <Input
              name='smtpFromEmail'
              type='email'
              defaultValue={smtp.data?.smtpFromEmail ?? ''}
              required
            />
            <Label>From name</Label>
            <Input
              name='smtpFromName'
              defaultValue={smtp.data?.smtpFromName ?? ''}
              required
            />
            <label className='flex items-center gap-2 text-sm'>
              <Switch
                name='smtpSecure'
                defaultChecked={smtp.data?.smtpSecure}
              />
              Use secure SMTP
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Switch
                name='smtpEnabled'
                defaultChecked={smtp.data?.smtpEnabled}
              />
              SMTP enabled
            </label>
            <Button
              className='w-fit'
              disabled={mutation.isPending || smtp.isLoading}
            >
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save SMTP settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export function ProfileSettingsPage() {
  const queryClient = useQueryClient()
  const auth = useAuthStore((state) => state.auth)
  const [profileImage, setProfileImage] = useState<File>()
  const mutation = useMutation({
    mutationFn: updateCurrentAdmin,
    onSuccess: async (user) => {
      auth.setUser(user as CurrentAdmin)
      toast.success('Profile updated.')
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      fullName: String(form.get('fullName') ?? ''),
      email: String(form.get('email') ?? ''),
      profileImage,
    })
  }

  return (
    <PageShell title='Profile' description='Update your admin profile.'>
      <Card>
        <CardContent className='pt-6'>
          <form onSubmit={submit} className='grid max-w-xl gap-4'>
            <Label>Full name</Label>
            <Input
              name='fullName'
              defaultValue={auth.user?.fullName ?? ''}
              required
            />
            <Label>Email</Label>
            <Input
              name='email'
              type='email'
              defaultValue={auth.user?.email ?? ''}
              required
            />
            <Label>Profile image</Label>
            <FileInput onChange={setProfileImage} />
            <Button className='w-fit' disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export function AccountSettingsPage() {
  const mutation = useMutation({
    mutationFn: changeCurrentPassword,
    onSuccess: () => toast.success('Password changed.'),
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      currentPassword: String(form.get('currentPassword') ?? ''),
      newPassword: String(form.get('newPassword') ?? ''),
    })
    event.currentTarget.reset()
  }

  return (
    <PageShell title='Account' description='Change your admin password.'>
      <Card>
        <CardContent className='pt-6'>
          <form onSubmit={submit} className='grid max-w-xl gap-4'>
            <Label>Current password</Label>
            <Input name='currentPassword' type='password' required />
            <Label>New password</Label>
            <Input name='newPassword' type='password' required />
            <Button className='w-fit' disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className='animate-spin' />}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  )
}
