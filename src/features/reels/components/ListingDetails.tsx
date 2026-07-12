import { Clock, Eye, Flame, Heart, MapPin, MessageCircle, Phone, Share2, Tag, Truck } from 'lucide-react'
import type { Listing } from '../types'

type ListingDetailsProps = {
  listing: Listing
  expanded: boolean
  favorite: boolean
  onExpand: () => void
  onFavorite: () => void
  onShare: () => void
}

export function ListingDetails({ listing, expanded, favorite, onExpand, onFavorite, onShare }: ListingDetailsProps) {
  return <div className="ld">
    <div className="ld__tags"><span>{listing.sellerCat}</span><span>Used</span></div>
    <h1 className="ld__title">{listing.title}</h1>
    <div className="ld__price">KD {listing.price} {listing.oldPrice ? <del>KD {listing.oldPrice}</del> : null}</div>
    <div className="ld__urgent"><Flame/> 5+ people interested — act fast</div>

    <div className="ld__cta">
      <button className="ld__chat"><MessageCircle/> Chat seller</button>
      <button className="ld__call" aria-label="Call seller"><Phone/></button>
    </div>
    <div className="ld__secondary">
      <button className={`ld-fav ${favorite ? 'is-active' : ''}`} onClick={onFavorite}><Heart fill={favorite ? 'currentColor' : 'none'}/> {favorite ? 'Saved' : 'Favorite'}</button>
      <button className="ld-share" onClick={onShare}><Share2/> Share</button>
      <button className="ld-offer"><Tag/> Make offer</button>
    </div>

    <div className="ld__grid">
      <div><small><MapPin/> Location</small><strong>{listing.location}</strong></div>
      <div><small><Eye/> Views</small><strong>{listing.views}</strong></div>
      <div><small><Clock/> Posted</small><strong>{listing.posted}</strong></div>
      <div><small><Truck/> Delivery</small><strong>{listing.delivery ? 'Available' : 'Pickup only'}</strong></div>
    </div>

    <h2 className="ld__label">Description</h2>
    <p className="ld__desc">{expanded ? listing.descFull : listing.descShort}</p>
    <button className="ld__more" onClick={onExpand}>{expanded ? 'Read less' : 'Read more'}</button>

    {listing.specs.length ? <>
      <h2 className="ld__label ld__label--specs">Specifications</h2>
      <div className="ld__specs">
        {listing.specs.map(spec => <div key={spec.k}><span>{spec.k}</span><span>{spec.v}</span></div>)}
      </div>
    </> : null}
  </div>
}
