// Adapters: pure functions that translate API DTOs into the app's Listing model
// (the shape every reel component already consumes). This is the single place the
// contract's field names + fallbacks live — if the backend changes, only this
// file changes.

import type { FeedItemDTO, ReelDetailDTO } from './dto'
import type { Listing, Spec } from '../types'

const DEFAULT_ASPECT_CSS = '9 / 16'
const DEFAULT_SELLER = '4Sale Seller'

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '4S'
  const first = parts[0][0] ?? ''
  const second = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] ?? ''
  return (first + second).toUpperCase() || '4S'
}

/** Compact count for display: 2000 -> "2K", 1500000 -> "1.5M", etc. */
export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`
  return String(n)
}

/** Group thousands for display: "3200" -> "3,200". Leaves non-numeric as-is. */
export function formatPrice(raw: string | number): string {
  const n = Number(String(raw).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && String(raw).trim() !== '' ? n.toLocaleString('en-US') : String(raw)
}

/** Contract "9:16" -> CSS aspect-ratio "9 / 16". */
function aspectToCss(ratio?: string): string {
  if (!ratio) return DEFAULT_ASPECT_CSS
  const [w, h] = ratio.split(/[:/]/).map(s => s.trim())
  return w && h ? `${w} / ${h}` : DEFAULT_ASPECT_CSS
}

function truncate(text: string, max = 130): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

// Fields the contract doesn't provide — sensible defaults so Listing stays valid.
const listingDefaults = {
  negotiable: false,
  wishlistCount: '0',
  wishlisted: false,
  condition: '',
  delivery: false,
  aspectLabel: '9:16 · VIDEO',
  aspectRatio: DEFAULT_ASPECT_CSS,
  descShort: '',
  descFull: '',
  specs: [] as Spec[],
  tags: [] as string[],
  sellerRating: '',
  sellerReviews: '',
  sellerListings: '',
  sellerResp: '',
  sellerSince: '',
} satisfies Partial<Listing>

/** Lightweight feed item -> partial Listing (just what the card + video need). */
export function feedItemToListing(dto: FeedItemDTO): Listing {
  const name = dto.seller?.name || DEFAULT_SELLER
  return {
    ...listingDefaults,
    id: dto.id,
    title: dto.title,
    price: formatPrice(dto.price),
    sellerInit: initialsFrom(name),
    sellerName: name,
    sellerCat: dto.seller?.category_label || dto.district || '',
    verified: Boolean(dto.seller?.verified),
    videoUrl: dto.video.url,
    phone: dto.contact?.phone || dto.phone,
    aspectRatio: aspectToCss(dto.video.aspect_ratio),
    location: dto.district || '',
    views: dto.stats?.views != null ? String(dto.stats.views) : 'New',
    posted: dto.posted_label || 'Today',
    wishlistCount: dto.stats?.wishlist_count != null ? String(dto.stats.wishlist_count) : '0',
    wishlisted: Boolean(dto.stats?.is_wishlist),
  }
}

/** Full detail -> complete Listing (fetched lazily on "View details"). */
export function detailToListing(dto: ReelDetailDTO): Listing {
  const name = dto.user?.name?.trim() || DEFAULT_SELLER
  const description = dto.description?.original || dto.description?.translated || ''
  const title = dto.title.original || dto.title.translated || ''
  const category = dto.categories?.[0]
  const location = dto.district_full_path_en?.filter(Boolean).join(', ') || dto.districts?.[0]?.name_en || ''
  return {
    ...listingDefaults,
    id: dto.id,
    title,
    price: formatPrice(dto.price ?? dto.ad_asking_price ?? ''),
    sellerInit: initialsFrom(name),
    sellerName: name,
    sellerCat: category?.name_en || category?.name_ar || '',
    verified: Boolean(dto.user?.is_verified),
    videoUrl: dto.video_url || '',
    phone: dto.contact_no || dto.user?.phone,
    location,
    views: 'New',
    posted: dto.date_published || 'Today',
    descShort: truncate(description),
    descFull: description,
  }
}
