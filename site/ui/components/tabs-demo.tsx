"use client"
/**
 * TabsDemo Components
 *
 * Interactive demos for Tabs component.
 * Used in tabs documentation page.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@ui/components/ui/tabs'

/**
 * Basic tabs example
 */
export function TabsBasicDemo() {
  const [activeTab, setActiveTab] = createSignal('account')

  const isAccountSelected = createMemo(() => activeTab() === 'account')
  const isPasswordSelected = createMemo(() => activeTab() === 'password')

  return (
    <Tabs value={activeTab()} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger
          value="account"
          selected={isAccountSelected()}
          disabled={false}
          onClick={() => setActiveTab('account')}
        >
          Account
        </TabsTrigger>
        <TabsTrigger
          value="password"
          selected={isPasswordSelected()}
          disabled={false}
          onClick={() => setActiveTab('password')}
        >
          Password
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account" selected={isAccountSelected()}>
        <div className="p-4 rounded-lg border bg-background">
          <h4 className="font-medium mb-2">Account Settings</h4>
          <p className="text-muted-foreground text-sm">Make changes to your account here. Click save when you're done.</p>
        </div>
      </TabsContent>
      <TabsContent value="password" selected={isPasswordSelected()}>
        <div className="p-4 rounded-lg border bg-background">
          <h4 className="font-medium mb-2">Password Settings</h4>
          <p className="text-muted-foreground text-sm">Change your password here. After saving, you'll be logged out.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

/**
 * Multiple tabs example
 */
export function TabsMultipleDemo() {
  const [activeTab, setActiveTab] = createSignal('overview')

  const isOverviewSelected = createMemo(() => activeTab() === 'overview')
  const isAnalyticsSelected = createMemo(() => activeTab() === 'analytics')
  const isReportsSelected = createMemo(() => activeTab() === 'reports')
  const isNotificationsSelected = createMemo(() => activeTab() === 'notifications')

  return (
    <Tabs value={activeTab()} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger
          value="overview"
          selected={isOverviewSelected()}
          disabled={false}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="analytics"
          selected={isAnalyticsSelected()}
          disabled={false}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </TabsTrigger>
        <TabsTrigger
          value="reports"
          selected={isReportsSelected()}
          disabled={false}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          selected={isNotificationsSelected()}
          disabled={false}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" selected={isOverviewSelected()}>
        <div className="p-4 rounded-lg border bg-background">
          <p className="text-muted-foreground">Overview content goes here.</p>
        </div>
      </TabsContent>
      <TabsContent value="analytics" selected={isAnalyticsSelected()}>
        <div className="p-4 rounded-lg border bg-background">
          <p className="text-muted-foreground">Analytics content goes here.</p>
        </div>
      </TabsContent>
      <TabsContent value="reports" selected={isReportsSelected()}>
        <div className="p-4 rounded-lg border bg-background">
          <p className="text-muted-foreground">Reports content goes here.</p>
        </div>
      </TabsContent>
      <TabsContent value="notifications" selected={isNotificationsSelected()}>
        <div className="p-4 rounded-lg border bg-background">
          <p className="text-muted-foreground">Notifications content goes here.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

/**
 * Tabs with disabled tab example
 */
export function TabsDisabledDemo() {
  const [activeTab, setActiveTab] = createSignal('active')

  const isActiveSelected = createMemo(() => activeTab() === 'active')
  const isAnotherSelected = createMemo(() => activeTab() === 'another')

  return (
    <Tabs value={activeTab()}>
      <TabsList>
        <TabsTrigger
          value="active"
          selected={isActiveSelected()}
          disabled={false}
          onClick={() => setActiveTab('active')}
        >
          Active
        </TabsTrigger>
        <TabsTrigger
          value="disabled"
          selected={false}
          disabled={true}
        >
          Disabled
        </TabsTrigger>
        <TabsTrigger
          value="another"
          selected={isAnotherSelected()}
          disabled={false}
          onClick={() => setActiveTab('another')}
        >
          Another
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active" selected={isActiveSelected()}>
        <div className="p-4 rounded-lg border bg-background">
          <p className="text-muted-foreground">This tab is active.</p>
        </div>
      </TabsContent>
      <TabsContent value="another" selected={isAnotherSelected()}>
        <div className="p-4 rounded-lg border bg-background">
          <p className="text-muted-foreground">Another active tab.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}
