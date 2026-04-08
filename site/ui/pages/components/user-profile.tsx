/**
 * User Profile Reference Page (/components/user-profile)
 *
 * Block-level composition: Avatar + Tabs + Card + Badge + Input + Textarea + Select.
 * Compiler stress test for deep conditional nesting, inline editing,
 * per-item array mutation, and filter/sort memo chains.
 */

import { UserProfileDemo } from '@/components/user-profile-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'

const previewCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/dom'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function UserProfile() {
  const [profile, setProfile] = createSignal(initialProfile)
  const [activeTab, setActiveTab] = createSignal('overview')
  const [editingField, setEditingField] = createSignal(null)
  const [repoFilter, setRepoFilter] = createSignal('all')
  const [repoSort, setRepoSort] = createSignal('stars')
  const [repoSearch, setRepoSearch] = createSignal('')

  const totalStars = createMemo(() => profile().repos.reduce((s, r) => s + r.stars, 0))
  const filteredRepos = createMemo(() => {
    let repos = profile().repos
    if (repoFilter() !== 'all') repos = repos.filter(r => r.language === repoFilter())
    const q = repoSearch().toLowerCase()
    if (q) repos = repos.filter(r => r.name.includes(q))
    return repos
  })
  const sortedRepos = createMemo(() => {
    const items = [...filteredRepos()]
    if (repoSort() === 'stars') return items.sort((a, b) => b.stars - a.stars)
    return items.sort((a, b) => a.name.localeCompare(b.name))
  })

  const toggleStar = (id) => {
    setProfile(prev => ({
      ...prev,
      repos: prev.repos.map(r =>
        r.id === id ? { ...r, starred: !r.starred, stars: r.starred ? r.stars - 1 : r.stars + 1 } : r
      ),
    }))
  }

  return (
    <div>
      {/* Profile header with inline editing */}
      <Avatar><AvatarFallback>AC</AvatarFallback></Avatar>
      <h2>{profile().displayName}</h2>
      {profile().verified ? <Badge>Verified</Badge> : null}

      {/* Stats */}
      <span>{profile().repos.length} repos</span>
      <span>{totalStars()} stars</span>

      {/* Tabs */}
      <Tabs value={activeTab()} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="repos">Repositories</TabsTrigger>
        </TabsList>
        <TabsContent value="repos">
          <Input value={repoSearch()} onInput={e => setRepoSearch(e.target.value)} />
          {sortedRepos().map(repo => (
            <div key={repo.id}>
              <span>{repo.name}</span>
              <Badge variant="outline">{repo.language}</Badge>
              <span>{repo.stars} stars</span>
              <Button onClick={() => toggleStar(repo.id)}>
                {repo.starred ? 'Unstar' : 'Star'}
              </Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}`

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
  { id: 'profile-header', title: 'Profile Header', branch: 'start' },
  { id: 'tabs', title: 'Tab Navigation', branch: 'child' },
  { id: 'repos', title: 'Repository List', branch: 'child' },
  { id: 'activity', title: 'Activity Feed', branch: 'end' },
]

export function UserProfileRefPage() {
  return (
    <DocPage slug="user-profile" toc={tocItems}>
      <PageHeader
        title="User Profile"
        description="Developer profile with inline editing, filterable repositories, and activity feed."
      />

      <Section id="preview" title="Preview">
        <Example code={previewCode}>
          <UserProfileDemo />
        </Example>
      </Section>

      <Section id="features" title="Features">
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Deep conditional nesting (3 levels) for profile name editing</li>
          <li>Inline editing with shared editingField signal (name, bio, about)</li>
          <li>Per-item star toggle with immutable array mutation</li>
          <li>Filter + sort memo chain for repositories</li>
          <li>Tabs with complex content switching (3 different subtrees)</li>
          <li>Mixed loop types (component grid + plain element badges)</li>
          <li>Activity feed with type-based badge variants</li>
        </ul>
      </Section>

      <Section id="profile-header" title="Profile Header">
        <p className="text-sm text-muted-foreground">
          Avatar with inline name and bio editing. Deep conditional: editing mode → verified view → basic view.
        </p>
      </Section>

      <Section id="tabs" title="Tab Navigation">
        <p className="text-sm text-muted-foreground">
          Three tabs with completely different content trees. Switching tabs resets inline editing state.
        </p>
      </Section>

      <Section id="repos" title="Repository List">
        <p className="text-sm text-muted-foreground">
          Search + language filter + sort dropdown driving a 2-level memo chain.
          Per-item star toggle updates both the repo and total stars count.
        </p>
      </Section>

      <Section id="activity" title="Activity Feed">
        <p className="text-sm text-muted-foreground">
          Activity items with type-based Badge variants (commit, PR, issue, review, release).
        </p>
      </Section>
    </DocPage>
  )
}
