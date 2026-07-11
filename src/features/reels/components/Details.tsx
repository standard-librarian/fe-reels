import { BadgeCheck, Car, Heart, MapPin, MessageCircle, Phone, Share2, ShieldCheck, Star } from 'lucide-react'
import type { Listing } from '../types'
export function Details({listing,expanded,onExpand,onShare,favorite,onFavorite}:{listing:Listing;expanded:boolean;onExpand:()=>void;onShare:()=>void;favorite:boolean;onFavorite:()=>void}){
 return <section className="details">
  <div className="details__heading"><div><h1>{listing.title}</h1><div className="price">KD {listing.price} {listing.oldPrice?<del>KD {listing.oldPrice}</del>:null} {listing.discount?<em>{listing.discount}</em>:null}</div></div><button className={`save ${favorite?'save--active':''}`} onClick={onFavorite}><Heart fill={favorite?'currentColor':'none'}/> {favorite?'Saved':'Favorite'}</button></div>
  <div className="actions-row"><button className="primary"><Phone/>Call seller</button><button><MessageCircle/>Chat</button><button onClick={onShare}><Share2/></button></div>
  <div className="badges"><span><ShieldCheck/> {listing.condition}</span><span><Car/> Delivery {listing.delivery?'available':'pickup'}</span></div>
  <div className="meta"><span><MapPin/> {listing.location}</span><span>{listing.views} views</span><span>{listing.posted}</span></div>
  <p>{expanded?listing.descFull:listing.descShort} <button className="link" onClick={onExpand}>{expanded?'Read less':'Read more'}</button></p>
  <h2>Vehicle details</h2><div className="specs">{listing.specs.map(s=><div key={s.k}><small>{s.k}</small><strong>{s.v}</strong></div>)}</div>
  <div className="tags">{listing.tags.map(t=><span key={t}>#{t}</span>)}</div>
  <div className="seller-card"><div className="avatar avatar--blue">{listing.sellerInit}</div><div><strong>{listing.sellerName} <BadgeCheck size={15}/></strong><small>Member for {listing.sellerSince} · {listing.sellerListings} listings</small></div><b><Star size={15} fill="currentColor"/> {listing.sellerRating}</b></div>
 </section>
}
