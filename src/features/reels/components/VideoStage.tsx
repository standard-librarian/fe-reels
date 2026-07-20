import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BadgeCheck, MapPin, Maximize2, Pause, Volume2, VolumeX } from 'lucide-react'
import type { Listing } from '../types'
import { reelsAnalytics } from '../analytics'
import { enqueueReelEvent, flushReelEvents, watchEvent } from '../api/events'

type VideoStageProps = {
  listing: Listing
  muted: boolean
  detailsOpen: boolean
  isActive: boolean
  shouldMountVideo: boolean
  videoIndex: number
  onMute: () => void
  registerVideo: (index: number, el: HTMLVideoElement | null) => void
  renderRail?: (listing: Listing) => ReactNode
}

// Keyboard seek step for the focused scrub bar, in seconds.
const SEEK_STEP_SEC = 5

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function VideoStage({ listing, muted, detailsOpen, isActive, shouldMountVideo, videoIndex, onMute, registerVideo, renderRail }: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [progress, setProgress] = useState(0) // 0..1 of the active video
  const [duration, setDuration] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  // Mirrors `scrubbing` for use inside event handlers and onTimeUpdate, which
  // need the live value rather than the one captured at render.
  const scrubbingRef = useRef(false)
  // Whether the video was playing when the scrub began, so release resumes only
  // a reel that was actually running.
  const wasPlaying = useRef(false)
  // Analytics: track the deepest point reached and when the reel became active,
  // then emit ONE `Reel Watched` on exit (below) instead of per-milestone events.
  const maxRatio = useRef(0)
  const watchStart = useRef(0)

  // Only active and imminent reels receive video elements. This limits decoder
  // and bandwidth pressure while still warming the next two reels.
  useEffect(() => {
    if (!shouldMountVideo) return
    registerVideo(videoIndex, videoRef.current)
    return () => registerVideo(videoIndex, null)
  }, [registerVideo, shouldMountVideo, videoIndex])

  // toggle pause on tap (called by parent via video ref)
  const togglePause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => {})
    else video.pause()
  }, [])

  // Map a pointer x to a position in the video. The bar spans the full frame
  // width, so the ratio is just the offset within the track's box.
  const seekToClientX = useCallback((clientX: number) => {
    const track = trackRef.current
    const video = videoRef.current
    if (!track || !video) return
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    setProgress(ratio)
    if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = ratio * video.duration
  }, [])

  const seekBy = useCallback((deltaSec: number) => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    const next = Math.min(video.duration, Math.max(0, video.currentTime + deltaSec))
    video.currentTime = next
    setProgress(next / video.duration)
  }, [])

  // Scrub gestures stop propagation so ReelFeed's tap-to-pause never sees them;
  // pointer capture keeps the drag alive once the finger leaves the 3px bar.
  const handleScrubDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const video = videoRef.current
    if (!video) return
    wasPlaying.current = !video.paused
    video.pause()
    scrubbingRef.current = true
    setScrubbing(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    seekToClientX(event.clientX)
  }, [seekToClientX])

  const handleScrubMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return
    event.stopPropagation()
    seekToClientX(event.clientX)
  }, [seekToClientX])

  const handleScrubUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return
    event.stopPropagation()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    scrubbingRef.current = false
    setScrubbing(false)
    if (wasPlaying.current) void videoRef.current?.play().catch(() => {})
  }, [])

  // Arrow keys seek while the bar has focus. They otherwise change reels (App's
  // window listener), so the event must stop here.
  const handleScrubKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    event.stopPropagation()
    seekBy(event.key === 'ArrowRight' ? SEEK_STEP_SEC : -SEEK_STEP_SEC)
  }, [seekBy])

  // A reel can lose focus mid-drag (keyboard/arrow navigation), which unmounts
  // the bar before pointerup fires. Clear the flag so progress tracking resumes
  // when this reel comes back.
  useEffect(() => {
    if (isActive || !scrubbingRef.current) return
    scrubbingRef.current = false
    setScrubbing(false)
  }, [isActive])

  // spacebar pause (only when this reel is active)
  useEffect(() => {
    if (!isActive) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault()
        togglePause()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isActive, togglePause])

  // Emit one watch summary when this reel loses focus (isActive → false) or
  // unmounts — this single event replaces the old per-milestone + completed
  // events. maxRatio is updated in onTimeUpdate. Skipping watchedPct 0 drops
  // reels that were never actually played: cleaner data and fewer events.
  useEffect(() => {
    if (!isActive) return
    maxRatio.current = 0
    watchStart.current = performance.now()
    return () => {
      const watchedPct = Math.round(maxRatio.current * 100)
      if (watchedPct > 0) {
        const completed = maxRatio.current >= 0.95
        const dwellMs = Math.round(performance.now() - watchStart.current)
        reelsAnalytics.reelWatched(listing, videoIndex, { watchedPct, completed, dwellMs })
        enqueueReelEvent(watchEvent(listing.id, videoIndex, { watchMs: dwellMs, progressPct: watchedPct, completed }))
      }
      // Flush now that this reel is done: sends its queued batch (watch + any
      // wishlist) on the same scroll that leaves it. If flushing were left to the
      // next scroll handler, this reel's watch event — queued here, after that
      // handler already ran — would sit unsent until yet another scroll.
      flushReelEvents()
    }
  }, [isActive, listing, videoIndex])

  return (
    <div className="reel-item relative w-full h-dvh overflow-hidden bg-dark-bg grid place-items-center snap-start snap-always">
      <div className="absolute inset-0 overflow-hidden bg-dark-bg grid place-items-center">
        <div className="video-stage__frame relative z-2 h-full max-w-full aspect-[9/16] overflow-hidden">
          {shouldMountVideo ? <video
            ref={videoRef}
            className="w-full h-full block object-contain bg-black"
            src={listing.videoUrl}
            muted={muted}
            loop
            playsInline
            preload="auto"
            aria-label={listing.title}
            onLoadStart={() => {
              setPaused(false)
              setReady(false)
              setHasError(false)
              setProgress(0)
              setDuration(0)
            }}
            onLoadedData={() => setReady(true)}
            onLoadedMetadata={event => {
              const value = event.currentTarget.duration
              setDuration(Number.isFinite(value) && value > 0 ? value : 0)
            }}
            onTimeUpdate={event => {
              const video = event.currentTarget
              if (Number.isFinite(video.duration) && video.duration > 0) {
                const ratio = video.currentTime / video.duration
                // While dragging, the bar follows the finger — a lagging
                // timeupdate would otherwise yank it backwards mid-scrub.
                if (!scrubbingRef.current) setProgress(ratio)
                // Track the deepest point reached; the summary is sent on exit.
                if (isActive && ratio > maxRatio.current) maxRatio.current = ratio
              }
            }}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onError={() => setHasError(true)}
          /> : null}
          {isActive && !ready && !hasError ? (
            <div className="absolute inset-0 grid place-items-center z-4 bg-black/20 text-white/75 text-xs font-semibold pointer-events-none">Loading video…</div>
          ) : null}
          {isActive && hasError ? (
            <div className="absolute inset-0 grid place-items-center z-4 bg-black/70 text-white/80 text-sm font-semibold text-center px-6 pointer-events-none">This video is unavailable.</div>
          ) : null}
          {paused && ready && isActive && !hasError && (
            <div className="absolute inset-0 grid place-items-center z-4 animate-[pause-fade-in_0.2s_ease_both] pointer-events-none [&_svg]:text-white [&_svg]:drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              <Pause size={32} />
            </div>
          )}
          {/* Inside the frame so the frame's rounded overflow-hidden clips the bar's
              ends to match the video's rounded corners (and leaves it square in portrait).
              The hit area is far taller than the 3px bar so the drag is grabbable
              on touch; touch-none keeps a horizontal drag from scrolling the feed. */}
          {isActive && ready && !hasError && (
            <div
              ref={trackRef}
              className="progress-scrub group absolute bottom-0 left-0 right-0 h-6 z-6 flex items-end pointer-events-auto touch-none cursor-pointer"
              role="slider"
              tabIndex={0}
              aria-label="Seek video"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(progress * duration)}
              aria-valuetext={`${formatTime(progress * duration)} of ${formatTime(duration)}`}
              onPointerDown={handleScrubDown}
              onPointerMove={handleScrubMove}
              onPointerUp={handleScrubUp}
              onPointerCancel={handleScrubUp}
              onKeyDown={handleScrubKeyDown}
            >
              <div className={`progress-track relative w-full bg-white/25 transition-[height] duration-150 ease-out ${scrubbing ? 'h-[5px]' : 'h-[3px] group-hover:h-[5px]'}`}>
                <div className="progress-fill absolute inset-y-0 left-0 bg-white" style={{ width: `${progress * 100}%` }} />
                {scrubbing && (
                  <span
                    className="absolute top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
                    style={{ left: `${progress * 100}%` }}
                  />
                )}
              </div>
            </div>
          )}
          {/* Time readout only while scrubbing — the point of the drag is landing
              on a specific second, so show which one. */}
          {isActive && ready && !hasError && scrubbing && duration > 0 && (
            <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-6 px-2.5 py-1 rounded-full glass text-white text-xs font-bold tabular-nums pointer-events-none" aria-hidden="true">
              {formatTime(progress * duration)} / {formatTime(duration)}
            </div>
          )}
        </div>
      </div>
      <div className="stage-chrome absolute inset-0 pointer-events-none">
        <div className="stage-gradient absolute top-0 left-0 right-0 h-[130px] z-3 bg-gradient-to-b from-[rgba(0,4,12,0.55)] to-transparent pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-[280px] z-3 bg-gradient-to-t from-[rgba(0,4,12,0.6)] to-transparent pointer-events-none" aria-hidden="true" />
        <div className="stage-controls absolute top-[max(14px,env(safe-area-inset-top))] right-3.5 z-6 flex gap-2 pointer-events-auto">
          <button className="w-[38px] h-[38px] shrink-0 grid place-items-center rounded-full glass text-white [&_svg]:w-[19px]" onClick={onMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX /> : <Volume2 />}</button>
          <button className="stage-controls__fullscreen w-[38px] h-[38px] shrink-0 hidden place-items-center rounded-full glass text-white [&_svg]:w-[19px]" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.() }} aria-label="Toggle fullscreen"><Maximize2 /></button>
        </div>
        {renderRail?.(listing)}
        {!detailsOpen && (
          <div className="seller absolute left-3.5 right-[84px] bottom-[max(74px,calc(env(safe-area-inset-bottom)+66px))] z-5 flex flex-col gap-2 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 grid place-items-center shrink-0 rounded-[13px] glass text-white text-sm font-extrabold">{listing.sellerInit}</div>
              <div className="min-w-0 flex-1">
                <strong className="flex items-center gap-[5px] text-sm font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]">{listing.sellerName} {listing.verified ? <BadgeCheck size={16} className="text-[#4da3ff]" /> : null}</strong>
                <small className="flex items-center gap-[5px] mt-0.5 text-[11px] text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]"><MapPin size={12} /> {listing.location}</small>
              </div>
            </div>
            <p className="m-0 text-sm font-semibold leading-[1.35] [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] line-clamp-2">{listing.title}</p>
            <p className="mt-1 mb-0 text-lg font-extrabold text-white whitespace-nowrap [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">KD {listing.price}</p>
          </div>
        )}
      </div>
    </div>
  )
}
