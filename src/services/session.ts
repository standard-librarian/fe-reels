// Identity comes from the host site's cookies — the webview never logs in
// itself. This module is the single reader for both React (AuthContext) and the
// plain API layer (favorites signing, feed/events identity), so the two can
// never disagree and requests always see the freshest values.
//
// Cookies:
// - `user_session`: double URL-encoded JSON { status, profile, token, device_id, environment }
// - `device_id`: a separate plain cookie set by the host site
//
// Env fallbacks (VITE_FAVORITES_TOKEN / VITE_FAVORITES_DEVICE_ID /
// VITE_REELS_USER_ID) keep local development working without the host cookies.

export interface UserProfile {
  user_id: number
  first_name: string
  email: string
  phone: string
  language: string
  region_id: number
  user_type: {
    user_type_name: string
    user_type_id: number
    allow_post_listing: boolean
    permissions: string[]
  }
  has_listings: boolean
}

export interface UserSession {
  status: 'logged_in' | 'guest'
  profile: UserProfile | null
  token: string | null
  device_id: string | null
  environment: string | null
}

const GUEST: UserSession = { status: 'guest', profile: null, token: null, device_id: null, environment: null }

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const entry = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`))
  if (!entry) return null
  const raw = entry.split('=').slice(1).join('=')
  return raw || null
}

export function parseUserSession(): UserSession {
  try {
    const rawValue = readCookie('user_session')
    if (!rawValue) return GUEST

    // Double URL-encoded: decode twice
    const decoded = decodeURIComponent(decodeURIComponent(rawValue))
    const parsed = JSON.parse(decoded) as UserSession

    if (parsed.status !== 'logged_in' || !parsed.profile?.user_id) {
      return { ...parsed, status: 'guest', profile: null }
    }
    return parsed
  } catch {
    return GUEST
  }
}

/** Bearer token for signed writes. Session cookie first, env fallback for dev. */
export function getSessionToken(): string {
  return parseUserSession().token || import.meta.env.VITE_FAVORITES_TOKEN || ''
}

/** The dedicated `device_id` cookie wins; the session JSON's copy and the dev env value are fallbacks. */
export function getDeviceId(): string {
  return readCookie('device_id') || parseUserSession().device_id || import.meta.env.VITE_FAVORITES_DEVICE_ID || ''
}

/** Logged-in user id as a string, or the dev env value, or '' for guests. */
export function getUserId(): string {
  const id = parseUserSession().profile?.user_id
  if (id != null) return String(id)
  return import.meta.env.VITE_REELS_USER_ID ?? ''
}
