import { useCallback, useEffect, useRef } from 'react'
import { BadgeCheck, Volume2, VolumeX } from 'lucide-react'
import type { Listing } from '../types'

const SWIPE_DISTANCE = 52
const WHEEL_DISTANCE = 36
const TRANSITION_MS = 240
const WHEEL_RESET_MS = 120

type VideoStageProps = {
 listing: Listing
 muted: boolean
 enterDirection: number
 inputLockedUntil: number
 onMute: () => void
 onNavigate: (direction: number) => void
}

export function VideoStage({listing,muted,enterDirection,inputLockedUntil,onMute,onNavigate}:VideoStageProps){
 const stageRef = useRef<HTMLDivElement>(null)
 const pointerStartY = useRef<number | null>(null)
 const dragDistance = useRef(0)
 const wheelDistance = useRef(0)
 const animating = useRef(false)
 const transitionTimer = useRef<number | undefined>(undefined)
 const wheelResetTimer = useRef<number | undefined>(undefined)
 const frame = useRef<number | undefined>(undefined)

 useEffect(() => () => {
   window.clearTimeout(transitionTimer.current)
   window.clearTimeout(wheelResetTimer.current)
   window.cancelAnimationFrame(frame.current ?? 0)
 }, [])

 const resetPosition = useCallback(() => {
   const stage = stageRef.current
   if (!stage) return
   stage.classList.add('video-stage--snapping')
   stage.style.transform = 'translate3d(0,0,0)'
   stage.style.opacity = '1'
   window.setTimeout(() => stage.classList.remove('video-stage--snapping'), TRANSITION_MS)
 }, [])

 const navigateOnce = useCallback((direction: number) => {
   if (animating.current || performance.now() < inputLockedUntil) return
   const stage = stageRef.current
   if (!stage) return
   animating.current = true
   wheelDistance.current = 0
   stage.classList.add('video-stage--leaving')
   stage.style.transform = `translate3d(0,${direction > 0 ? '-105%' : '105%'},0)`
   stage.style.opacity = '0'
   transitionTimer.current = window.setTimeout(() => onNavigate(direction), TRANSITION_MS)
 }, [inputLockedUntil, onNavigate])

 return <div
   ref={stageRef}
   className={`video-stage video-stage--enter-${enterDirection > 0 ? 'up' : 'down'}`}
   onWheel={event => {
     event.preventDefault()
     if (animating.current || performance.now() < inputLockedUntil) return
     wheelDistance.current += event.deltaY
     window.clearTimeout(wheelResetTimer.current)
     wheelResetTimer.current = window.setTimeout(() => { wheelDistance.current = 0 }, WHEEL_RESET_MS)
     if (Math.abs(wheelDistance.current) >= WHEEL_DISTANCE) navigateOnce(wheelDistance.current > 0 ? 1 : -1)
   }}
   onPointerDown={event => {
     if (!event.isPrimary || animating.current || performance.now() < inputLockedUntil || (event.target as Element).closest('button')) return
     pointerStartY.current = event.clientY
     dragDistance.current = 0
     event.currentTarget.setPointerCapture(event.pointerId)
   }}
   onPointerMove={event => {
     if (pointerStartY.current === null || !event.isPrimary) return
     dragDistance.current = event.clientY - pointerStartY.current
     const distance = dragDistance.current
     window.cancelAnimationFrame(frame.current ?? 0)
     frame.current = window.requestAnimationFrame(() => {
       const stage = stageRef.current
       if (!stage) return
       stage.style.transform = `translate3d(0,${distance}px,0)`
       stage.style.opacity = String(Math.max(.72, 1 - Math.abs(distance) / 900))
     })
   }}
   onPointerUp={event => {
     const wasDragging = pointerStartY.current !== null
     pointerStartY.current = null
     if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
     if (!wasDragging) return
     const distance = dragDistance.current
     if (Math.abs(distance) >= SWIPE_DISTANCE) navigateOnce(distance < 0 ? 1 : -1)
     else resetPosition()
   }}
   onPointerCancel={() => { pointerStartY.current = null; resetPosition() }}
 >
   <div className="video-stage__media">
     <video className="video-stage__glow" src={listing.videoUrl} muted autoPlay loop playsInline preload="metadata" aria-hidden="true"/>
     <div className="video-stage__frame">
       <video className="video-stage__video" src={listing.videoUrl} muted={muted} autoPlay loop playsInline preload="metadata" aria-label={listing.title}/>
     </div>
   </div>
   <div className="seller"><div className="avatar">{listing.sellerInit}</div><div><strong>{listing.sellerName} {listing.verified?<BadgeCheck size={16}/>:null}</strong><small>{listing.sellerCat}</small></div><button className="glass-button" onClick={onMute}>{muted?<VolumeX/>:<Volume2/>}</button></div>
 </div>
}
