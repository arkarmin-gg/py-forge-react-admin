import { useAuthStore } from '@/stores/auth-store'
import { hasAnyPermission } from '@/lib/permissions'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import type { NavItem } from './types'

function isNavItem(item: NavItem | null): item is NavItem {
  return item !== null
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const admin = useAuthStore((state) => state.auth.user)
  const navGroups = sidebarData.navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item): NavItem | null => {
          const visible =
            !item.permissions || hasAnyPermission(admin, item.permissions)
          if (!visible) return null
          if (!item.items) return item

          const items = item.items.filter(
            (child) =>
              !child.permissions || hasAnyPermission(admin, child.permissions)
          )
          return items.length > 0 ? { ...item, items } : null
        })
        .filter(isNavItem),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
