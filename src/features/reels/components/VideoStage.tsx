import { useCallback, useEffect, useRef, useState } from 'react'
import { BadgeCheck, MapPin, Maximize2, Pause, Volume2, VolumeX } from 'lucide-react'
import type { Listing } from '../types'

const SWIPE_DISTANCE = 52
const WHEEL_DISTANCE = 36
const TRANSITION_MS = 240
const WHEEL_RESET_MS = 120

type VideoStageProps = {
 listing: Listing
 muted: boolean
 detailsOpen: boolean
 enterDirection: number
 inputLockedUntil: number
 onMute: () => void
 onFullscreen: () => void
 onNavigate: (direction: number) => void
}

export function VideoStage({listing,muted,detailsOpen,enterDirection,inputLockedUntil,onMute,onFullscreen,onNavigate}:VideoStageProps){
 const stageRef = useRef<HTMLDivElement>(null)
 const videoRef = useRef<HTMLVideoElement>(null)
 const pointerStartY = useRef<number | null>(null)
 const dragDistance = useRef(0)
 const wheelDistance = useRef(0)
 const animating = useRef(false)
 const transitionTimer = useRef<number | undefined>(undefined)
 const wheelResetTimer = useRef<number | undefined>(undefined)
 const frame = useRef<number | undefined>(undefined)
 const [paused, setPaused] = useState(false)

 const togglePause = useCallback(() => {
   const video = videoRef.current
   if (!video) return
   if (video.paused) {
     void video.play()
     setPaused(false)
   } else {
     video.pause()
     setPaused(true)
   }
 }, [])

 useEffect(() => {
   const handleKey = (event: KeyboardEvent) => {
     if (event.key === ' ' || event.code === 'Space') {
       event.preventDefault()
       togglePause()
     }
   }
   window.addEventListener('keydown', handleKey)
   return () => window.removeEventListener('keydown', handleKey)
 }, [togglePause])

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
     else { resetPosition(); togglePause() }
   }}
   onPointerCancel={() => { pointerStartY.current = null; resetPosition() }}
 >
   <div className="video-stage__media">
     <div className="video-stage__frame">
       <video ref={videoRef} className="video-stage__video" src={listing.videoUrl} muted={muted} autoPlay loop playsInline preload="metadata" aria-label={listing.title}/>
       {paused && <div className="video-stage__pause-overlay"><Pause size={48}/></div>}
     </div>
   </div>
   <div className="stage-chrome">
     <div className="stage-gradient" aria-hidden="true"/>
     <div className="stage-controls">
       <button className="glass-button" onClick={onMute} aria-label={muted?'Unmute':'Mute'}>{muted?<VolumeX/>:<Volume2/>}</button>
       <button className="glass-button stage-controls__fullscreen" onClick={onFullscreen} aria-label="Toggle fullscreen"><Maximize2/></button>
     </div>
     {!detailsOpen && <div className="seller">
       <div className="seller__row">
         <div className="avatar">{listing.sellerInit}</div>
         <div className="seller__meta"><strong>{listing.sellerName} {listing.verified?<BadgeCheck size={16}/>:null}</strong><small><MapPin size={12}/> {listing.location}</small></div>
       </div>
       <p className="seller__title">{listing.title}</p>
       <p className="seller__price">KD {listing.price}</p>
     </div>}
   </div>
 </div>
}
