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
  // "Call" option — opens the number sheet so it can be seen/copied.
  onCall: () => void
}

/**
 * Contact as an expanding action (speed dial): the blue phone FAB morphs into
 * an X while a glass popover grows out of its corner with Chat / WhatsApp /
 * Call options. Closes on Escape, outside tap, or choosing an option.
 */
export function ContactSpeedDial({ open, phone, onToggle, onClose, onChat, onCall }: ContactSpeedDialProps) {
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
    onClose()
    // No number to deep-link: fall back to the sheet, which explains that.
    if (!waDigits) {
      onChat()
      return
    }
    window.open(`https://wa.me/${waDigits}`, '_blank', 'noopener')
  }

  const options = [
    { key: 'chat', title: 'Chat', hint: 'Open in-app conversation', icon: <MessageCircle size={22} />, iconClass: 'bg-white/11 border-white/12', onPick: onChat },
    { key: 'whatsapp', title: 'WhatsApp', hint: 'Continue in WhatsApp', icon: <WhatsappGlyph />, iconClass: 'bg-[#20c763] border-[#20c763]', onPick: openWhatsapp },
    { key: 'call', title: 'Call', hint: 'Call the seller directly', icon: <Phone size={22} />, iconClass: 'bg-white/11 border-white/12', onPick: onCall },
  ]

  return (
    <div ref={wrapRef} className="relative flex flex-col items-center gap-1">
      <div
        className={`absolute bottom-[calc(100%+12px)] right-0 w-[232px] p-3 rounded-[26px] bg-[rgba(13,20,35,0.88)] border border-white/15 backdrop-blur-[18px] shadow-[0_18px_50px_rgba(0,0,0,0.38)] origin-bottom-right transition-[transform,opacity] duration-[250ms] ease-[cubic-bezier(0.2,0.85,0.2,1)] ${
          open ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto' : 'translate-y-[14px] scale-[0.92] opacity-0 pointer-events-none'
        }`}
        role="menu"
        aria-hidden={!open}>
        {options.map(option => (
          <button
            key={option.key}
            role="menuitem"
            tabIndex={open ? 0 : -1}
            className="w-full flex items-center gap-3 border-0 bg-transparent text-white p-2.5 rounded-[18px] text-left cursor-pointer transition-[background-color,transform] duration-[180ms] hover:bg-white/9 active:scale-[0.97]"
            onClick={() => {
              onClose()
              option.onPick()
            }}>
            <span className={`w-11 h-11 shrink-0 grid place-items-center rounded-full border ${option.iconClass}`}>{option.icon}</span>
            <span className="min-w-0">
              <strong className="block text-[15px] font-bold">{option.title}</strong>
              <span className="block text-[11px] text-white/65 mt-0.5">{option.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <button
        className={`relative w-[46px] h-[46px] grid place-items-center border-0 rounded-full cursor-pointer transition-[transform,background-color,box-shadow] duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open
            ? 'rotate-45 bg-[#111827] shadow-[0_12px_30px_rgba(0,0,0,0.34)]'
            : 'bg-[linear-gradient(145deg,#1681ff,#0566ef)] shadow-[0_12px_30px_rgba(0,102,255,0.45),inset_0_1px_0_rgba(255,255,255,0.28)]'
        } text-white`}
        aria-expanded={open}
        aria-label={open ? 'Close contact actions' : 'Open contact actions'}
        onClick={onToggle}>
        <Phone size={21} className={`transition-[opacity,transform] duration-[220ms] ${open ? 'opacity-0 scale-[0.6]' : 'opacity-100 scale-100'}`} />
        <X size={22} className={`absolute transition-[opacity,transform] duration-[220ms] ${open ? 'opacity-100 -rotate-45 scale-100' : 'opacity-0 -rotate-45 scale-[0.6]'}`} />
      </button>
      <span className={`text-[11px] font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)] transition-[opacity,transform] duration-[220ms] ${open ? 'opacity-0 translate-y-[5px]' : 'opacity-100 translate-y-0'}`}>
        Contact
      </span>
    </div>
  )
}
