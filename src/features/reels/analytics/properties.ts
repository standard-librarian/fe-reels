// The shared property shape every reel event carries. One builder = consistent
// keys across events (names never drift). Deliberately excludes `phone` — PII is
// never a designed property; the sanitizer is the safety net, not the plan.

import type { Listing } from '../types'

export type ReelProps = Record<string, unknown>

export function listingProperties(listing: Listing, rank: number): ReelProps {
  return {
    ListingID: listing.id,
    ReelID: `reel-${listing.id}`,
    Title: listing.title,
    Price: listing.price,
    CategoryName: listing.sellerCat,
    SellerName: listing.sellerName,
    Location: listing.location,
    IsWishlisted: listing.wishlisted,
    RankPosition: rank,
  }
}
