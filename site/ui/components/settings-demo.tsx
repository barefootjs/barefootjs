"use client"
/**
 * SettingsDemo Component
 *
 * Settings page block combining Tabs, Card, Field, Switch, AlertDialog, and Toast.
 * Compiler stress: 20+ signals, branch switching, depth 9, portal in branch, cross-branch toast.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from '@ui/components/ui/input'
import { Button } from '@ui/components/ui/button'
import { Textarea } from '@ui/components/ui/textarea'
import { Switch } from '@ui/components/ui/switch'
import { NativeSelect, NativeSelectOption } from '@ui/components/ui/native-select'
import { Avatar, AvatarFallback } from '@ui/components/ui/avatar'
import { Separator } from '@ui/components/ui/separator'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@ui/components/ui/tabs'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@ui/components/ui/card'
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from '@ui/components/ui/field'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@ui/components/ui/alert-dialog'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@ui/components/ui/toast'

/**
 * Settings page — Tabs with Profile, Account, and Notifications
 *
 * Compiler stress points:
 * - Branch switching: 3 TabsContent with conditional rendering (insideConditional propagation)
 * - Depth 9: Tabs > TabsContent > Card > CardContent > div > Field > FieldContent > Input > conditional
 * - 20+ signals: large reactive analysis in single component
 * - Portal in branch: AlertDialog inside TabsContent (non-active branch portal)
 * - Toast cross-branch: each tab's Save fires shared Toast
 */
