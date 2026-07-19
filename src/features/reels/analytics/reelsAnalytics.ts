// The typed tracker: the single call surface for reel analytics. Components call
// these named methods (reelsAnalytics.wishlistAdded(listing, rank)) and never
// touch the SDK or event-name strings directly, so the event taxonomy lives in
// exactly one place.
//
// Cost model: Amplitude bills per EVENT, not per property. So the taxonomy is
// tuned for "fewer events, richer properties" — the two high-frequency feed
// events are `Reel Opened` (once per reel becoming active) and `Reel Watched`
// (once per reel on exit, carrying watch depth as properties instead of firing
// separate 25/50/75/completed events). Everything else is a rare, user-initiated
// conversion event, so it stays as-is.

import type { Listing } from '../types'
import { track } from './amplitude'
import { listingProperties } from './properties'

export const EVENT = {
  REEL_OPENED: 'Reel Opened',
  REEL_WATCHED: 'Reel Watched',
  WISHLIST_ADDED: 'Wishlist Added',
  WISHLIST_REMOVED: 'Wishlist Removed',
  CHAT_OPENED: 'Chat Opened',
  CALL_OPENED: 'Call Opened',
  REEL_SHARED: 'Reel Shared',
  DETAILS_OPENED: 'Reel Details Opened',
  CONTACT_LINK_OPENED: 'Contact Link Opened',
} as const

export type ShareChannel = 'wa' | 'msg' | 'fb' | 'x' | 'copy'
export type ContactVariant = 'whatsapp' | 'call'

/** Watch summary emitted once when a reel loses focus — replaces per-milestone events. */
export type WatchSummary = {
  watchedPct: number   // max depth reached, 0..100
  completed: boolean   // reached ≥95%
  dwellMs: number      // wall-clock time the reel was active
}

export const reelsAnalytics = {
  // ── High-frequency feed events (kept lean) ──────────────────────────────
  reelOpened: (listing: Listing, rank: number) =>
    track(EVENT.REEL_OPENED, listingProperties(listing, rank)),

  reelWatched: (listing: Listing, rank: number, watch: WatchSummary) =>
    track(EVENT.REEL_WATCHED, {
      ...listingProperties(listing, rank),
      WatchedPct: watch.watchedPct,
      Completed: watch.completed,
      DwellMs: watch.dwellMs,
    }),

  // ── Rare, user-initiated conversion events (full detail) ─────────────────
  wishlistAdded: (listing: Listing, rank: number) =>
    track(EVENT.WISHLIST_ADDED, listingProperties(listing, rank)),

  wishlistRemoved: (listing: Listing, rank: number) =>
    track(EVENT.WISHLIST_REMOVED, listingProperties(listing, rank)),

  chatOpened: (listing: Listing, rank: number) =>
    track(EVENT.CHAT_OPENED, listingProperties(listing, rank)),

  callOpened: (listing: Listing, rank: number) =>
    track(EVENT.CALL_OPENED, listingProperties(listing, rank)),

  reelShared: (listing: Listing, rank: number, channel: ShareChannel) =>
    track(EVENT.REEL_SHARED, { ...listingProperties(listing, rank), Channel: channel }),

  detailsOpened: (listing: Listing, rank: number) =>
    track(EVENT.DETAILS_OPENED, listingProperties(listing, rank)),

  contactLinkOpened: (listing: Listing, rank: number, variant: ContactVariant) =>
    track(EVENT.CONTACT_LINK_OPENED, { ...listingProperties(listing, rank), Variant: variant }),
}
