// Links from the reels webview back into the main 4Sale website.
//
// Reels is served from its own host (reels.q84sale.com), so every one of these
// needs the website's origin — a bare path would resolve against the reels host
// and 404. Empty base = same origin.
const WEB_BASE_URL = (import.meta.env.VITE_WEB_BASE_URL ?? '').replace(/\/$/, '')

/**
 * Listing page on the main website for a reel.
 *
 * The website's `/listing/[...slug]` route forwards whatever it gets to
 * `v3/listings/advertisements/{slug}`, and that endpoint resolves a bare numeric
 * ad id just as well as a slug (it answers with the canonical slug in the body).
 * The reels feed only ships ids — no slug — so the id is what we link with.
 */
export function listingUrl(id: string): string {
  return `${WEB_BASE_URL}/listing/${encodeURIComponent(id)}`
}

/**
 * Login page on the main website. The webview never authenticates itself — the
 * host site owns the session and hands it back via the `user_session` cookie,
 * which AuthContext re-reads on window focus.
 */
export function loginUrl(): string {
  return `${WEB_BASE_URL}/auth/login`
}

/**
 * Listing page with the chat CTA auto-fired on arrival (`?action=chat`).
 *
 * Starting a conversation can't be done from here: it needs a Firestore lookup
 * for an existing thread and, when there is none, the website's compose modal —
 * which is Redux-only and has no URL of its own. Deep-linking straight to
 * /me/chats/{tab}/{listingId}/{sellerId} does NOT work either: that route
 * redirects to the generic inbox when no conversation exists yet, which is the
 * normal case coming from a reel. So we hand off to the listing page and let
 * ChatBtn there run the flow it already owns.
 */
export function listingChatUrl(id: string): string {
  return `${listingUrl(id)}?action=chat`
}
