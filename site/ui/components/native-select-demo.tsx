"use client"
/**
 * NativeSelectDemo Components
 *
 * Interactive demos for NativeSelect component.
 * Used in native-select documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { NativeSelect, NativeSelectOption } from '@ui/components/ui/native-select'

/**
 * Value binding example — shows selected value in real time
 */
export function NativeSelectBindingDemo() {
  const [value, setValue] = createSignal('')
  return (
    <div className="space-y-2">
      <NativeSelect
        value={value()}
        onChange={(e) => setValue(e.target.value)}
      >
        <NativeSelectOption value="" disabled>Select a fruit...</NativeSelectOption>
        <NativeSelectOption value="apple">Apple</NativeSelectOption>
        <NativeSelectOption value="banana">Banana</NativeSelectOption>
        <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
      </NativeSelect>
      <p className="text-sm text-muted-foreground">
        Selected: <span className="selected-value font-medium">{value() || 'none'}</span>
      </p>
    </div>
  )
}

/**
 * Form example — a realistic settings form with native select
 */
export function NativeSelectFormDemo() {
  const [role, setRole] = createSignal('viewer')
  const [theme, setTheme] = createSignal('system')

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Role</label>
        <NativeSelect
          value={role()}
          onChange={(e) => setRole(e.target.value)}
        >
          <NativeSelectOption value="viewer">Viewer</NativeSelectOption>
          <NativeSelectOption value="editor">Editor</NativeSelectOption>
          <NativeSelectOption value="admin">Admin</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Theme</label>
        <NativeSelect
          value={theme()}
          onChange={(e) => setTheme(e.target.value)}
        >
          <NativeSelectOption value="system">System</NativeSelectOption>
          <NativeSelectOption value="light">Light</NativeSelectOption>
          <NativeSelectOption value="dark">Dark</NativeSelectOption>
        </NativeSelect>
      </div>
      <p className="text-sm text-muted-foreground">
        Role: <span className="form-role font-medium">{role()}</span>,
        Theme: <span className="form-theme font-medium">{theme()}</span>
      </p>
    </div>
  )
}
