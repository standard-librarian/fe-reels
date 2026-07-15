import { useState } from 'react'
import { Check, Link, X } from 'lucide-react'

const enc = (url: string) => encodeURIComponent(url)

const Wa = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21h-.01a9.4 9.4 0 0 1-4.8-1.32l-3.9 1.02 1.04-3.8-.25-.4A9.4 9.4 0 1 1 12.05 21z" /></svg>
)
const Messenger = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 2 2 6.14 2 11.25c0 2.88 1.42 5.44 3.65 7.13V22l3.34-1.83c.96.27 1.98.41 3.01.41 5.5 0 10-4.14 10-9.25S17.5 2 12 2zm1.03 12.13-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z" /></svg>
)
const Facebook = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M15 8h-2c-.55 0-1 .45-1 1v2h3l-.5 3H12v7H9v-7H7v-3h2V8.5C9 6.57 10.57 5 12.5 5H15v3z" /></svg>
)
const XLogo = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M18.9 3H21l-6.6 7.5L22 21h-6.1l-4.3-5.6L6.5 21H4.4l7-8L3 3h6.2l3.9 5.1L18.9 3z" /></svg>
)

export function ShareDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const url = `https://www.q84sale.com/en/listing/${id}`
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard?.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  // Messenger has no app-id-free web share endpoint: its Send Dialog requires a
  // registered Facebook App ID. The app scheme is what works in a mobile webview,
  // which is where this ships.
  // TODO: register a Facebook App ID so desktop can fall back to
  // facebook.com/dialog/send — today the Messenger button is a no-op on desktop.
  const apps = [
    { key: 'wa', label: 'WhatsApp', color: 'text-[#25d366]', href: `https://wa.me/?text=${enc(url)}`, glyph: <Wa /> },
    { key: 'msg', label: 'Messenger', color: 'text-[#0084ff]', href: `fb-messenger://share/?link=${enc(url)}`, glyph: <Messenger /> },
    { key: 'fb', label: 'Facebook', color: 'text-[#1877f2]', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, glyph: <Facebook /> },
    { key: 'x', label: 'X', color: 'text-black', href: `https://twitter.com/intent/tweet?url=${enc(url)}`, glyph: <XLogo /> },
  ]

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-[#060a1680] backdrop-blur-[3px] animate-[fade-in_0.2s_ease_both]" onClick={onClose}>
      <div className="w-full max-w-[440px] px-[22px] pt-[22px] pb-[max(30px,env(safe-area-inset-bottom))] rounded-t-xl bg-white animate-[sheet-up_0.28s_cubic-bezier(0.22,1,0.36,1)_both]" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between pb-4 border-b border-brand-divider">
          <h2 className="text-[18px] font-bold text-brand-navy">Share ad</h2>
          <button className="w-[34px] h-[34px] grid place-items-center border-0 rounded-full bg-brand-section text-brand-text" onClick={onClose} aria-label="Close"><X /></button>
        </header>

        <div className="flex justify-center gap-5 my-5">
          {apps.map(app => (
            <a
              key={app.key}
              href={app.href}
              // An app scheme must open in place — _blank would strand an empty tab.
              target={app.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              aria-label={app.label}
              className={`w-14 h-14 grid place-items-center rounded-full bg-brand-section ${app.color}`}
            >
              {app.glyph}
            </a>
          ))}
        </div>

        <p className="mb-2 text-brand-muted text-[13px] font-semibold">Or copy link</p>
        <div className="flex items-center gap-[9px] p-2.5 rounded-lg bg-brand-section text-brand-muted text-[11px] [&>svg]:w-[18px]">
          <Link />
          <span className="flex-1 overflow-hidden">{url}</span>
          <button className="flex items-center gap-1.5 py-[9px] px-3.5 border-0 rounded-sm bg-brand-primary text-white font-bold shrink-0" onClick={copy}>
            {copied ? <><Check size={14} /> Copied</> : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
