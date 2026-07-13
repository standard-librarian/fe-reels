import { X } from 'lucide-react'
import type { Listing } from '../types'
import { ListingDetails } from './ListingDetails'

type DetailsPanelProps = {
  listing: Listing
  expanded: boolean
  favorite: boolean
  onExpand: () => void
  onClose: () => void
  onFavorite: () => void
  onShare: () => void
}

export function DetailsPanel({ listing, expanded, favorite, onExpand, onClose, onFavorite, onShare }: DetailsPanelProps) {
  return <aside className="details-panel hidden" aria-label="Listing details">
    <button className="absolute top-5 right-5 w-9 h-9 grid place-items-center border-0 rounded-full bg-brand-section text-brand-text z-2 [&_svg]:w-5" onClick={onClose} aria-label="Close details"><X/></button>
    <div className="h-full overflow-y-auto py-[34px] px-[30px] noscroll">
      <ListingDetails listing={listing} expanded={expanded} favorite={favorite} onExpand={onExpand} onFavorite={onFavorite} onShare={onShare}/>
    </div>
  </aside>
}
