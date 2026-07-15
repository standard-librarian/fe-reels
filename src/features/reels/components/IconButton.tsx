import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export function IconButton({ icon: Icon, label, onClick, active = false, primary = false, className = '' }: { icon: LucideIcon; label: string; onClick?: () => void; active?: boolean; primary?: boolean; className?: string }) {
    const [pop, setPop] = useState(false)
    // The pink/filled state follows `active` so it stays correct across reels.
    // The pop animation must fire only when a click turns it on — not when
    // swiping back onto an already-active reel flips `active` to true again.
    const clicked = useRef(false)
    const wasActive = useRef(active)
    useEffect(() => {
        if (active && !wasActive.current && clicked.current) setPop(true)
        wasActive.current = active
        clicked.current = false
    }, [active])
    const handleClick = () => {
        clicked.current = true
        onClick?.()
    }
    return <button className={`flex flex-col items-center gap-[3px] border-0 bg-none text-[10px] font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] active:[&_.action-circle]:scale-[0.9] ${className}`} onClick={handleClick} aria-label={label}><span className={`action-circle w-11 h-11 grid place-items-center border border-white/30 rounded-full bg-black/32 backdrop-blur-[8px] transition-[transform,background-color,color,box-shadow] duration-[160ms] ease-out ${primary ? '!bg-brand-primary !shadow-[0_6px_16px_rgba(0,98,255,0.5)]' : ''} ${active ? '!text-[#ff3b5c]' : ''} ${pop ? 'animate-[wishlist-pop_0.3s_cubic-bezier(0.2,0.8,0.2,1)]' : ''}`} onAnimationEnd={() => setPop(false)}><Icon size={21} fill={active ? 'currentColor' : 'none'} /></span><span className='text-sm'>{label}</span></button>
}
