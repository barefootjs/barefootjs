/**
 * Dashboard Reference Page (/components/dashboard)
 *
 * Block-level composition pattern: Cards + Table + Badge + Tabs + Input + Toast.
 * Compiler stress test for .map() rendering, conditional Badge inside loops,
 * reactive .filter().map() chain, and multiple sibling Card components.
 */

import { DashboardDemo } from '@/components/dashboard-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'
import { getNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
  { id: 'stats', title: 'Stats Cards', branch: 'start' },
  { id: 'orders', title: 'Orders Table', branch: 'child' },
  { id: 'activity', title: 'Activity Feed', branch: 'end' },
]

const previewCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToastProvider, Toast, ... } from '@/components/ui/toast'

const orders = [
  { id: 'ORD001', customer: 'Alice Johnson', email: 'alice@example.com', amount: 250, status: 'completed' },
  { id: 'ORD002', customer: 'Bob Smith', email: 'bob@example.com', amount: 150, status: 'processing' },
  // ...
]

const statusBadgeVariant = {
  completed: 'default',
  processing: 'secondary',
  pending: 'outline',
  cancelled: 'destructive',
}

function Dashboard() {
  const [selectedTab, setSelectedTab] = createSignal('overview')
  const [searchQuery, setSearchQuery] = createSignal('')

  const filteredOrders = createMemo(() =>
    orders.filter(order =>
      order.customer.toLowerCase().includes(searchQuery().toLowerCase())
    )
  )

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Tabs value={selectedTab()} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview" selected={...}>Overview</TabsTrigger>
          <TabsTrigger value="analytics" selected={...}>Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" selected={...}>
          {/* Stats cards rendered with .map() */}
          {/* Orders table with .filter().map() and conditional Badge */}
          <Table>
            <TableBody>
              {filteredOrders().map(order => (
                <TableRow>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[order.status]}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>\${order.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}`

export function DashboardRefPage() {
  return (
    <DocPage slug="dashboard" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Dashboard"
          description="A sales dashboard block combining Cards, Table, Badge, Tabs, and Input with loop rendering, conditional variants, and reactive filtering."
          {...getNavLinks('dashboard')}
        />

        {/* Preview */}
        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <DashboardDemo />
          </Example>
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 id="stats" className="text-base font-medium text-foreground mb-2">Stats Cards</h3>
              <p className="text-sm text-muted-foreground">
                Four metric cards rendered with .map() over a static data array.
                Tests multiple sibling Card components and loop rendering.
              </p>
            </div>
            <div>
              <h3 id="orders" className="text-base font-medium text-foreground mb-2">Orders Table</h3>
              <p className="text-sm text-muted-foreground">
                Filterable orders table with reactive .filter().map() chain.
                Each row renders a Badge with a status-dependent variant,
                testing conditional rendering inside loops.
              </p>
            </div>
            <div>
              <h3 id="activity" className="text-base font-medium text-foreground mb-2">Activity Feed</h3>
              <p className="text-sm text-muted-foreground">
                Recent activity list using .map() with per-type Badge variant
                and label mapping. Tests another loop + conditional pattern.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
