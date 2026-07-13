import { Link, Mail, MessageCircle, X } from 'lucide-react'

export function ShareDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const copy = () => navigator.clipboard.writeText(`q84sale.com/reels/${id}`)

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-[#060a1680] backdrop-blur-[3px] animate-[fade-in_0.2s_ease_both]" onClick={onClose}>
      <div className="share w-full max-w-[440px] px-[22px] pt-[22px] pb-[max(30px,env(safe-area-inset-bottom))] rounded-t-xl bg-white animate-[sheet-up_0.28s_cubic-bezier(0.22,1,0.36,1)_both]" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between">
          <h2 className="text-[17px]">Share this listing</h2>
          <button className="w-[34px] h-[34px] border-0 rounded-full" onClick={onClose}><X /></button>
        </header>
        <div className="flex justify-around my-4">
          <span className="flex flex-col items-center gap-[7px] text-brand-muted text-[11px]"><i className="not-italic w-14 h-14 grid place-items-center rounded-2xl bg-[#25d366] text-white"><MessageCircle /></i>WhatsApp</span>
          <span className="flex flex-col items-center gap-[7px] text-brand-muted text-[11px]"><i className="not-italic w-14 h-14 grid place-items-center rounded-2xl bg-brand-text text-white"><MessageCircle /></i>Messages</span>
          <span className="flex flex-col items-center gap-[7px] text-brand-muted text-[11px]"><i className="not-italic w-14 h-14 grid place-items-center rounded-2xl bg-brand-primary text-white"><Mail /></i>Email</span>
        </div>
        <div className="flex items-center gap-[9px] p-2.5 rounded-lg bg-brand-section text-brand-muted text-[11px] [&>svg]:w-[18px]">
          <Link />
          <span className="flex-1 overflow-hidden">q84sale.com/reels/{id}</span>
          <button className="py-[9px] px-3.5 border-0 rounded-[7px] bg-brand-primary text-white font-bold" onClick={copy}>Copy</button>
        </div>
      </div>
    </div>
  )
}
