import { Clock, Eye, Flame, Heart, MapPin, MessageCircle, Phone, Share2, Tag, Truck } from 'lucide-react'
import type { Listing } from '../types'

type ListingDetailsProps = {
  listing: Listing
  expanded: boolean
  wishlisted: boolean
  onExpand: () => void
  onWishlist: () => void
  onChat: () => void
  onCall: () => void
  onShare: () => void
}

export function ListingDetails({ listing, expanded, wishlisted, onExpand, onWishlist, onChat, onCall, onShare }: ListingDetailsProps) {
  return <div className="flex flex-col">
    <div className="flex flex-wrap gap-1.5 mb-4">{['sellerCat' as const, 'used' as const].map((key, i) => <span key={i} className="px-3 py-[5px] rounded-full bg-brand-section text-brand-muted text-xs font-semibold">{key === 'used' ? 'Used' : listing.sellerCat}</span>)}</div>

    <div className="m-0 mb-1 text-[30px] font-bold tracking-[-0.5px] text-brand-primary">KD {listing.price} {listing.oldPrice ? <del className="ml-2 text-sm text-brand-muted font-medium">KD {listing.oldPrice}</del> : null}</div>
    <h1 className="m-0 mb-3.5 text-lg font-bold leading-[1.3] text-brand-text">{listing.title}</h1>

    <div className="flex items-center gap-1.5 m-0 mb-4 py-2.5 px-3.5 rounded-[12px] border-l-[3px] border-l-urgent bg-[#fff5f0] text-urgent text-xs font-bold [&_svg]:w-4 [&_svg]:shrink-0"><Flame /> 5+ people interested — act fast</div>

    <div className="flex gap-2.5 mb-2.5">
      <button className="glass-cta flex-1 h-12 flex items-center justify-center gap-2 border-0 rounded-xl text-white font-bold text-sm transition-[box-shadow,transform,filter] duration-150 ease-out active:scale-[0.97] [&_svg]:w-[18px]" onClick={onChat}><MessageCircle /> Chat seller</button>
      <button className="glass-chip-primary w-12 h-12 grid place-items-center rounded-xl text-brand-primary transition-[background,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.94] [&_svg]:w-5" aria-label="Call seller" onClick={onCall}><Phone /></button>
    </div>

    <div className="flex gap-2 mb-5">
      <button className={`glass-chip flex-1 h-10 flex items-center justify-center gap-1.5 rounded-full text-brand-text text-xs font-semibold transition-[background,border-color,box-shadow,color,transform] duration-150 ease-out active:scale-[0.96] [&_svg]:w-[15px] ld-wishlist ${wishlisted ? '!text-wishlist !border-[#ffd0d8] !bg-[#fff5f7]' : ''}`} onClick={onWishlist}><Heart fill={wishlisted ? 'currentColor' : 'none'} /> {wishlisted ? 'Wishlisted' : 'Wishlist'}</button>
      <button className="glass-chip ld-share flex-1 h-10 flex items-center justify-center gap-1.5 rounded-full text-brand-text text-xs font-semibold transition-[background,border-color,box-shadow,color,transform] duration-150 ease-out active:scale-[0.96] [&_svg]:w-[15px]" onClick={onShare}><Share2 /> Share</button>
      <button className="glass-chip ld-offer flex-1 h-10 flex items-center justify-center gap-1.5 rounded-full text-brand-text text-xs font-semibold transition-[background,border-color,box-shadow,color,transform] duration-150 ease-out active:scale-[0.96] [&_svg]:w-[15px]"><Tag /> Make offer</button>
    </div>

    <div className="flex gap-0 mb-5 border border-brand-bg rounded-xl overflow-hidden">
      <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 bg-white not-last:border-r not-last:border-r-brand-bg [&_svg]:text-brand-muted"><MapPin size={15} /><strong className="text-xs font-bold text-center leading-[1.2]">{listing.location}</strong></div>
      <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 bg-white not-last:border-r not-last:border-r-brand-bg [&_svg]:text-brand-muted"><Eye size={15} /><strong className="text-xs font-bold text-center leading-[1.2]">{listing.views}</strong></div>
      <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 bg-white not-last:border-r not-last:border-r-brand-bg [&_svg]:text-brand-muted"><Clock size={15} /><strong className="text-xs font-bold text-center leading-[1.2]">{listing.posted}</strong></div>
      <div className="flex-1 flex flex-col items-center gap-1 py-3 px-2 bg-white not-last:border-r not-last:border-r-brand-bg [&_svg]:text-brand-muted"><Truck size={15} /><strong className="text-xs font-bold text-center leading-[1.2]">{listing.delivery ? 'Delivery' : 'Pickup'}</strong></div>
    </div>

    <h2 className="m-0 mb-2 text-[11px] font-bold tracking-[0.06em] uppercase text-brand-muted">Description</h2>
    <p className="m-0 text-sm leading-[1.65] text-brand-muted">{expanded ? listing.descFull : listing.descShort}</p>
    <button className="mt-1.5 p-0 border-0 bg-none text-brand-primary font-bold text-[13px] self-start" onClick={onExpand}>{expanded ? 'Read less' : 'Read more'}</button>

    {listing.specs.length ? <>
      <h2 className="m-0 mb-2 mt-5 text-[11px] font-bold tracking-[0.06em] uppercase text-brand-muted">Specifications</h2>
      <div className="border border-brand-bg rounded-xl overflow-hidden">
        {listing.specs.map(spec => <div key={spec.k} className="flex justify-between gap-3 py-[11px] px-3.5 border-b border-b-brand-section last:border-b-0"><span className="text-brand-muted text-xs">{spec.k}</span><span className="text-xs font-bold">{spec.v}</span></div>)}
      </div>
    </> : null}
  </div>
}
