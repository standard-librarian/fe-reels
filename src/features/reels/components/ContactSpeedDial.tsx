import { useEffect, useRef } from 'react'
import { MessageCircle, Phone, X } from 'lucide-react'
import { WhatsappGlyph } from './ContactDialog'

type ContactSpeedDialProps = {
  open: boolean
  phone: string
  onToggle: () => void
  onClose: () => void
  // "Chat" option — opens the in-app conversation sheet.
  onChat: () => void
  // Web fallback for the Call button — the sheet where numbers can be copied.
  onCallSheet: () => void
}

// Phones get the native dialer; anything with a fine pointer gets the sheet.
const isCoarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/**
 * The contact corner of the action rail, two stacked buttons:
 * - a messaging button that morphs into an X while a glass popover expands
 *   above it with Chat / WhatsApp (icon + name only);
 * - below it, the standalone blue Call FAB — direct `tel:` dial on touch
 *   devices, the copyable number sheet on desktop.
 */
export function ContactSpeedDial({ open, phone, onToggle, onClose, onChat, onCallSheet }: ContactSpeedDialProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  const firstNumber = phone.split(',').map(n => n.trim()).filter(Boolean)[0] ?? ''
  const waDigits = firstNumber.replace(/[^\d]/g, '')

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const handlePointer = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('pointerdown', handlePointer)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handlePointer)
    }
  }, [open, onClose])

  const openWhatsapp = () => {
    // No number to deep-link: fall back to the sheet, which explains that.
    if (!waDigits) {
      onChat()
      return
    }
    window.open(`https://wa.me/${waDigits}`, '_blank', 'noopener')
  }

  const handleCall = () => {
    onClose()
    if (firstNumber && isCoarsePointer()) {
      window.location.href = `tel:${firstNumber}`
      return
    }
    onCallSheet()
  }

  const options = [
    { key: 'chat', title: 'Chat', icon: <MessageCircle size={22} />, iconClass: 'bg-white/11 border-white/12', onPick: onChat },
    { key: 'whatsapp', title: 'WhatsApp', icon: <WhatsappGlyph />, iconClass: 'bg-[#20c763] border-[#20c763]', onPick: openWhatsapp },
  ]

  return (
    <div ref={wrapRef} className="relative flex flex-col items-center gap-3">
      <div
        className={`absolute bottom-[calc(100%+12px)] right-0 w-[188px] p-2.5 rounded-[22px] bg-[rgba(13,20,35,0.88)] border border-white/15 backdrop-blur-[18px] shadow-[0_18px_50px_rgba(0,0,0,0.38)] origin-bottom-right transition-[transform,opacity] duration-[250ms] ease-[cubic-bezier(0.2,0.85,0.2,1)] ${
          open ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto' : 'translate-y-[14px] scale-[0.92] opacity-0 pointer-events-none'
        }`}
        role="menu"
        aria-hidden={!open}>
        {options.map(option => (
          <button
            key={option.key}
            role="menuitem"
            tabIndex={open ? 0 : -1}
            className="w-full flex items-center gap-3 border-0 bg-transparent text-white p-2 rounded-[16px] text-left cursor-pointer transition-[background-color,transform] duration-[180ms] hover:bg-white/9 active:scale-[0.97]"
            onClick={() => {
              onClose()
              option.onPick()
            }}>
            <span className={`w-10 h-10 shrink-0 grid place-items-center rounded-full border ${option.iconClass}`}>{option.icon}</span>
            <strong className="text-[15px] font-bold">{option.title}</strong>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          className={`relative w-[46px] h-[46px] grid place-items-center rounded-full cursor-pointer transition-[transform,background-color,box-shadow] duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] text-white ${
            open ? 'rotate-45 border-0 bg-[#111827] shadow-[0_12px_30px_rgba(0,0,0,0.34)]' : 'glass'
          }`}
          aria-expanded={open}
          aria-label={open ? 'Close chat options' : 'Open chat options'}
          onClick={onToggle}>
          <MessageCircle size={21} className={`transition-[opacity,transform] duration-[220ms] ${open ? 'opacity-0 scale-[0.6]' : 'opacity-100 scale-100'}`} />
          <X size={22} className={`absolute transition-[opacity,transform] duration-[220ms] ${open ? 'opacity-100 -rotate-45 scale-100' : 'opacity-0 -rotate-45 scale-[0.6]'}`} />
        </button>
        <span className={`text-[11px] font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)] transition-[opacity,transform] duration-[220ms] ${open ? 'opacity-0 translate-y-[5px]' : 'opacity-100 translate-y-0'}`}>
          Chat
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          className="w-[46px] h-[46px] grid place-items-center border-0 rounded-full cursor-pointer text-white bg-[linear-gradient(145deg,#1681ff,#0566ef)] shadow-[0_12px_30px_rgba(0,102,255,0.45),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-[220ms] ease-out hover:-translate-y-0.5 active:scale-[0.94]"
          aria-label="Call the seller"
          onClick={handleCall}>
          <Phone size={21} />
        </button>
        <span className="text-[11px] font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">Call</span>
      </div>
    </div>
  )
}
