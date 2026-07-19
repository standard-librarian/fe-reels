import { Phone, X } from 'lucide-react'
import type { Listing } from '../types'
import { reelsAnalytics } from '../analytics'

type ContactDialogProps = {
  variant: 'whatsapp' | 'call'
  phone: string
  listing: Listing
  rank: number
  onClose: () => void
}

export const WhatsappGlyph = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21h-.01a9.4 9.4 0 0 1-4.8-1.32l-3.9 1.02 1.04-3.8-.25-.4A9.4 9.4 0 1 1 12.05 21z" />
  </svg>
)

export function ContactDialog({ variant, phone, listing, rank, onClose }: ContactDialogProps) {
  const isWa = variant === 'whatsapp'
  // The contract ships one string that may pack several numbers ("123,456") —
  // show one tappable row per number.
  const numbers = phone.split(',').map(n => n.trim()).filter(Boolean)
  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-[rgba(6,10,22,0.5)] backdrop-blur-[4px] animate-[fade-in_0.2s_ease_both]" onClick={onClose}>
      <div className="w-full max-w-[440px] px-[22px] pt-[22px] pb-[max(30px,env(safe-area-inset-bottom))] rounded-t-2xl glass-sheet animate-[sheet-up_0.28s_cubic-bezier(0.22,1,0.36,1)_both]" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between pb-4 border-b border-brand-divider">
          <h2 className="text-[18px] font-bold text-brand-navy">{isWa ? 'Whatsapp' : 'Call Now'}</h2>
          <button className="w-[34px] h-[34px] grid place-items-center border-0 rounded-full bg-brand-section text-brand-text" onClick={onClose} aria-label="Close"><X /></button>
        </header>
        {numbers.length ? numbers.map(number => {
          const digits = number.replace(/[^\d]/g, '')
          const href = isWa ? `https://wa.me/${digits}` : `tel:${number}`
          return (
            <a key={number} className="flex items-center gap-3.5 pt-5 no-underline" href={href} target={isWa ? '_blank' : undefined} rel="noreferrer" onClick={() => reelsAnalytics.contactLinkOpened(listing, rank, variant)}>
              <span className={`w-12 h-12 shrink-0 grid place-items-center rounded-full ${isWa ? 'bg-[#e7f8ee] text-[#1faa53]' : 'bg-[#e7edff] text-brand-primary'}`}>
                {isWa ? <WhatsappGlyph /> : <Phone />}
              </span>
              {/* amp-mask: session replay masks this element so the seller's number is
                  never captured on the recording (the sanitizer can't scrub pixels). */}
              <span className="amp-mask text-lg font-bold text-brand-text">{number}</span>
            </a>
          )
        }) : <p className="pt-5 text-sm font-semibold text-brand-muted">No phone number available for this listing.</p>}
      </div>
    </div>
  )
}
