// Signing for the 4Sale services API's favorites (wishlist) writes. Mirrors the
// web app's callDirectApi.ts + dataHashing.js: every write carries a per-request
// SHA1 challenge in `X-Custom-Authorization`, plus device/source headers.
//
// Identity (bearer token + device id) is read from the host site's cookies at
// request time — see services/session.ts. The VITE_FAVORITES_* env values only
// serve as fallbacks for local development without the host cookies.

import sha1 from 'sha1'
import { getDeviceId, getSessionToken } from '../../../services/session'

const AUTH_HEADER_ID = 'com.forsale.forsale.web'

const API_URL = import.meta.env.VITE_FAVORITES_API_URL ?? ''
const API_SECRET = import.meta.env.VITE_FAVORITES_API_SECRET ?? ''

export type FavoriteAction = 'addFavorite' | 'removeFavorite'

/** Fully-qualified endpoint URL, e.g. `${base}/V4/Favorites/addFavorite`. */
export function favoritesUrl(action: FavoriteAction): string {
  return `${API_URL}/V4/Favorites/${action}`
}

// btoa over UTF-8 bytes — byte-for-byte the web app's dataHashing.strToBase64.
function strToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  const binString = String.fromCodePoint(...bytes)
  return btoa(binString)
}

// Builds the headers the services API requires for a signed write. `payloadStr`
// MUST be the exact JSON string sent as the request body: the challenge hashes
// those bytes, so a second JSON.stringify (or any reordering) invalidates it.
export function signFavoriteRequest(url: string, payloadStr: string): Record<string, string> {
  const dirArr = url.split('/')
  const last3Segments = `/${dirArr.slice(dirArr.length - 3).join('/')}`
  const timestamp = Math.floor(Date.now() / 1000)

  const challenge = sha1(
    strToBase64(`${AUTH_HEADER_ID}:${last3Segments}:${payloadStr}:${timestamp}:${API_SECRET}`),
  )

  const headers: Record<string, string> = {
    'Application-Source': 'q84sale',
    'Version-Number': 'web',
    'X-Custom-Authorization': `${AUTH_HEADER_ID} ${timestamp} ${challenge}`,
  }
  const deviceId = getDeviceId()
  const token = getSessionToken()
  if (deviceId) headers['Device-Id'] = deviceId
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}
