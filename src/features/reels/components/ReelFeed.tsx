import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Listing } from '../types'
import { VideoStage } from './VideoStage'

type ReelFeedProps = {
  listings: Listing[]
  muted: boolean
  detailsOpen: boolean
  onMute: () => void
  onIndexChange: (index: number) => void
}

export type ReelFeedHandle = {
  scrollToReel: (index: number) => void
}

export const ReelFeed = forwardRef<ReelFeedHandle, ReelFeedProps>(function ReelFeed(
  { listings, muted, detailsOpen, onMute, onIndexChange },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
  const [currentIndex, setCurrentIndex] = useState(0)
  const isScrolling = useRef(false)
  const scrollTimer = useRef<number | undefined>(undefined)
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null)

  // register video refs from children
  const registerVideo = useCallback((index: number, el: HTMLVideoElement | null) => {
    if (el) videoRefs.current.set(index, el)
    else videoRefs.current.delete(index)
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
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [currentIndex])

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
          onMute={onMute}
          registerVideo={(el) => registerVideo(idx, el)}
        />
      ))}
    </div>
  )
})
