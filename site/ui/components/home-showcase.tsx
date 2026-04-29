"use client"
/**
 * Home page showcase cards.
 *
 * Practical UI examples on the site/ui landing page, composed from
 * the actual barefoot UI components (Card, Button, Input, Label,
 * Checkbox, Switch, Badge, Avatar, Separator).
 */

import { createSignal } from '@barefootjs/client'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@ui/components/ui/card'
import { Button } from '@ui/components/ui/button'
import { Input } from '@ui/components/ui/input'
import { Label } from '@ui/components/ui/label'
import { Checkbox } from '@ui/components/ui/checkbox'
import { Switch } from '@ui/components/ui/switch'
import { Badge } from '@ui/components/ui/badge'
import { Avatar, AvatarFallback } from '@ui/components/ui/avatar'
import { Separator } from '@ui/components/ui/separator'

export function LoginCard() {
  const [remember, setRemember] = createSignal(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label for="home-login-email">Email</Label>
          <Input id="home-login-email" type="email" placeholder="you@example.com" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label for="home-login-password">Password</Label>
          <Input id="home-login-password" type="password" placeholder="••••••••" />
        </div>
        <Label className="flex items-center gap-2 cursor-pointer font-normal">
          <Checkbox checked={remember()} onCheckedChange={setRemember} />
          <span>Remember me</span>
        </Label>
        <Button>Sign In</Button>
      </CardContent>
    </Card>
  )
}

export function ProfileCard() {
  return (
    <Card>
      <CardContent className="text-center">
        <Avatar className="size-16 mx-auto mb-4 bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
          <AvatarFallback className="text-xl font-semibold text-primary-foreground bg-transparent">
            JD
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold">Jane Doe</h3>
        <p className="text-sm text-muted-foreground mt-1">Software Engineer</p>
        <div className="flex justify-center gap-8 py-4 my-4 border-t border-b">
          <div className="text-center">
            <span className="block text-lg font-semibold">128</span>
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-semibold">2.4k</span>
            <span className="text-xs text-muted-foreground">Followers</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-semibold">847</span>
            <span className="text-xs text-muted-foreground">Following</span>
          </div>
        </div>
        <Button variant="outline" className="w-full">View Profile</Button>
      </CardContent>
    </Card>
  )
}

export function SettingsCard() {
  const [emailAlerts, setEmailAlerts] = createSignal(true)
  const [pushNotifications, setPushNotifications] = createSignal(false)
  const [weeklyDigest, setWeeklyDigest] = createSignal(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your preferences</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <div className="text-sm font-medium">Email alerts</div>
            <div className="text-xs text-muted-foreground mt-0.5">Receive email notifications</div>
          </div>
          <Switch checked={emailAlerts()} onCheckedChange={setEmailAlerts} />
        </div>
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <div className="text-sm font-medium">Push notifications</div>
            <div className="text-xs text-muted-foreground mt-0.5">Receive push alerts</div>
          </div>
          <Switch checked={pushNotifications()} onCheckedChange={setPushNotifications} />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium">Weekly digest</div>
            <div className="text-xs text-muted-foreground mt-0.5">Summary of activity</div>
          </div>
          <Switch checked={weeklyDigest()} onCheckedChange={setWeeklyDigest} />
        </div>
      </CardContent>
    </Card>
  )
}

export function PricingCard() {
  return (
    <Card className="border-[var(--gradient-start)] ring-1 ring-[var(--gradient-start)]">
      <CardHeader>
        <Badge className="w-fit border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Popular
        </Badge>
        <CardTitle className="mt-2">Pro Plan</CardTitle>
        <div className="mt-1">
          <span className="text-3xl font-bold">$29</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          <li>✓ Unlimited projects</li>
          <li>✓ Priority support</li>
          <li>✓ Advanced analytics</li>
          <li>✓ Custom integrations</li>
        </ul>
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  )
}

export function ChatCard() {
  const [message, setMessage] = createSignal('')

  return (
    <Card className="md:col-span-2 lg:col-span-2">
      <CardHeader className="border-b">
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="py-4 flex flex-col gap-4 min-h-48">
        <div className="flex items-start gap-3">
          <Avatar className="bg-primary">
            <AvatarFallback className="text-xs font-semibold text-primary-foreground bg-transparent">
              AS
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium">Alex Smith</span>
              <span className="text-xs text-muted-foreground">10:42 AM</span>
            </div>
            <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm max-w-xs">
              Hey! How's the project going?
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 flex-row-reverse">
          <Avatar className="bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
            <AvatarFallback className="text-xs font-semibold text-primary-foreground bg-transparent">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground">10:44 AM</span>
              <span className="text-sm font-medium">You</span>
            </div>
            <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none px-3 py-2 text-sm max-w-xs">
              Going great! Just finished the UI components.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Avatar className="bg-primary">
            <AvatarFallback className="text-xs font-semibold text-primary-foreground bg-transparent">
              AS
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium">Alex Smith</span>
              <span className="text-xs text-muted-foreground">10:45 AM</span>
            </div>
            <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm max-w-xs">
              Awesome!
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex gap-2 w-full">
          <Input
            type="text"
            value={message()}
            onInput={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button disabled={message().trim() === ''}>Send</Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function HomeShowcase() {
  return (
    <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <LoginCard />
      <ProfileCard />
      <SettingsCard />
      <PricingCard />
      <ChatCard />
    </div>
  )
}
