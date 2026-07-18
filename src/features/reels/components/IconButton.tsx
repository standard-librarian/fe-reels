import { useEffect, useRef, useState } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'

type IconButtonProps = {
  icon: LucideIcon
  label: string
  onClick?: () => void
  /** Selected state (e.g. wishlisted): pink filled icon, plus a one-shot pop on the click that turns it on. */
  active?: boolean
  /** Async action in flight: show a spinner instead of the icon and ignore taps. */
  pending?: boolean
  /** Filled brand-colour circle (e.g. the Call button). */
  primary?: boolean
  /** Circle size. 'md' (44px) is the default; 'sm' is 38px. */
  size?: 'sm' | 'md'
  /** Render the caption under the icon. Set false for an icon-only button. */
  showLabel?: boolean
  className?: string
}

const SIZES = {
  sm: { circle: 'w-[38px] h-[38px]', icon: 19 },
  md: { circle: 'w-11 h-11', icon: 21 },
}

const BUTTON =
  'flex flex-col items-center gap-[3px] border-0 bg-none text-[10px] font-semibold ' +
  'text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] active:[&_.action-circle]:scale-[0.9]'

const CIRCLE =
  'action-circle grid place-items-center border border-white/30 rounded-full ' +
  'bg-black/32 backdrop-blur-[8px] transition-[transform,background-color,color,box-shadow] duration-[160ms] ease-out'

const PRIMARY = '!bg-brand-primary !shadow-[0_6px_16px_rgba(0,98,255,0.5)]'
const ACTIVE = '!text-[#ff3b5c]'
const POP = 'animate-[wishlist-pop_0.3s_cubic-bezier(0.2,0.8,0.2,1)]'

export function IconButton({ icon: Icon, label, onClick, active = false, pending = false, primary = false, size = 'md', showLabel = true, className = '' }: IconButtonProps) {
  const [pop, setPop] = useState(false)
  // The pink/filled state follows `active` so it stays correct as you move between
  // reels. The pop must fire only when a *click* turns it on — but the commit can
  // be async (after a server confirm), so instead of clearing the click flag every
  // render we keep the "intent" alive briefly. It's consumed when `active` turns
  // on, or expires — so scrolling onto an already-active reel never pops.
  const clickIntent = useRef(false)
  const intentTimer = useRef<number | undefined>(undefined)
  const wasActive = useRef(active)
  useEffect(() => {
    if (active && !wasActive.current && clickIntent.current) {
      setPop(true)
      clickIntent.current = false
    }
    wasActive.current = active
  }, [active])

  const handleClick = () => {
    if (pending) return
    clickIntent.current = true
    window.clearTimeout(intentTimer.current)
    intentTimer.current = window.setTimeout(() => { clickIntent.current = false }, 2000)
    onClick?.()
  }

  const { circle, icon } = SIZES[size]
  const circleClass = [CIRCLE, circle, primary && PRIMARY, active && ACTIVE, pop && POP].filter(Boolean).join(' ')

  return (
    <button className={`${BUTTON} ${className}`} onClick={handleClick} aria-label={label} aria-busy={pending}>
      <span className={circleClass} onAnimationEnd={() => setPop(false)}>
        {pending
          ? <Loader2 size={icon} className="animate-spin" />
          : <Icon size={icon} fill={active ? 'currentColor' : 'none'} />}
      </span>
      {showLabel && <span className="text-sm">{label}</span>}
    </button>
  )
}
