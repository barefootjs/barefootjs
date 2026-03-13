/**
 * Shared Sidebar Navigation Component
 *
 * Accordion-style navigation using native <details>/<summary>.
 * Server component — no "use client" directive.
 *
 * Supports two entry types:
 * - SidebarLink: standalone link (no accordion)
 * - SidebarGroup: collapsible accordion with links
 */

// --- Types ---

export interface SidebarLink {
  title: string
  href: string
}

export interface SidebarGroup {
  title: string
  links: SidebarLink[]
  defaultOpen?: boolean
}

export type SidebarEntry = SidebarLink | SidebarGroup

function isGroup(entry: SidebarEntry): entry is SidebarGroup {
  return 'links' in entry
}

// --- Sub-components ---

function SidebarItemLink({ title, href, isActive }: { title: string; href: string; isActive: boolean }) {
  const baseClass = 'block py-1.5 px-3 text-sm rounded-md transition-colors no-underline'
  const activeClass = 'bg-accent text-foreground font-medium'
  const inactiveClass = 'text-muted-foreground hover:text-foreground hover:bg-accent/50'

  return (
    <a
      href={href}
      className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      {title}
    </a>
  )
}

function SidebarGroupSection({ group, currentPath }: { group: SidebarGroup; currentPath: string }) {
  const hasActiveItem = group.links.some(link => link.href === currentPath)
  const shouldOpen = hasActiveItem || (group.defaultOpen ?? false)

  return (
    <details className="mb-2 group" open={shouldOpen}>
      <summary className="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span>{group.title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="transition-transform duration-200 group-open:rotate-90"><path d="m9 18 6-6-6-6" /></svg>
      </summary>
      <div className="pl-2 py-1 space-y-0.5">
        {group.links.map(link => (
          <SidebarItemLink
            key={link.href}
            title={link.title}
            href={link.href}
            isActive={currentPath === link.href}
          />
        ))}
      </div>
    </details>
  )
}

// --- Main export ---

interface SidebarNavProps {
  entries: SidebarEntry[]
  currentPath: string
}

/**
 * Renders the sidebar navigation.
 * Groups and links are rendered as separate lists to work around
 * a compiler limitation with conditional JSX inside map().
 */
export function SidebarNav({ entries, currentPath }: SidebarNavProps) {
  const groups = entries.filter(isGroup) as SidebarGroup[]
  const links = entries.filter(e => !isGroup(e)) as SidebarLink[]

  return (
    <div className="space-y-1">
      {groups.map(group => (
        <SidebarGroupSection
          key={group.title}
          group={group}
          currentPath={currentPath}
        />
      ))}
      {links.map(link => (
        <SidebarItemLink
          key={link.href}
          title={link.title}
          href={link.href}
          isActive={currentPath === link.href}
        />
      ))}
    </div>
  )
}
