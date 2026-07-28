import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageShell } from '@/components/page-shell'
import { PlansTab } from '@/features/admin-console/billing/plans'
import { SubscriptionsTab } from '@/features/admin-console/billing/subscriptions'

export function BillingPage() {
  return (
    <PageShell
      title='Billing'
      description='Manage billing plans and organization subscriptions.'
    >
      <Tabs defaultValue='plans'>
        <TabsList>
          <TabsTrigger value='plans'>Plans</TabsTrigger>
          <TabsTrigger value='subscriptions'>Subscriptions</TabsTrigger>
        </TabsList>
        <TabsContent value='plans'>
          <PlansTab />
        </TabsContent>
        <TabsContent value='subscriptions'>
          <SubscriptionsTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