export function SettingsDemo() {
  // Tab state
  const [activeTab, setActiveTab] = createSignal('profile')
  const isProfileSelected = createMemo(() => activeTab() === 'profile')
  const isAccountSelected = createMemo(() => activeTab() === 'account')
  const isNotificationsSelected = createMemo(() => activeTab() === 'notifications')

  // Profile tab
  const [displayName, setDisplayName] = createSignal('John Doe')
  const [profileEmail, setProfileEmail] = createSignal('john@example.com')
  const [bio, setBio] = createSignal('')
  const [profileSaving, setProfileSaving] = createSignal(false)

  // Account tab
  const [currentPassword, setCurrentPassword] = createSignal('')
  const [newPassword, setNewPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')
  const [accountSaving, setAccountSaving] = createSignal(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false)

  // Notifications tab
  const [emailNotifications, setEmailNotifications] = createSignal(true)
  const [pushNotifications, setPushNotifications] = createSignal(false)
  const [marketingEmails, setMarketingEmails] = createSignal(false)
  const [securityAlerts, setSecurityAlerts] = createSignal(true)
  const [notificationFrequency, setNotificationFrequency] = createSignal('weekly')
  const [notificationsSaving, setNotificationsSaving] = createSignal(false)

  // Shared toast
  const [toastOpen, setToastOpen] = createSignal(false)
  const [toastMessage, setToastMessage] = createSignal('')

  // Memos
  const displayNameError = createMemo(() => {
    if (displayName().trim() === '') return 'Display name is required'
    return ''
  })

  const newPasswordError = createMemo(() => {
    if (newPassword() === '') return ''
    if (newPassword().length < 8) return 'Password must be at least 8 characters'
    return ''
  })

  const confirmError = createMemo(() => {
    if (confirmPassword() === '') return ''
    if (confirmPassword() !== newPassword()) return 'Passwords do not match'
    return ''
  })

  const isPasswordFormValid = createMemo(() =>
    currentPassword() !== '' &&
    newPassword() !== '' &&
    newPasswordError() === '' &&
    confirmPassword() !== '' &&
    confirmError() === ''
  )

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastOpen(true)
    setTimeout(() => setToastOpen(false), 3000)
  }

  const handleProfileSave = async () => {
    if (displayNameError() !== '' || profileSaving()) return
    setProfileSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setProfileSaving(false)
    showToast('Profile updated successfully')
  }

  const handlePasswordChange = async () => {
    if (!isPasswordFormValid() || accountSaving()) return
    setAccountSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setAccountSaving(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showToast('Password changed successfully')
  }

  const handleNotificationsSave = async () => {
    if (notificationsSaving()) return
    setNotificationsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setNotificationsSaving(false)
    showToast('Notification preferences saved')
  }

  return (
    <div className="w-full max-w-2xl">
      <Tabs value={activeTab()} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger
            value="profile"
            selected={isProfileSelected()}
            disabled={false}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="account"
            selected={isAccountSelected()}
            disabled={false}
            onClick={() => setActiveTab('account')}
          >
            Account
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

        {/* Profile Tab */}
        <TabsContent value="profile" selected={isProfileSelected()}>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your public profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-lg">JD</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Profile photo</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF. 1MB max.</p>
                    <Button variant="outline" size="sm">Upload</Button>
                  </div>
                </div>

                <Separator />

                <Field data-invalid={displayNameError() !== '' || undefined}>
                  <FieldLabel for="settings-name">Display Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="settings-name"
                      value={displayName()}
                      onInput={(e) => setDisplayName(e.target.value)}
                      aria-invalid={displayNameError() !== '' || undefined}
                    />
                    {displayNameError() !== '' ? (
                      <FieldError>{displayNameError()}</FieldError>
                    ) : null}
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel for="settings-email">Email</FieldLabel>
                  <FieldContent>
                    <Input
                      id="settings-email"
                      type="email"
                      value={profileEmail()}
                      onInput={(e) => setProfileEmail(e.target.value)}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel for="settings-bio">Bio</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="settings-bio"
                      placeholder="Tell us about yourself"
                      value={bio()}
                      onInput={(e) => setBio(e.target.value)}
                    />
                  </FieldContent>
                </Field>

                <div className="flex justify-end">
                  <Button
                    onClick={handleProfileSave}
                    disabled={displayNameError() !== '' || profileSaving()}
                  >
                    <span className="button-text">{profileSaving() ? 'Saving...' : 'Save changes'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" selected={isAccountSelected()}>
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <h3 className="text-sm font-medium">Change Password</h3>

                <Field>
                  <FieldLabel for="current-password">Current Password</FieldLabel>
                  <FieldContent>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword()}
                      onInput={(e) => setCurrentPassword(e.target.value)}
                    />
                  </FieldContent>
                </Field>

                <Field data-invalid={newPasswordError() !== '' || undefined}>
                  <FieldLabel for="new-password">New Password</FieldLabel>
                  <FieldContent>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword()}
                      onInput={(e) => setNewPassword(e.target.value)}
                      aria-invalid={newPasswordError() !== '' || undefined}
                    />
                    {newPasswordError() !== '' ? (
                      <FieldError>{newPasswordError()}</FieldError>
                    ) : null}
                  </FieldContent>
                </Field>

                <Field data-invalid={confirmError() !== '' || undefined}>
                  <FieldLabel for="confirm-password">Confirm Password</FieldLabel>
                  <FieldContent>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword()}
                      onInput={(e) => setConfirmPassword(e.target.value)}
                      aria-invalid={confirmError() !== '' || undefined}
                    />
                    {confirmError() !== '' ? (
                      <FieldError>{confirmError()}</FieldError>
                    ) : null}
                  </FieldContent>
                </Field>

                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={!isPasswordFormValid() || accountSaving()}
                  >
                    <span className="button-text">{accountSaving() ? 'Updating...' : 'Update password'}</span>
                  </Button>
                </div>
              </form>

              <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
                <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back.
                </p>
                <AlertDialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete Account</Button>
                  </AlertDialogTrigger>
                <AlertDialogOverlay />
                <AlertDialogContent
                  ariaLabelledby="delete-account-title"
                  ariaDescribedby="delete-account-desc"
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle id="delete-account-title">Delete Account</AlertDialogTitle>
                    <AlertDialogDescription id="delete-account-desc">
                      This will permanently delete your account and all associated data.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Delete Account</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" selected={isNotificationsSelected()}>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="rounded-lg border border-border divide-y divide-border">
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Email Notifications</label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={emailNotifications()}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Push Notifications</label>
                      <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      checked={pushNotifications()}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Marketing Emails</label>
                      <p className="text-sm text-muted-foreground">Receive emails about new features</p>
                    </div>
                    <Switch
                      checked={marketingEmails()}
                      onCheckedChange={setMarketingEmails}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Security Alerts</label>
                      <p className="text-sm text-muted-foreground">Important security notifications</p>
                    </div>
                    <Switch
                      checked={securityAlerts()}
                      onCheckedChange={setSecurityAlerts}
                    />
                  </div>
                </div>

                <Field>
                  <FieldLabel for="notification-frequency">Digest Frequency</FieldLabel>
                  <FieldContent>
                    <NativeSelect
                      id="notification-frequency"
                      value={notificationFrequency()}
                      onChange={(e) => setNotificationFrequency(e.target.value)}
                    >
                      <NativeSelectOption value="realtime">Real-time</NativeSelectOption>
                      <NativeSelectOption value="daily">Daily digest</NativeSelectOption>
                      <NativeSelectOption value="weekly">Weekly digest</NativeSelectOption>
                      <NativeSelectOption value="never">Never</NativeSelectOption>
                    </NativeSelect>
                  </FieldContent>
                </Field>

                <div className="flex justify-end">
                  <Button
                    onClick={handleNotificationsSave}
                    disabled={notificationsSaving()}
                  >
                    <span className="button-text">{notificationsSaving() ? 'Saving...' : 'Save preferences'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ToastProvider position="bottom-right">
        <Toast variant="success" open={toastOpen()}>
          <div className="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription className="toast-message">{toastMessage()}</ToastDescription>
          </div>
          <ToastClose onClick={() => setToastOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}
