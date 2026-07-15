// Thin fetch wrapper around the Reels API. Maps contract errors to a typed
// ApiError so callers can branch on `code`.

// The API origin and nothing more — endpoint paths carry their own `/api` prefix,
// so a trailing path here yields `/api/api/...`. The deploy workflow supplies this
// per environment at build time, so shipping to a new environment is a config
// change, never a code change.
//
// Empty means same-origin, and that is a deliberate value — hence `??` and not
// `||`. No hardcoded host fallback on purpose: with `|| STAGING`, a production
// build resolved to the staging API and looked like it was working while serving
// staging data.
//
// TODO(infra): no production reels API exists yet — staging-services is the only
// host serving /api/v1/reels. `main` builds with an empty base (the app's own
// origin), but nothing here proxies /api: the image is a bare nginx serving static
// files. Confirm the ingress routes /api to the backend, or set a production host
// in the workflow, before this ships to prod.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

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
