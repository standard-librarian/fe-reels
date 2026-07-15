import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

type IconButtonProps = {
  icon: LucideIcon
  label: string
  onClick?: () => void
  /** Selected state (e.g. wishlisted): pink filled icon, plus a one-shot pop on the click that turns it on. */
  active?: boolean
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

export function IconButton({ icon: Icon, label, onClick, active = false, primary = false, size = 'md', showLabel = true, className = '' }: IconButtonProps) {
  const [pop, setPop] = useState(false)
  // The pink/filled state follows `active` so it stays correct as you move between
  // reels. The pop animation must fire only when a click turns it on — not when
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

  const { circle, icon } = SIZES[size]
  const circleClass = [CIRCLE, circle, primary && PRIMARY, active && ACTIVE, pop && POP].filter(Boolean).join(' ')

  return (
    <button className={`${BUTTON} ${className}`} onClick={handleClick} aria-label={label}>
      <span className={circleClass} onAnimationEnd={() => setPop(false)}>
        <Icon size={icon} fill={active ? 'currentColor' : 'none'} />
      </span>
      {showLabel && <span className="text-sm">{label}</span>}
    </button>
  )
}
