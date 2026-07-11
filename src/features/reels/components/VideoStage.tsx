import { useCallback, useRef } from 'react'
import { BadgeCheck, PlayCircle, Volume2, VolumeX } from 'lucide-react'
import type { Listing } from '../types'

const SWIPE_DISTANCE = 52
const WHEEL_DISTANCE = 36
const GESTURE_COOLDOWN_MS = 550

export function VideoStage({listing,muted,onMute,onNavigate}:{listing:Listing;muted:boolean;onMute:()=>void;onNavigate:(n:number)=>void}){
 const pointerStartY = useRef<number | null>(null)
 const wheelDistance = useRef(0)
 const lockedUntil = useRef(0)
 const unlockTimer = useRef<number | undefined>(undefined)

 const navigateOnce = useCallback((direction: number) => {
   const now = performance.now()
   if (now < lockedUntil.current) return
   lockedUntil.current = now + GESTURE_COOLDOWN_MS
   wheelDistance.current = 0
   window.clearTimeout(unlockTimer.current)
   unlockTimer.current = window.setTimeout(() => { wheelDistance.current = 0 }, GESTURE_COOLDOWN_MS)
   onNavigate(direction)
 }, [onNavigate])

 return <div
   className="video-stage"
   onWheel={event => {
     event.preventDefault()
     if (performance.now() < lockedUntil.current) return
     wheelDistance.current += event.deltaY
     if (Math.abs(wheelDistance.current) >= WHEEL_DISTANCE) navigateOnce(wheelDistance.current > 0 ? 1 : -1)
   }}
   onPointerDown={event => {
     if (!event.isPrimary) return
     pointerStartY.current = event.clientY
     event.currentTarget.setPointerCapture(event.pointerId)
   }}
   onPointerUp={event => {
     const startY = pointerStartY.current
     pointerStartY.current = null
     if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
     if (startY === null) return
     const distance = startY - event.clientY
     if (Math.abs(distance) >= SWIPE_DISTANCE) navigateOnce(distance > 0 ? 1 : -1)
   }}
   onPointerCancel={() => { pointerStartY.current = null }}
 >
   <div className="video-stage__media" style={{aspectRatio:listing.aspectRatio}}><PlayCircle size={37}/><b>{listing.aspectLabel}</b><small>DROP PRODUCT VIDEO</small></div>
   <div className="seller"><div className="avatar">{listing.sellerInit}</div><div><strong>{listing.sellerName} {listing.verified?<BadgeCheck size={16}/>:null}</strong><small>{listing.sellerCat}</small></div><button className="glass-button" onClick={onMute}>{muted?<VolumeX/>:<Volume2/>}</button></div>
 </div>
}
