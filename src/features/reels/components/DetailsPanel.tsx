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
  return <aside className="details-panel" aria-label="Listing details">
    <button className="details-panel__close" onClick={onClose} aria-label="Close details"><X/></button>
    <div className="details-panel__scroll noscroll">
      <ListingDetails listing={listing} expanded={expanded} favorite={favorite} onExpand={onExpand} onFavorite={onFavorite} onShare={onShare}/>
    </div>
  </aside>
}
