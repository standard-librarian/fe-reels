// Who is viewing — shared by the feed request and the events stream so the
// backend can attribute wishlist state and interactions to the right person.
//
// - getDeviceId / getUserId: live values from the host site's cookies (env
//   fallbacks for local dev) — see services/session.ts.
// - viewerKey: a stable per-browser id generated + persisted client-side. Used
//   for feed tracking/analytics, not for wishlist identity.

export { getDeviceId, getUserId } from '../../../services/session'

const VIEWER_KEY_STORAGE = 'reels_viewer_key'

/** Stable per-browser viewer id (`viewer-<uuid>`), created once and persisted. */
export function getViewerKey(): string {
  if (typeof window === 'undefined') return ''
  let key = localStorage.getItem(VIEWER_KEY_STORAGE)
  if (!key) {
    key = `viewer-${crypto.randomUUID()}`
    localStorage.setItem(VIEWER_KEY_STORAGE, key)
  }
  return key
}
