// Reels interaction events → POST /api/v1/reels/events. Every user action
// (wishlist, view/progress, share, …) is reported here so the backend can track
// engagement. Fire-and-forget: telemetry must never block a user action or
// surface an error, so failures are swallowed.

import { buildUrl } from './httpClient'
import { getDeviceId, getUserId, getViewerKey } from './identity'

export type ReelEventType =
  | 'wishlist_add'
  | 'wishlist_remove'
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
}

const EVENTS_PATH = '/api/v1/reels/events'

// Events accumulate here while the viewer stays on one reel; the whole batch is
// POSTed as a single list on the next scroll (see flushReelEvents), so a reel's
// wishlist + view (watch-time) events go out together instead of as separate requests.
const queue: ReelEvent[] = []

/** Queue an interaction event. Held until the next flushReelEvents() (per scroll). */
export function enqueueReelEvent(event: ReelEvent): void {
  queue.push(event)
}

/** POST everything queued so far as one batch and clear it. Fire-and-forget. */
export function flushReelEvents(): void {
  if (!queue.length) return
  sendReelEvents(queue.splice(0))
}

/** Send a batch of interaction events. Fire-and-forget — never throws. */
export function sendReelEvents(events: ReelEvent[]): void {
  if (!events.length) return
  const payload = {
    request_id: crypto.randomUUID(),
    viewer_key: getViewerKey(),
    user_id: getUserId(),
    device_id: getDeviceId(),
    client_timestamp: new Date().toISOString(),
    events,
  }
  void fetch(buildUrl(EVENTS_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    // keepalive lets the request finish even if it was triggered by the page
    // being hidden/closed (the unload flush), so the last reel's batch isn't lost.
    keepalive: true,
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
  }
}

// The reel-viewed event: fired once per reel when it loses focus (scroll away).
// This single event both marks the reel as viewed (so the backend can avoid
// re-serving it) and reports how much was watched — 'complete' if watched to the
// end, else 'progress'. There is no separate on-arrival impression event.
//
// watch_ms and visible_ms are genuinely different once seeking exists:
// - watch_ms   = real playback time (seeks/pauses excluded) — drives progress/complete
// - visible_ms = wall-clock time the reel was on screen (dwell), pauses included
export function watchEvent(
  listingId: string,
  rankPosition: number,
  { watchMs, visibleMs, progressPct, completed }: { watchMs: number; visibleMs: number; progressPct: number; completed: boolean },
): ReelEvent {
  return {
    reel_id: `reel-${listingId}`,
    listing_id: Number(listingId),
    event_type: completed ? 'complete' : 'progress',
    rank_position: rankPosition,
    watch_ms: watchMs,
    visible_ms: visibleMs,
    progress_pct: progressPct,
  }
}
