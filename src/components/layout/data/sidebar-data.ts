import {
  Activity,
  Building2,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'admin',
    avatar: '',
  },
  teams: [
    {
      name: 'E-Menu MM',
      logo: ShieldCheck,
      plan: 'Admin Console',
    },
  ],
  navGroups: [
    {
      title: 'Workspace',
      items: [
        {
          title: 'Overview',
          url: '/',
          icon: LayoutDashboard,
        },

        {
          title: 'Organizations',
          url: '/organizations',
          icon: Building2,
          permissions: [{ module: 'organizations', action: 'read' }],
        },
        {
          title: 'Billing',
          url: '/billing',
          icon: CreditCard,
          permissions: [{ module: 'billing', action: 'read' }],
        },
      ],
    },
    {
      title: 'Platform',
      items: [
        {
          title: 'Admins',
          url: '/admins',
          icon: UserCog,
          permissions: [{ module: 'admins', action: 'read' }],
        },
        {
          title: 'Roles & Permissions',
          url: '/roles',
          icon: ShieldCheck,
          permissions: [{ module: 'rbac', action: 'read' }],
        },
        {
          title: 'Logs',
          url: '/logs',
          icon: Activity,
          permissions: [{ module: 'activity_logs', action: 'read' }],
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          title: 'Profile',
          url: '/settings/profile',
          icon: UserCog,
        },
        {
          title: 'Account',
          url: '/settings/account',
          icon: SlidersHorizontal,
        },
        // {
        //   title: 'SMTP',
        //   url: '/settings/smtp',
        //   icon: Settings,
        //   permissions: [{ module: 'settings', action: 'read' }],
        // },
      ],
    },
  ],
}
