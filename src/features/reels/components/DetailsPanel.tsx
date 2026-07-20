import { X } from 'lucide-react'
import type { Listing } from '../types'
import { ListingDetails } from './ListingDetails'

type DetailsPanelProps = {
  listing: Listing
  expanded: boolean
  wishlisted: boolean
  onExpand: () => void
  onClose: () => void
  onWishlist: () => void
  onChat: () => void
  onCall: () => void
  onShare: () => void
}

export function DetailsPanel({ listing, expanded, wishlisted, onExpand, onClose, onWishlist, onChat, onCall, onShare }: DetailsPanelProps) {
  return <aside className="details-panel glass-sheet hidden" aria-label="Listing details">
    <button className="absolute top-5 right-5 w-9 h-9 grid place-items-center border-0 rounded-full bg-brand-section text-brand-text z-2 [&_svg]:w-5" onClick={onClose} aria-label="Close details"><X/></button>
    {/* flex-1 is load-bearing: .details-panel is a row flex container, so without
        it this scroller sizes to its content and the column collapses to the
        width of the widest line (usually the title). min-w-0 lets it shrink
        below that content width instead of overflowing the panel. */}
    {/* flex-1 is load-bearing: .details-panel is a row flex container, so without
        it this scroller sizes to its content and the column collapses to the
        width of the widest line (usually the title). min-w-0 lets it shrink
        below that content width instead of overflowing the panel. */}
    <div className="flex-1 min-w-0 h-full overflow-y-auto py-[34px] px-[30px] noscroll">
      <ListingDetails listing={listing} expanded={expanded} wishlisted={wishlisted} onExpand={onExpand} onWishlist={onWishlist} onChat={onChat} onCall={onCall} onShare={onShare}/>
    </div>
  </aside>
}
