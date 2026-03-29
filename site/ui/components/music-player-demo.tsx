"use client"
/**
 * MusicPlayerDemo Component
 *
 * Music player block with playlist, seek/volume sliders, and timer.
 * Compiler stress: setInterval + onCleanup (effect cleanup pattern),
 * Slider bidirectional binding, timer-driven reactive updates,
 * conditional rendering (playing vs paused), loop + conditional coexistence.
 */

import { createSignal, createMemo, createEffect, onCleanup } from '@barefootjs/dom'
import { Badge } from '@ui/components/ui/badge'
import { Button } from '@ui/components/ui/button'
import { Slider } from '@ui/components/ui/slider'
import { Separator } from '@ui/components/ui/separator'
import { ScrollArea } from '@ui/components/ui/scroll-area'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@ui/components/ui/toast'

type Track = {
  id: number
  title: string
  artist: string
  album: string
  duration: number // seconds
  durationStr: string // pre-formatted mm:ss
}

// Declared as function statement (not arrow) to avoid compiler inline-expansion bug
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const playlist: Track[] = [
  { id: 1, title: 'Morning Light', artist: 'Solar Wave', album: 'Daybreak', duration: 217, durationStr: '3:37' },
  { id: 2, title: 'Deep Blue', artist: 'Ocean Drive', album: 'Tides', duration: 185, durationStr: '3:05' },
  { id: 3, title: 'City Nights', artist: 'Neon Pulse', album: 'Urban', duration: 243, durationStr: '4:03' },
  { id: 4, title: 'Mountain Echo', artist: 'Alpine', album: 'Heights', duration: 198, durationStr: '3:18' },
  { id: 5, title: 'Starfall', artist: 'Cosmic Drift', album: 'Nebula', duration: 262, durationStr: '4:22' },
  { id: 6, title: 'River Flow', artist: 'Calm Waters', album: 'Serenity', duration: 174, durationStr: '2:54' },
]

/**
 * Music player — setInterval + onCleanup stress test
 *
 * Compiler stress points:
 * - setInterval + onCleanup: playback timer with proper cleanup on pause/track change
 * - Slider bidirectional binding: seek position + volume (controlled mode)
 * - Timer-driven reactive updates: currentTime signal updated every 100ms
 * - Conditional rendering: now-playing info, play/pause icon
 * - Loop + conditional coexistence: playlist items with active track highlight
 * - createMemo chains: currentTrack → progress percentage → formatted times
 */
