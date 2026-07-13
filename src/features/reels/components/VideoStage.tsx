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
   className={`video-stage absolute inset-0 grid place-items-center overflow-hidden touch-none select-none bg-dark-bg video-stage--enter-${enterDirection > 0 ? 'up' : 'down'}`}
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
   <div className="absolute inset-0 overflow-hidden bg-dark-bg grid place-items-center">
     <div className="video-stage__frame relative z-2 h-full max-w-full aspect-[9/16] overflow-hidden">
       <video ref={videoRef} className="w-full h-full block object-cover bg-black" src={listing.videoUrl} muted={muted} autoPlay loop playsInline preload="metadata" aria-label={listing.title}/>
       {paused && <div className="absolute inset-0 grid place-items-center z-4 animate-[pause-fade-in_0.2s_ease_both] pointer-events-none [&_svg]:text-white [&_svg]:drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"><Pause size={48}/></div>}
     </div>
   </div>
   <div className="stage-chrome absolute inset-0 pointer-events-none">
     <div className="stage-gradient absolute top-0 left-0 right-0 h-[120px] z-3 bg-gradient-to-b from-[rgba(0,4,12,0.55)] to-transparent pointer-events-none" aria-hidden="true"/>
     <div className="stage-controls absolute top-[max(14px,env(safe-area-inset-top))] right-3.5 z-6 hidden gap-2 pointer-events-auto">
       <button className="w-[38px] h-[38px] shrink-0 grid place-items-center border border-white/25 rounded-full bg-black/28 text-white backdrop-blur-[8px] [&_svg]:w-[19px]" onClick={onMute} aria-label={muted?'Unmute':'Mute'}>{muted?<VolumeX/>:<Volume2/>}</button>
       <button className="stage-controls__fullscreen w-[38px] h-[38px] shrink-0 hidden place-items-center border border-white/25 rounded-full bg-black/28 text-white backdrop-blur-[8px] [&_svg]:w-[19px]" onClick={onFullscreen} aria-label="Toggle fullscreen"><Maximize2/></button>
     </div>
     {!detailsOpen && <div className="seller absolute left-3.5 right-[84px] bottom-[max(74px,calc(env(safe-area-inset-bottom)+66px))] z-5 flex flex-col gap-2 text-white">
       <div className="flex items-center gap-2.5">
         <div className="w-[38px] h-[38px] grid place-items-center shrink-0 border border-white/25 rounded-xl bg-white/16 backdrop-blur-[8px] text-white font-extrabold">{listing.sellerInit}</div>
         <div className="min-w-0 flex-1"><strong className="flex items-center gap-[5px] text-sm font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">{listing.sellerName} {listing.verified?<BadgeCheck size={16}/>:null}</strong><small className="flex items-center gap-[5px] mt-0.5 text-[11px] text-white/78 [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]"><MapPin size={12}/> {listing.location}</small></div>
       </div>
       <p className="m-0 text-sm font-semibold leading-[1.35] [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] line-clamp-2">{listing.title}</p>
       <p className="mt-1 mb-0 text-lg font-extrabold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">KD {listing.price}</p>
     </div>}
   </div>
 </div>
}
