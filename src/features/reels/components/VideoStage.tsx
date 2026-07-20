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

export function VideoStage({ listing, muted, detailsOpen, isActive, shouldMountVideo, videoIndex, onMute, registerVideo, renderRail }: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [progress, setProgress] = useState(0) // 0..1 of the active video
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
            }}
            onLoadedData={() => setReady(true)}
            onTimeUpdate={event => {
              const video = event.currentTarget
              if (Number.isFinite(video.duration) && video.duration > 0) {
                const ratio = video.currentTime / video.duration
                setProgress(ratio)
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
              ends to match the video's rounded corners (and leaves it square in portrait). */}
          {isActive && ready && !hasError && (
            <div className="progress-track absolute bottom-0 left-0 right-0 h-[3px] z-6 bg-white/25" aria-hidden="true">
              <div className="progress-fill h-full bg-white" style={{ width: `${progress * 100}%` }} />
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