export function MusicPlayerDemo() {
  const [currentTrackId, setCurrentTrackId] = createSignal(1)
  const [isPlaying, setIsPlaying] = createSignal(false)
  const [currentTime, setCurrentTime] = createSignal(0)
  const [volume, setVolume] = createSignal(75)
  const [shuffle, setShuffle] = createSignal(false)
  const [repeat, setRepeat] = createSignal<'off' | 'all' | 'one'>('off')
  const [toastOpen, setToastOpen] = createSignal(false)
  const [toastMessage, setToastMessage] = createSignal('')

  // Memo chain stage 1: current track object
  const currentTrack = createMemo(() =>
    playlist.find(t => t.id === currentTrackId()) || playlist[0]
  )

  // Memo chain stage 2: progress percentage (0-100)
  const progress = createMemo(() => {
    const track = currentTrack()
    return track.duration > 0 ? (currentTime() / track.duration) * 100 : 0
  })

  // Formatted times as signals (not memos) to avoid formatTime leaking into SSR template.
  // The compiler inlines createMemo initial values into the template function,
  // but the template runs outside the component scope where formatTime is unavailable.
  const [formattedCurrentTime, setFormattedCurrentTime] = createSignal('0:00')
  const [formattedRemaining, setFormattedRemaining] = createSignal('-3:37')

  // Update formatted times reactively
  createEffect(() => {
    setFormattedCurrentTime(formatTime(currentTime()))
    const remaining = currentTrack().duration - currentTime()
    setFormattedRemaining(`-${formatTime(Math.max(0, remaining))}`)
  })

  // Total duration as pre-computed string (avoids formatTime in SSR template)
  const totalDurationStr = '21:19' // sum of all track durations

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastOpen(true)
    setTimeout(() => setToastOpen(false), 2000)
  }

  // setInterval + onCleanup: playback timer
  // This is the primary compiler stress pattern — createEffect with
  // interval that must be cleaned up when isPlaying changes or component unmounts
  createEffect(() => {
    if (!isPlaying()) return

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.1
        if (next >= currentTrack().duration) {
          // Track ended — handle repeat/next
          handleTrackEnd()
          return 0
        }
        return next
      })
    }, 100)

    onCleanup(() => clearInterval(interval))
  })

  const handleTrackEnd = () => {
    if (repeat() === 'one') {
      setCurrentTime(0)
      return
    }

    const currentIdx = playlist.findIndex(t => t.id === currentTrackId())
    if (currentIdx < playlist.length - 1) {
      setCurrentTrackId(playlist[currentIdx + 1].id)
      setCurrentTime(0)
      showToast('Next track')
    } else if (repeat() === 'all') {
      setCurrentTrackId(playlist[0].id)
      setCurrentTime(0)
      showToast('Playlist restarted')
    } else {
      setIsPlaying(false)
      setCurrentTime(0)
      showToast('Playlist ended')
    }
  }

  const togglePlay = () => {
    setIsPlaying(prev => !prev)
  }

  const playTrack = (trackId: number) => {
    setCurrentTrackId(trackId)
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const prevTrack = () => {
    // If past 3 seconds, restart current track; otherwise go to previous
    if (currentTime() > 3) {
      setCurrentTime(0)
      return
    }
    const currentIdx = playlist.findIndex(t => t.id === currentTrackId())
    if (currentIdx > 0) {
      setCurrentTrackId(playlist[currentIdx - 1].id)
      setCurrentTime(0)
    }
  }

  const nextTrack = () => {
    const currentIdx = playlist.findIndex(t => t.id === currentTrackId())
    if (currentIdx < playlist.length - 1) {
      setCurrentTrackId(playlist[currentIdx + 1].id)
      setCurrentTime(0)
    }
  }

  const seekTo = (value: number) => {
    const newTime = (value / 100) * currentTrack().duration
    setCurrentTime(newTime)
  }

  const cycleRepeat = () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one']
    const currentIdx = modes.indexOf(repeat())
    setRepeat(modes[(currentIdx + 1) % modes.length])
  }

  const repeatLabel: Record<string, string> = {
    off: '↻',
    all: '↻ All',
    one: '↻ 1',
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Music Player</h2>
        <span className="total-duration text-sm text-muted-foreground">{playlist.length} tracks · {totalDurationStr}</span>
      </div>

      <div className="music-player rounded-xl border border-border bg-card overflow-hidden">
        {/* Now playing + controls */}
        <div className="now-playing p-5 space-y-4">
          {/* Track info */}
          <div className="flex items-center gap-4">
            <div className="album-art w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl">
              {isPlaying() ? '♫' : '♪'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="track-title text-base font-semibold truncate">{currentTrack().title}</p>
              <p className="track-artist text-sm text-muted-foreground truncate">{currentTrack().artist}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack().album}</p>
            </div>
            {isPlaying() ? (
              <Badge variant="default" className="playing-badge">Playing</Badge>
            ) : (
              <Badge variant="outline" className="paused-badge">Paused</Badge>
            )}
          </div>

          {/* Seek slider — bidirectional binding stress test */}
          <div className="space-y-1">
            <Slider
              value={progress()}
              onValueChange={seekTo}
              min={0}
              max={100}
              step={0.1}
              className="seek-slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="current-time">{formattedCurrentTime()}</span>
              <span className="remaining-time">{formattedRemaining()}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant={shuffle() ? 'secondary' : 'ghost'}
              size="icon-sm"
              className="shuffle-btn"
              onClick={() => setShuffle(prev => !prev)}
            >
              ⇄
            </Button>
            <Button variant="ghost" size="icon" className="prev-btn" onClick={prevTrack}>
              ⏮
            </Button>
            <Button
              variant="default"
              size="icon-lg"
              className="play-btn"
              onClick={togglePlay}
            >
              {isPlaying() ? '⏸' : '▶'}
            </Button>
            <Button variant="ghost" size="icon" className="next-btn" onClick={nextTrack}>
              ⏭
            </Button>
            <Button
              variant={repeat() !== 'off' ? 'secondary' : 'ghost'}
              size="icon-sm"
              className="repeat-btn"
              onClick={cycleRepeat}
            >
              {repeatLabel[repeat()]}
            </Button>
          </div>

          {/* Volume slider — second bidirectional binding */}
          <div className="flex items-center gap-3">
            <span className="text-sm">{volume() === 0 ? '🔇' : volume() < 50 ? '🔉' : '🔊'}</span>
            <Slider
              value={volume()}
              onValueChange={setVolume}
              min={0}
              max={100}
              step={1}
              className="volume-slider flex-1"
            />
            <span className="volume-value text-xs text-muted-foreground w-8 text-right">{volume()}%</span>
          </div>
        </div>

        <Separator />

        {/* Playlist — loop with active track conditional */}
        <ScrollArea className="playlist" style="height: 240px">
          <div className="p-2 space-y-0.5">
            {playlist.map(track => (
              <button
                key={track.id}
                className={`playlist-item w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-accent ${currentTrackId() === track.id ? 'bg-accent' : ''}`}
                onClick={() => playTrack(track.id)}
              >
                <span className="w-6 text-center text-sm text-muted-foreground">
                  {currentTrackId() === track.id && isPlaying() ? '▶' : track.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`playlist-track-title text-sm truncate ${currentTrackId() === track.id ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>
                <span className="text-xs text-muted-foreground">{track.durationStr}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <ToastProvider position="bottom-right">
        <Toast variant="default" open={toastOpen()}>
          <div className="flex-1">
            <ToastTitle>Player</ToastTitle>
            <ToastDescription className="toast-message">{toastMessage()}</ToastDescription>
          </div>
          <ToastClose onClick={() => setToastOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}
