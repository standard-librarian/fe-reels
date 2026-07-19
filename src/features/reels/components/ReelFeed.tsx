import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import type { Listing } from '../types'
import { VideoStage } from './VideoStage'

const PRELOAD_AHEAD = 2
// Keeping the reel behind the viewer mounted costs one more decoder but means a
// backward swipe resumes an already-buffered video instead of re-downloading it
// with no head start — the one direction that had no preload at all.
const KEEP_BEHIND = 1

type ReelFeedProps = {
  listings: Listing[]
  muted: boolean
  detailsOpen: boolean
  onMute: () => void
  onIndexChange: (index: number) => void
  // Per-reel action rail: rendered inside each reel so the buttons travel with
  // it during the snap scroll, exactly like the stage controls do.
  renderRail?: (listing: Listing) => ReactNode
}

export type ReelFeedHandle = {
  scrollToReel: (index: number) => void
}

export const ReelFeed = forwardRef<ReelFeedHandle, ReelFeedProps>(function ReelFeed(
  { listings, muted, detailsOpen, onMute, onIndexChange, renderRail },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [videoRefVersion, setVideoRefVersion] = useState(0)
  const isScrolling = useRef(false)
  const scrollTimer = useRef<number | undefined>(undefined)
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null)
  const startedIndex = useRef<number | null>(null)

  // register video refs from children
  const registerVideo = useCallback((index: number, el: HTMLVideoElement | null) => {
    const previous = videoRefs.current.get(index)
    if (el) videoRefs.current.set(index, el)
    else videoRefs.current.delete(index)
    if (previous !== el) setVideoRefVersion(version => version + 1)
  }, [])

  // scroll to a specific reel
  const scrollToReel = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return
    const target = container.children[index] as HTMLElement | undefined
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useImperativeHandle(ref, () => ({ scrollToReel }), [scrollToReel])

  // IntersectionObserver to detect which reel is visible
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const children = Array.from(container.children) as HTMLElement[]
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = children.indexOf(entry.target as HTMLElement)
            if (idx !== -1) {
              setCurrentIndex(idx)
              onIndexChange(idx)
            }
          }
        }
      },
      { root: container, threshold: 0.6 }
    )
    children.forEach(child => observer.observe(child))
    return () => observer.disconnect()
  }, [listings, onIndexChange])

  // play only the current video, pause all others
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (idx === currentIndex) {
        // Arriving at a reel always plays it from the top: a reel kept mounted
        // behind the viewer is paused mid-way, and resuming there is not what a
        // reel feed does. Gated on the reel actually changing, because this
        // effect also re-runs when the mounted set shifts — rewinding then would
        // restart the reel being watched.
        if (startedIndex.current !== currentIndex) {
          video.currentTime = 0
          startedIndex.current = currentIndex
        }
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [currentIndex, videoRefVersion])

  // detect scroll state for tap-vs-drag distinction
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onScroll = () => {
      isScrolling.current = true
      window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => { isScrolling.current = false }, 100)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', onScroll)
      window.clearTimeout(scrollTimer.current)
    }
  }, [])

  // pause-on-tap: distinguish tap from scroll
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // don't track taps on buttons — let the button handle it
    if ((e.target as Element).closest('button')) return
    tapStart.current = { x: e.clientX, y: e.clientY, t: performance.now() }
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!tapStart.current) return
    const dx = Math.abs(e.clientX - tapStart.current.x)
    const dy = Math.abs(e.clientY - tapStart.current.y)
    const dt = performance.now() - tapStart.current.t
    tapStart.current = null
    // if the user didn't drag and it was quick, treat as tap → toggle pause
    if (dx < 10 && dy < 10 && dt < 300 && !isScrolling.current) {
      const video = videoRefs.current.get(currentIndex)
      if (!video) return
      if (video.paused) void video.play().catch(() => {})
      else video.pause()
    }
  }, [currentIndex])

  return (
    <div
      ref={containerRef}
      className="reel-feed absolute inset-0 overflow-y-scroll overscroll-y-contain"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {listings.map((listing, idx) => (
        <VideoStage
          key={listing.id}
          listing={listing}
          muted={muted}
          detailsOpen={detailsOpen}
          isActive={idx === currentIndex}
          shouldMountVideo={idx >= currentIndex - KEEP_BEHIND && idx <= currentIndex + PRELOAD_AHEAD}
          videoIndex={idx}
          onMute={onMute}
          registerVideo={registerVideo}
          renderRail={renderRail}
        />
      ))}
    </div>
  )
})
