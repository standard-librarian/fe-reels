// Reels interaction events → POST /api/v1/reels/events. Every user action
// (wishlist, view/progress, share, …) is reported here so the backend can track
// engagement. Fire-and-forget: telemetry must never block a user action or
// surface an error, so failures are swallowed.

import { buildUrl } from './httpClient'
import { deviceId, userId, getViewerKey } from './identity'

export type ReelEventType =
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'impression'
  | 'progress'
  | 'complete'
  | 'share'

export type ReelEvent = {
  reel_id: string
  listing_id: number
  event_type: ReelEventType
  rank_position: number
  watch_ms?: number
  visible_ms?: number
  progress_pct?: number
  source?: string
}

const EVENTS_PATH = '/api/v1/reels/events'

/** Send a batch of interaction events. Fire-and-forget — never throws. */
export function sendReelEvents(events: ReelEvent[]): void {
  if (!events.length) return
  const payload = {
    request_id: crypto.randomUUID(),
    viewer_key: getViewerKey(),
    user_id: userId,
    device_id: deviceId,
    client_timestamp: new Date().toISOString(),
    events,
  }
  void fetch(buildUrl(EVENTS_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* telemetry is best-effort */
  })
}

/** Build the wishlist event for a reel at its current feed position. */
export function wishlistEvent(listingId: string, rankPosition: number, added: boolean): ReelEvent {
  return {
    reel_id: `reel-${listingId}`,
    listing_id: Number(listingId),
    event_type: added ? 'wishlist_add' : 'wishlist_remove',
    rank_position: rankPosition,
    source: 'feed',
  }
}
