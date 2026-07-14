// Thin fetch wrapper. Development uses the staging API unless VITE_API_BASE_URL
// overrides it. MSW intercepts same-origin requests when explicitly enabled.
// Maps contract errors to a typed ApiError so callers can branch on `code`.

// Endpoint paths already carry their own `/api` prefix, so the base is the bare origin.
const STAGING_API_BASE_URL = 'https://staging-services.q84sale.com'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || STAGING_API_BASE_URL




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
