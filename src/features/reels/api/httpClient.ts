// Thin fetch wrapper. Base URL comes from VITE_API_BASE_URL (empty = same origin,
// which is what MSW intercepts in dev). Maps the contract's error responses to a
// typed ApiError so callers can branch on `code` (e.g. "invalid_cursor").

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// TODO(auth): the contract says "authenticated user", but the auth boundary is
// per-endpoint and still TBD — you do NOT need to be logged in to watch reels.
// Working assumption (confirm with backend):
//   - GET  feed            -> public (no login to browse/watch)
//   - GET  detail          -> authenticated (reveals contact info) on "View details"
//   - GET  increment-views -> anonymous or attributed (TBD)
// When the token/cookie strategy is known, attach it here (Authorization header
// and/or `credentials: 'include'`), ideally only on the endpoints that need it.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'ApiError'
  }
}

type Params = Record<string, string | number | undefined | null>

function buildUrl(path: string, params?: Params): string {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function toApiError(res: Response): Promise<ApiError> {
  let code = `http_${res.status}`
  try {
    const body = await res.json()
    if (body && typeof body.error === 'string') code = body.error
  } catch {
    /* non-JSON body */
  }
  return new ApiError(res.status, code)
}

export async function apiGet<T>(path: string, params?: Params): Promise<T> {
  const res = await fetch(buildUrl(path, params), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw await toApiError(res)
  return (await res.json()) as T
}
