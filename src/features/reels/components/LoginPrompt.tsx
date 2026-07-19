import { Heart, X } from 'lucide-react'

type LoginPromptProps = {
  onClose: () => void
}

/** Shown when a guest taps Wishlist: log in on the host site to use it. */
export function LoginPrompt({ onClose }: LoginPromptProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-6 bg-[rgba(6,10,22,0.5)] backdrop-blur-[4px] animate-[fade-in_0.2s_ease_both]" onClick={onClose}>
      <div className="relative w-full max-w-[360px] px-6 pt-8 pb-6 rounded-2xl bg-[linear-gradient(140deg,rgba(255,255,255,0.9),rgba(255,255,255,0.98))] backdrop-blur-[24px] backdrop-saturate-[1.8] border border-white/70 shadow-[0_18px_50px_rgba(0,0,0,0.4)] text-center animate-[modal-pop_0.28s_cubic-bezier(0.22,1,0.36,1)_both]" onClick={e => e.stopPropagation()}>
        <button className="absolute top-3.5 right-3.5 w-[34px] h-[34px] grid place-items-center border-0 rounded-full bg-brand-section text-brand-text cursor-pointer" onClick={onClose} aria-label="Close"><X /></button>
        <span className="mx-auto w-14 h-14 grid place-items-center rounded-full bg-[#ffe9ee] text-wishlist [&_svg]:w-7 [&_svg]:h-7"><Heart /></span>
        <h2 className="mt-4 text-[18px] font-bold text-brand-navy">Login required</h2>
        <p className="mt-2 text-[14px] font-semibold leading-relaxed text-brand-muted">You need to be logged in to add listings to your wishlist.</p>
        <button className="mt-6 w-full h-12 border-0 rounded-full bg-brand-primary text-white text-[15px] font-bold cursor-pointer" onClick={onClose}>OK</button>
      </div>
    </div>
  )
}
