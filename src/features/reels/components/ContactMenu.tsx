import { Phone, X } from 'lucide-react'
import { WhatsappGlyph } from './ContactDialog'

type ContactMenuProps = {
  phone: string
  // Picks the "Phone" option: the caller closes this menu and opens the number sheet.
  onCall: () => void
  onClose: () => void
}

/**
 * First step of the Contact flow: a sheet over a blurred backdrop offering
 * Whatsapp (jumps straight into a chat with the seller's first number) or
 * Phone (hands off to ContactDialog so the number can be seen/copied).
 */
export function ContactMenu({ phone, onCall, onClose }: ContactMenuProps) {
  const firstNumber = phone.split(',').map(n => n.trim()).filter(Boolean)[0] ?? ''
  const waDigits = firstNumber.replace(/[^\d]/g, '')

  const openWhatsapp = () => {
    window.open(`https://wa.me/${waDigits}`, '_blank', 'noopener')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-[rgba(6,10,22,0.5)] backdrop-blur-[4px] animate-[fade-in_0.2s_ease_both]" onClick={onClose}>
      <div className="w-full max-w-[440px] px-[22px] pt-[22px] pb-[max(30px,env(safe-area-inset-bottom))] rounded-t-2xl glass-sheet animate-[sheet-up_0.28s_cubic-bezier(0.22,1,0.36,1)_both]" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between pb-4 border-b border-brand-divider">
          <h2 className="text-[18px] font-bold text-brand-navy">Contact</h2>
          <button className="w-[34px] h-[34px] grid place-items-center border-0 rounded-full bg-brand-section text-brand-text" onClick={onClose} aria-label="Close"><X /></button>
        </header>
        {waDigits ? (
          <>
            <button className="w-full flex items-center gap-3.5 pt-5 border-0 bg-transparent text-start cursor-pointer" onClick={openWhatsapp}>
              <span className="w-12 h-12 shrink-0 grid place-items-center rounded-full bg-[#e7f8ee] text-[#1faa53]"><WhatsappGlyph /></span>
              <span className="text-lg font-bold text-brand-text">Whatsapp</span>
            </button>
            <button className="w-full flex items-center gap-3.5 pt-5 border-0 bg-transparent text-start cursor-pointer" onClick={onCall}>
              <span className="w-12 h-12 shrink-0 grid place-items-center rounded-full bg-[#e7edff] text-brand-primary"><Phone /></span>
              <span className="text-lg font-bold text-brand-text">Phone</span>
            </button>
          </>
        ) : (
          <p className="pt-5 text-sm font-semibold text-brand-muted">No phone number available for this listing.</p>
        )}
      </div>
    </div>
  )
}
