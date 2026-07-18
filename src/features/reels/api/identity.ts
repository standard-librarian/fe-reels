// Who is viewing — shared by the feed request and the events stream so the
// backend can attribute wishlist state and interactions to the right person.
//
// - deviceId / userId: identify the (test) logged-in user; the backend keys
//   is_wishlist on these. Static from env for now (see favoritesAuth note).
// - viewerKey: a stable per-browser id generated + persisted client-side. Used
//   for feed tracking/analytics, not for wishlist identity.

const VIEWER_KEY_STORAGE = 'reels_viewer_key'

export const deviceId = import.meta.env.VITE_FAVORITES_DEVICE_ID ?? ''
export const userId = import.meta.env.VITE_REELS_USER_ID

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
