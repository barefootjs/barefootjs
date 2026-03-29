/**
 * Music Player Reference Page (/components/music-player)
 *
 * Block-level composition pattern: music player with timer-driven
 * reactivity, effect cleanup, and slider bidirectional binding.
 * Compiler stress test for setInterval + onCleanup, timer-driven
 * signal updates, and controlled Slider components.
 */

import { MusicPlayerDemo } from '@/components/music-player-demo'
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
]

const previewCode = `"use client"

import { createSignal, createEffect, onCleanup } from '@barefootjs/dom'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = createSignal(false)
  const [currentTime, setCurrentTime] = createSignal(0)
  const duration = 180 // 3 minutes

  // Timer with cleanup — the key compiler stress test
  createEffect(() => {
    if (!isPlaying()) return

    const interval = setInterval(() => {
      setCurrentTime(prev => prev >= duration ? 0 : prev + 0.1)
    }, 100)

    onCleanup(() => clearInterval(interval))
  })

  return (
    <div>
      <Slider
        value={(currentTime() / duration) * 100}
        onValueChange={(v) => setCurrentTime((v / 100) * duration)}
      />
      <Button onClick={() => setIsPlaying(p => !p)}>
        {isPlaying() ? '⏸' : '▶'}
      </Button>
    </div>
  )
}`

export function MusicPlayerRefPage() {
  return (
    <DocPage slug="music-player" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Music Player"
          description="A media player with playlist, seek/volume sliders, playback timer with effect cleanup, and track management."
          {...getNavLinks('music-player')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <MusicPlayerDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">setInterval + onCleanup</h3>
              <p className="text-sm text-muted-foreground">
                Playback timer runs at 100ms intervals while playing. When paused or the track changes,
                the effect re-runs and onCleanup clears the previous interval. Tests the compiler's
                handling of effect cleanup lifecycle.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Slider Bidirectional Binding</h3>
              <p className="text-sm text-muted-foreground">
                Both seek and volume use controlled Slider components. The seek slider is driven by
                the timer (value updates every 100ms) and also responds to user drag. Tests high-frequency
                reactive prop updates on child components.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">4-Stage createMemo Chain</h3>
              <p className="text-sm text-muted-foreground">
                currentTrack → progress percentage → formattedCurrentTime → formattedRemaining.
                All derived from currentTrackId and currentTime signals, updated 10 times per second
                during playback.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Playlist with Active Track</h3>
              <p className="text-sm text-muted-foreground">
                Playlist rendered via .map() with conditional styling for the active track.
                Click to play triggers track switch with timer reset. Tests loop + conditional coexistence.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
